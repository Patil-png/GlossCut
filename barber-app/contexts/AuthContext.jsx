import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import * as LinkingExpo from 'expo-linking';
import { setAuthLogout } from '../utils/api'; // Import setAuthLogout
import api, { API_URL } from '../utils/api'; // Import the custom api instance

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Effect to set the logout callback for the API interceptor
  useEffect(() => {
    setAuthLogout(logout);
  }, []); // Run once on mount

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await api.get('/api/auth/user'); // Use the custom api instance
          setUser({ ...res.data, id: res.data._id, token: storedToken });
        } catch (err) {
          console.error(err);
          // If token is invalid, log out the user
          await logout();
        }
      }
      setIsLoading(false);
    };

    loadUser();

    // Handle deep links for OAuth
    const handleDeepLink = (event) => {
      const url = event.url;
      if (url.startsWith('barberapp://oauth')) {
        const parsed = LinkingExpo.parse(url);
        const token = parsed.queryParams?.token;
        if (token) {
          // Set the token and load user
          setToken(token);
          AsyncStorage.setItem('token', token);
          api.get('/api/auth/user').then(res => {
            setUser({ ...res.data, id: res.data._id, token: token });
          }).catch(err => {
            console.error('Error loading user after OAuth:', err);
          });
        }
      }
    };

    const subscription = LinkingExpo.addEventListener('url', handleDeepLink);

    // Check initial URL
    LinkingExpo.getInitialURL().then(url => {
      if (url && url.startsWith('barberapp://oauth')) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password }); // Use the custom api instance
      const newToken = res.data.token;
      setToken(newToken);
      await AsyncStorage.setItem('token', newToken);
      api.defaults.headers.common['x-auth-token'] = newToken; // Set token immediately
      const userRes = await api.get('/api/auth/user'); // Use the custom api instance
      setUser({ ...userRes.data, id: userRes.data._id, token: newToken });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const barberLogin = async (email, password) => {
    try {
      const res = await api.post('/api/auth/barber/login', { email, password }); // Use the custom api instance
      const newToken = res.data.token;
      setToken(newToken);
      await AsyncStorage.setItem('token', newToken);
      api.defaults.headers.common['x-auth-token'] = newToken; // Set token immediately
      const userRes = await api.get('/api/auth/user'); // Use the custom api instance
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
    await AsyncStorage.removeItem('token');
  };

  const updateProfile = async (data) => {
    try {
      await api.put('/api/auth/user', data); // Use the custom api instance
      const userRes = await api.get('/api/auth/user'); // Use the custom api instance
      setUser({ ...userRes.data, id: userRes.data._id, token: token });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const verifyTwoFactorOtp = async (email, otp) => {
    try {
      await api.post('/api/auth/2fa/verify', { token: otp }); // Use the custom api instance
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const refreshUser = async () => {
    try {
      const userRes = await api.get('/api/auth/user'); // Use the custom api instance
      setUser({ ...userRes.data, id: userRes.data._id, token: token });
    } catch (err) {
      console.error('Failed to refresh user:', err);
      await logout(); // Log out if refreshing user fails (e.g., token expired)
    }
  };

  const updateShopProfile = async (data) => {
    try {
      await api.put('/api/shop', data); // Use the custom api instance
      const userRes = await api.get('/api/auth/user'); // Use the custom api instance
      setUser({ ...userRes.data, id: userRes.data._id, token: token });
      return true;
    } catch (err) {
      console.error('Error updating shop profile:', err);
      return false;
    }
  };

  const updateAvailability = async (isAvailable) => {
    try {
      await api.put('/api/auth/availability', { isAvailable }); // Use the custom api instance
      // Update the user state
      setUser(prev => prev ? { ...prev, isAvailable } : null);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Google OAuth login for barber app
  const googleLogin = async () => {
    try {
      // Open OAuth URL with platform parameter for mobile
      const oauthUrl = `${API_URL}/api/auth/google?platform=barber`;

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
    <AuthContext.Provider value={{ user, setUser, token, isLoading, login, barberLogin, googleLogin, logout, updateProfile, verifyTwoFactorOtp, refreshUser, updateAvailability, updateShopProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
