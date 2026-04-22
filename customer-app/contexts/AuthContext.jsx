import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Linking, Platform, Alert } from 'react-native';
import * as LinkingExpo from 'expo-linking';
import * as Device from 'expo-device';
import api, { API_URL } from '../utils/api';
import { navigate } from '../navigation/RootNavigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewLogin, setIsNewLogin] = useState(false);
  const [likedProviders, setLikedProviders] = useState([]);
  // OAuth-related UI state (e.g. shows 'email does not exist' after Google login-only)
  const [oauthError, setOauthError] = useState(null);
  // When true, the OAuth flow was run in 'login-only' mode and signup should be disabled
  const [oauthLoginOnly, setOauthLoginOnly] = useState(false);

  // Load liked providers from the new API
  const loadLikedProviders = async () => {
    try {
      const res = await api.get('/api/liked-barbers');
      const providers = res.data.likedProviders || [];
      setLikedProviders(providers);
    } catch (err) {
      const errMsg = err.message || String(err);
      const status = err.response?.status;
      // For server errors, show a warning but keep UX functional
      if (status && status >= 500) {
        console.warn('Server error while loading liked providers (status', status + '):', errMsg);
      } else if (!err.response) {
        console.warn('Network error while loading liked providers:', errMsg);
      } else {
        console.error('Error loading liked providers:', errMsg, 'status:', status);
      }
      setLikedProviders([]);
    }
  };



  // --- ROOT/JAILBREAK DETECTION ---
  useEffect(() => {
    (async () => {
      try {
        const isRooted = await Device.isRootedExperimentalAsync();
        if (isRooted) {
          Alert.alert(
            "Security Warning",
            "This device appears to be rooted or jailbroken. For your security, some features may not work correctly, and your data could be at risk.",
            [{ text: "I Understand" }]
          );
        }
      } catch (e) {
        console.warn("Root detection failed:", e);
      }
    })();
  }, []);

  useEffect(() => {
    // ... other imports

    // ... inside AuthProvider
    const loadUser = async () => {
      // 1. Try to get token from Secure Storage
      let storedToken = await SecureStore.getItemAsync('token');

      // 2. MIGRATION LOGIC: If not in valid storage, check old AsyncStorage
      if (!storedToken) {
        const oldToken = await AsyncStorage.getItem('token');
        if (oldToken) {
          console.log('Migrating token to SecureStore...');
          await SecureStore.setItemAsync('token', oldToken);
          await AsyncStorage.removeItem('token');
          storedToken = oldToken;
        }
      }

      if (storedToken) {
        setToken(storedToken);
        // Ensure axios has the header immediately
        api.defaults.headers.common['x-auth-token'] = storedToken;
        try {
          // Explicitly pass headers for the initial load to bypass any race conditions
          const res = await api.get('/api/auth/user', {
            headers: { 'x-auth-token': storedToken }
          });
          // Support both response shapes: { user } or direct user object
          setUser(res.data.user || res.data);
          // Load liked providers from the new API
          await loadLikedProviders();
        } catch (err) {
          // Better diagnostics for network / Axios errors
          const errMsg = err.message || String(err);
          const isNetwork = !err.response;
          console.error('Error loading user:', errMsg, 'code:', err.code || '', 'isAxiosError:', err.isAxiosError || false, 'status:', err.response?.status);
          if (isNetwork) {
            // Transient network issue: keep token so user doesn't get logged out immediately.
            console.warn('Network error when loading user. Please check device connectivity or backend reachability.');
          } else {
            // For non-network errors (bad token, etc.), clear session
            try { await logout(); } catch (e) { console.warn('Logout failed after loadUser error', e); }
          }
        }
      }
      setIsLoading(false);
    };

    loadUser();

    // Handle deep links for OAuth (accept exp://, custom scheme, or other oauth URLs)
    const handleDeepLink = async (event) => {
      const url = event.url;
      if (!url || !url.includes('oauth')) return;

      console.log('AuthContext deep link received:', url);

      const parsed = LinkingExpo.parse(url);
      // Check for explicit error (e.g. ?error=signup_not_allowed) in query or fragment
      const error = parsed.queryParams?.error || (url.match(/[?&]error=([^&#]+)/) || url.match(/[#&]error=([^&]+)/) || [])[1];
      // Detect if backend indicated this was a login-only flow
      const loginOnlyFlag = parsed.queryParams?.login_only === '1' || parsed.queryParams?.login_only === 'true';
      if (error === 'signup_not_allowed') {
        console.log('AuthContext: OAuth error received - navigating to Login and setting oauthError');
        try { navigate('Login'); } catch (e) { console.warn('Navigation to Login failed', e); }
        setOauthError('signup_not_allowed');
        setOauthLoginOnly(!!loginOnlyFlag);
        Alert.alert('Login not allowed', loginOnlyFlag ? 'No account exists for this Google email and signup is disabled for this flow. Please sign in with a different Google account or contact support.' : 'No account exists for this Google email. Please sign in with a different Google account or contact support.');
        return;
      }

      if (error === 'role_not_allowed') {
        console.log('AuthContext: OAuth role mismatch received via deep link');
        const requiredRole = parsed.queryParams?.required_role || (url.match(/[?&]required_role=([^&]+)/) || [])[1];
        try { navigate('Login'); } catch (e) { console.warn('Navigation to Login failed', e); }
        setOauthError('role_not_allowed');
        setOauthLoginOnly(false);
        Alert.alert('Access denied', `This Google account is not a ${requiredRole || 'required'} account. Please sign in with the correct account or use a different login method.`);
        return;
      }

      // Robust token extraction: query param, fragment, access_token, or path
      let incomingToken = parsed.queryParams?.token || parsed.queryParams?.access_token || null;

      if (!incomingToken) {
        // Fragment (after #) or other forms
        const fragMatch = url.match(/[#&]token=([^&]+)/) || url.match(/[#&]access_token=([^&]+)/);
        if (fragMatch) incomingToken = fragMatch[1];
      }

      if (!incomingToken) {
        // Generic fallback
        const generalMatch = url.match(/[?&#]token=([^&]+)/) || url.match(/[?&#]access_token=([^&]+)/);
        if (generalMatch) incomingToken = generalMatch[1];
      }

      if (!incomingToken && url.includes('token=')) {
        // Last resort: crude extraction
        const m = url.match(/token=([^&\/]+)/);
        if (m && m[1]) incomingToken = m[1];
      }

      if (incomingToken) {
        console.log('OAuth token extracted (len):', incomingToken.length);
        // 1. Save Token State
        setToken(incomingToken);
        await SecureStore.setItemAsync('token', incomingToken);

        // 2. Update Global Defaults (for future requests)
        api.defaults.headers.common['x-auth-token'] = incomingToken;
        api.defaults.headers.common['authorization'] = `Bearer ${incomingToken}`;

        // 3. CRITICAL: Pass headers EXPLICITLY for this immediate request to avoid race
        api.get('/api/auth/user', {
          headers: { 'x-auth-token': incomingToken, 'Authorization': `Bearer ${incomingToken}` }
        })
          .then(res => {
            const email = res.data.email || res.data.user?.email;
            console.log('AuthContext: User profile loaded after OAuth:', email);
            setUser(res.data.user || res.data);
            // Clear any previous OAuth denial flag (we are now signed in)
            setOauthLoginOnly(false);
            setOauthError(null);

            // Load liked providers but don't block navigation
            loadLikedProviders().catch(e => {
              console.warn('Failed to load liked providers after OAuth:', e?.message || e);
            });

            // Navigate to Home so user sees they are logged in
            try {
              console.log('AuthContext: navigating to Home after OAuth');
              navigate('Home');
            } catch (e) {
              console.warn('Navigation to Home failed:', e);
            }

            // Show a short alert to confirm login
            try { Alert.alert('Signed in', `Welcome back, ${email}`); } catch (e) { }
          })
          .catch(err => {
            console.error('Error loading user after OAuth:', err?.message || err);
            // If the server rejects token, clear stored token to avoid bad state
            if (err.response && (err.response.status === 401 || err.response.status === 400)) {
              console.warn('OAuth token rejected by server; clearing token and showing login.');
              setToken(null);
              AsyncStorage.removeItem('token');
              // Clear login-only flag (so UI does not incorrectly keep signup disabled)
              setOauthLoginOnly(false);
            }
          });
      } else {
        console.log('No OAuth token found in deep link');
      }
    };

    const subscription = LinkingExpo.addEventListener('url', handleDeepLink);

    // Check initial URL
    LinkingExpo.getInitialURL().then(url => {
      if (url && url.includes('oauth')) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      setToken(res.data.token);
      await SecureStore.setItemAsync('token', res.data.token);
      const userRes = await api.get('/api/auth/user');
      setIsNewLogin(true);
      setUser(userRes.data);
      await loadLikedProviders();
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    setLikedProviders([]);
    // Clear OAuth login-only flag when user explicitly logs out
    setOauthLoginOnly(false);
    delete api.defaults.headers.common['x-auth-token'];
    await SecureStore.deleteItemAsync('token');
  };

  const updateProfile = async (data) => {
    try {
      await api.put('/api/auth/user', data);
      const userRes = await api.get('/api/auth/user');
      setUser(userRes.data);
      return true;
    } catch (err) {
      console.error('Profile update error:', err);
      return false;
    }
  };

  const verifyTwoFactorOtp = async (email, otp) => {
    try {
      await api.post('/api/auth/2fa/verify', { token: otp });
      return true;
    } catch (err) {
      console.error('2FA verification error:', err);
      return false;
    }
  };

  // New liked providers API functions
  const likeProvider = async (providerId, providerType) => {
    try {
      const res = await api.post('/api/liked-barbers/add', {
        providerId,
        providerType
      });

      // Update local state immediately
      setLikedProviders(prev => [...prev, { providerId, providerType, likedAt: new Date() }]);
      return 'added';
    } catch (err) {
      if (err.response && err.response.status === 400 && err.response.data.msg === 'Provider already liked') {
        // Already liked, so unlike it
        const success = await unlikeProvider(providerId, providerType);
        if (success) {
          return 'removed';
        }
      }
      console.error('Error toggling provider:', err);
      return false;
    }
  };

  const unlikeProvider = async (providerId, providerType) => {
    try {
      await api.delete(`/api/liked-barbers/remove/${providerId}/${providerType}`);
      // Update local state immediately
      setLikedProviders(prev => prev.filter(like => !(like.providerId === providerId && like.providerType === providerType)));
      return true;
    } catch (err) {
      console.error('Error unliking provider:', err);
      // Even if unliking fails, refresh the data to ensure consistency
      await loadLikedProviders();
      return false;
    }
  };

  const checkIsLiked = useCallback((providerId, providerType) => {
    if (!Array.isArray(likedProviders)) {
      return false;
    }
    return likedProviders.some(
      like => like.providerId === providerId && like.providerType === providerType
    );
  }, [likedProviders]);

  const fetchUser = async () => {
    try {
      const res = await api.get('/api/auth/user');
      setUser(res.data);
      await loadLikedProviders();
    } catch (err) {
      const errMsg = err.message || String(err);
      const isNetwork = !err.response;
      console.error('Error fetching user:', errMsg, 'code:', err.code || '', 'status:', err.response?.status);
      if (isNetwork) {
        console.warn('Network error while fetching user — not logging out automatically.');
      } else {
        await logout();
      }
    }
  };

  // Google OAuth login for mobile
  // Options: { loginOnly: boolean }
  const googleLogin = async ({ loginOnly = false } = {}) => {
    try {
      // Build a deep link for this device and pass it to the server as 'mobile_redirect'
      const redirectUri = LinkingExpo.createURL('oauth');
      const params = `mobile_redirect=${encodeURIComponent(redirectUri)}${loginOnly ? '&login_only=1' : ''}&prompt=select_account`;
      const oauthUrl = `${API_URL}/api/auth/google?${params}`;

      // Open OAuth URL in browser
      const supported = await Linking.canOpenURL(oauthUrl);
      if (supported) {
        await Linking.openURL(oauthUrl);
        return { success: true, message: 'Opening Google authentication. Complete the login and return to the app.' };
      } else {
        return { success: false, message: 'Cannot open OAuth URL' };
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      return { success: false, message: 'Failed to initiate Google OAuth' };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isNewLogin,
      setIsNewLogin,
      login,
      logout,
      googleLogin,
      updateProfile,
      verifyTwoFactorOtp,
      likedProviders,
      setLikedProviders,
      likeProvider,
      unlikeProvider,
      checkIsLiked,
      loadLikedProviders,
      fetchUser,
      // OAuth error state and helpers
      oauthError,
      setOauthError,
      // OAuth login-only flag: when true, signup via OAuth should be disabled in the UI
      oauthLoginOnly,
      setOauthLoginOnly
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
