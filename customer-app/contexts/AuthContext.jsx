import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';
import * as LinkingExpo from 'expo-linking';
import api, { API_URL } from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likedProviders, setLikedProviders] = useState([]);

  // Load liked providers from the new API
  const loadLikedProviders = async () => {
    try {
      const res = await api.get('/api/liked-barbers');
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
          console.error('Error loading user:', err);
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
      console.error('Error fetching user:', err);
      logout();
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
      fetchUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
