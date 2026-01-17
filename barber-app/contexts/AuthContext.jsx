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

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        api.defaults.headers.common['x-auth-token'] = storedToken; // Ensure header is set
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
      
      // Parse the URL (Handles both 'exp://' and 'barberapp://' schemes)
      const parsed = LinkingExpo.parse(url);
      
      // Look for token in query params
      const token = parsed.queryParams?.token;

      if (token) {
        // Set token immediately
        setToken(token);
        AsyncStorage.setItem('token', token);
        api.defaults.headers.common['x-auth-token'] = token;

        // Fetch User Data
        api.get('/api/auth/user')
          .then(res => {
            setUser({ ...res.data, id: res.data._id, token: token });
          })
          .catch(err => {
            console.error('Error loading user after OAuth:', err);
          });
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
  // GOOGLE LOGIN (FIXED)
  // ============================================================
  const googleLogin = async () => {
    try {
      // 1. Generate the correct deep link for this device (Expo Go vs Standalone)
      // This creates URLs like "exp://192.168.x.x:8081/--/oauth" automatically
      const redirectUri = LinkingExpo.createURL('oauth');
      
      console.log('Generated Mobile Redirect:', redirectUri);

      // 2. Send this URL to the backend
      // The backend will pass it to Google and redirect back to it
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