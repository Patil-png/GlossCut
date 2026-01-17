import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform, Alert } from 'react-native';
import * as LinkingExpo from 'expo-linking';
import { setAuthLogout } from '../utils/api'; 
import api, { API_URL } from '../utils/api'; 
import { navigate } from '../navigation/RootNavigation'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // OAuth error state for login-only flows
  const [oauthError, setOauthError] = useState(null);

  // Effect to set the logout callback for the API interceptor
  useEffect(() => {
    setAuthLogout(logout);
  }, []); 

  // Load user on startup
  useEffect(() => {
    const loadUser = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        // Set header immediately for subsequent requests
        api.defaults.headers.common['x-auth-token'] = storedToken;
        api.defaults.headers.common['authorization'] = `Bearer ${storedToken}`;
        
        try {
          const res = await api.get('/api/auth/user'); 
          setUser({ ...res.data, id: res.data._id, token: storedToken });
        } catch (err) {
          console.error('Load user error:', err);
          await logout();
        }
      }
      setIsLoading(false);
    };

    loadUser();

    // ============================================================
    // HANDLE DEEP LINKS (OAuth Return)
    // ============================================================
    const handleDeepLink = (event) => {
      const url = event.url;
      console.log('Deep Link Received:', url);
      
      // 1. Try standard parsing first
      let parsed = LinkingExpo.parse(url);
      let incomingToken = parsed.queryParams?.token;
      const error = parsed.queryParams?.error || (url.match(/[?&]error=([^&]+)/) || [])[1];

      // If OAuth returned a login-only error, show a friendly message and abort
      if (error === 'signup_not_allowed') {
        console.log('AuthContext: OAuth login-only error received via deep link');
        // Ensure Login screen is visible immediately and set state
        try { navigate('Login'); } catch (e) { console.warn('Navigation to Login failed', e); }
        console.log('AuthContext: setting oauthError signup_not_allowed');
        setOauthError('signup_not_allowed');
        Alert.alert('Login not allowed', 'This email does not exist in our system. Please sign in with your existing account. Tap "Sign up" to create an account.');
        return;
      }

      // If OAuth returned a role mismatch (e.g., non-barber trying to login via barber flow)
      if (error === 'role_not_allowed') {
        console.log('AuthContext: OAuth role mismatch received via deep link');
        const requiredRole = parsed.queryParams?.required_role || (url.match(/[?&]required_role=([^&]+)/) || [])[1];
        try { navigate('Login'); } catch (e) { console.warn('Navigation to Login failed', e); }
        setOauthError('role_not_allowed');
        Alert.alert('Access denied', `This Google account is not a ${requiredRole || 'barber'} account. Please sign in with an account that has the ${requiredRole || 'barber'} role or use a different login method.`);
        return;
      }

      // 2. Fallback: Manually extract token if parser failed
      // This fixes cases where Expo/Google hides the token in the path
      if (!incomingToken && url.includes('token=')) {
        const match = url.match(/token=([^&]*)/);
        if (match && match[1]) {
          incomingToken = match[1];
        }
      }

      if (incomingToken) {
        console.log('✅ Token found:', incomingToken);
        
        // 1. Save Token State
        setToken(incomingToken);
        AsyncStorage.setItem('token', incomingToken);
        
        // 2. Update Global Defaults (for future requests)
        api.defaults.headers.common['x-auth-token'] = incomingToken;
        api.defaults.headers.common['authorization'] = `Bearer ${incomingToken}`;

        // 3. CRITICAL FIX: Pass headers EXPLICITLY for this immediate request.
        // This prevents the 401 Race Condition where the request fires before 
        // AsyncStorage or Global Defaults are fully updated.
        api.get('/api/auth/user', {
            headers: { 'x-auth-token': incomingToken, 'Authorization': `Bearer ${incomingToken}` } 
        })
          .then(res => {
            console.log('✅ User Profile Loaded:', res.data.email);
            setUser({ ...res.data, id: res.data._id, token: incomingToken });
          })
          .catch(err => {
            console.error('❌ Error loading user after OAuth:', err.message);
          });
      } else {
        console.log('❌ No token found in URL');
      }
    };

    // Listen for incoming links
    const subscription = LinkingExpo.addEventListener('url', handleDeepLink);

    // Check if app was opened via link (Cold Start)
    LinkingExpo.getInitialURL().then(url => {
      if (url) {
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
      const newToken = res.data.token;
      
      setToken(newToken);
      await AsyncStorage.setItem('token', newToken);
      api.defaults.headers.common['x-auth-token'] = newToken; 
      api.defaults.headers.common['authorization'] = `Bearer ${newToken}`;
      
      const userRes = await api.get('/api/auth/user'); 
      setUser({ ...userRes.data, id: userRes.data._id, token: newToken });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const barberLogin = async (email, password) => {
    try {
      const res = await api.post('/api/auth/barber/login', { email, password }); 
      const newToken = res.data.token;
      
      setToken(newToken);
      await AsyncStorage.setItem('token', newToken);
      api.defaults.headers.common['x-auth-token'] = newToken; 
      api.defaults.headers.common['authorization'] = `Bearer ${newToken}`;
      
      const userRes = await api.get('/api/auth/user'); 
      setUser({ ...userRes.data, id: userRes.data._id, token: newToken });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['x-auth-token'];
    await AsyncStorage.removeItem('token');
  };

  const updateProfile = async (data) => {
    try {
      await api.put('/api/auth/user', data); 
      const userRes = await api.get('/api/auth/user'); 
      setUser({ ...userRes.data, id: userRes.data._id, token: token });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const verifyTwoFactorOtp = async (email, otp) => {
    try {
      await api.post('/api/auth/2fa/verify', { token: otp }); 
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const refreshUser = async () => {
    try {
      const userRes = await api.get('/api/auth/user'); 
      setUser({ ...userRes.data, id: userRes.data._id, token: token });
    } catch (err) {
      console.error('Failed to refresh user:', err);
      await logout(); 
    }
  };

  const updateShopProfile = async (data) => {
    try {
      await api.put('/api/shop', data); 
      const userRes = await api.get('/api/auth/user'); 
      setUser({ ...userRes.data, id: userRes.data._id, token: token });
      return true;
    } catch (err) {
      console.error('Error updating shop profile:', err);
      return false;
    }
  };

  const updateAvailability = async (isAvailable) => {
    try {
      await api.put('/api/auth/availability', { isAvailable }); 
      setUser(prev => prev ? { ...prev, isAvailable } : null);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // ============================================================
  // GOOGLE LOGIN
  // ============================================================
  // Google OAuth login for mobile
  // Options: { loginOnly: boolean, requiredRole: string }
  const googleLogin = async ({ loginOnly = false, requiredRole = null } = {}) => {
    try {
      // 1. Generate the correct deep link for this device
      const redirectUri = LinkingExpo.createURL('oauth');
      console.log('Generated Mobile Redirect:', redirectUri);

      // 2. Send this URL to the backend
      const params = `mobile_redirect=${encodeURIComponent(redirectUri)}${loginOnly ? '&login_only=1' : ''}${requiredRole ? `&required_role=${encodeURIComponent(requiredRole)}` : ''}`;
      const oauthUrl = `${API_URL}/api/auth/google?${params}`;

      // 3. Open the System Browser
      const supported = await Linking.canOpenURL(oauthUrl);
      if (supported) {
        await Linking.openURL(oauthUrl);
        return { success: true, message: 'Opening Google authentication...' };
      } else {
        return { success: false, message: 'Cannot open OAuth URL' };
      }
    } catch (error) {
      console.error('Google OAuth error:', error);
      return { success: false, message: 'Failed to initiate Google OAuth' };
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, token, isLoading, login, barberLogin, googleLogin, logout, updateProfile, verifyTwoFactorOtp, refreshUser, updateAvailability, updateShopProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);