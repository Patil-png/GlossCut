import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likedProviders, setLikedProviders] = useState([]);

  // Load liked providers from the new API
  const loadLikedProviders = async () => {
    try {
      const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/liked-barbers`);
      const providers = res.data.likedProviders || [];
      setLikedProviders(providers);
    } catch (err) {
      console.error('Error loading liked providers:', err);
      setLikedProviders([]);
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const storedToken = await AsyncStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        axios.defaults.headers.common['x-auth-token'] = storedToken;
        try {
          const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/user`);
          setUser(res.data);
          // Load liked providers from the new API
          await loadLikedProviders();
        } catch (err) {
          console.error('Error loading user:', err);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/login`, { email, password });
      setToken(res.data.token);
      axios.defaults.headers.common['x-auth-token'] = res.data.token;
      await AsyncStorage.setItem('token', res.data.token);
      const userRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/user`);
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
    delete axios.defaults.headers.common['x-auth-token'];
    await AsyncStorage.removeItem('token');
  };

  const updateProfile = async (data) => {
    try {
      await axios.put(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/user`, data);
      const userRes = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/user`);
      setUser(userRes.data);
      return true;
    } catch (err) {
      console.error('Profile update error:', err);
      return false;
    }
  };

  const verifyTwoFactorOtp = async (email, otp) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/2fa/verify`, { token: otp }, {
        headers: {
          'x-auth-token': token
        }
      });
      return true;
    } catch (err) {
      console.error('2FA verification error:', err);
      return false;
    }
  };

  // New liked providers API functions
  const likeProvider = async (providerId, providerType) => {
    try {
      const res = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/api/liked-barbers/add`, {
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
      await axios.delete(`${process.env.EXPO_PUBLIC_API_URL}/api/liked-barbers/remove/${providerId}/${providerType}`);
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
      const res = await axios.get(`${process.env.EXPO_PUBLIC_API_URL}/api/auth/user`);
      setUser(res.data);
      await loadLikedProviders();
    } catch (err) {
      console.error('Error fetching user:', err);
      logout();
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
      updateProfile,
      verifyTwoFactorOtp,
      likedProviders,
      setLikedProviders,
      likeProvider,
      unlikeProvider,
      checkIsLiked,
      loadLikedProviders,
      fetchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
