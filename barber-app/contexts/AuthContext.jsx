import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthLogout } from '../utils/api'; // Import setAuthLogout
import api from '../utils/api'; // Import the custom api instance

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

  return (
    <AuthContext.Provider value={{ user, setUser, token, isLoading, login, barberLogin, logout, updateProfile, verifyTwoFactorOtp, refreshUser, updateAvailability, updateShopProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
