import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform, Alert } from 'react-native';
import * as LinkingExpo from 'expo-linking';
import api, { API_URL } from '../utils/api';
import { navigate } from '../navigation/RootNavigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likedProviders, setLikedProviders] = useState([]);
  // OAuth-related UI state (e.g. shows 'email does not exist' after Google login-only)
  const [oauthError, setOauthError] = useState(null);

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

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        // Ensure axios has the header immediately (interceptor already reads AsyncStorage,
        // but setting header here avoids races during initial load)
        api.defaults.headers.common['x-auth-token'] = storedToken;
        try {
          const res = await api.get('/api/auth/user');
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
    const handleDeepLink = (event) => {
      const url = event.url;
      if (!url || !url.includes('oauth')) return;

      const parsed = LinkingExpo.parse(url);
      // Check for explicit error (e.g. ?error=signup_not_allowed)
      const error = parsed.queryParams?.error || (url.match(/[?&]error=([^&]+)/) || [])[1];
      if (error === 'signup_not_allowed') {
        // Ensure Login screen is visible immediately and set state
        console.log('AuthContext: OAuth error received - navigating to Login and setting oauthError');
        try { navigate('Login'); } catch (e) { console.warn('Navigation to Login failed', e); }
        setOauthError('signup_not_allowed');
        // Also show a simple alert as fallback (visible immediately)
        Alert.alert('Login not allowed', 'This email does not exist in our system. Please sign in with your existing account. Tap "Sign up" to create an account.');
        return;
      }
      // Try parsed query param first; fallback to manual regex extraction
      const token = parsed.queryParams?.token || (url.match(/[?&]token=([^&]+)/) || [])[1];
      if (token) {
        // Set the token and load user
        setToken(token);
        AsyncStorage.setItem('token', token);
        api.defaults.headers.common['x-auth-token'] = token; // Set token immediately
        api.get('/api/auth/user').then(res => {
          setUser(res.data.user || res.data);
          loadLikedProviders();
        }).catch(err => {
          console.error('Error loading user after OAuth:', err);
        });
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
      await AsyncStorage.setItem('token', res.data.token);
      const userRes = await api.get('/api/auth/user');
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
    delete api.defaults.headers.common['x-auth-token'];
    await AsyncStorage.removeItem('token');
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

  const checkIsLiked = (providerId, providerType) => {
    if (!Array.isArray(likedProviders)) {
      console.log('checkIsLiked: likedProviders is not an array', likedProviders);
      return false;
    }
    const result = likedProviders.some(
      like => like.providerId === providerId && like.providerType === providerType
    );
    console.log('checkIsLiked:', providerId, providerType, 'result:', result, 'likedProviders length:', likedProviders.length);
    return result;
  };

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
      const params = `mobile_redirect=${encodeURIComponent(redirectUri)}${loginOnly ? '&login_only=1' : ''}`;
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
      setUser,
      token,
      isLoading,
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
      setOauthError
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
