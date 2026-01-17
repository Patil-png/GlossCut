import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import * as LinkingExpo from 'expo-linking';
import { setAuthLogout } from '../utils/api'; 
import api, { API_URL } from '../utils/api'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

        // 3. CRITICAL FIX: Pass header EXPLICITLY for this immediate request.
        // This prevents the 401 Race Condition where the request fires before 
        // AsyncStorage or Global Defaults are fully updated.
        api.get('/api/auth/user', {
            headers: { 'x-auth-token': incomingToken } 
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
  const googleLogin = async () => {
    try {
      // 1. Generate the correct deep link for this device
      const redirectUri = LinkingExpo.createURL('oauth');
      console.log('Generated Mobile Redirect:', redirectUri);

      // 2. Send this URL to the backend
      const oauthUrl = `${API_URL}/api/auth/google?mobile_redirect=${encodeURIComponent(redirectUri)}`;

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