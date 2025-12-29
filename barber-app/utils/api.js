import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

if (API_URL === 'http://localhost:5000') {
  console.warn('API_URL not set (EXPO_PUBLIC_API_URL). Using fallback http://localhost:5000 — ensure device can reach this host.');
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000, // 15s timeout to avoid hanging requests
  headers: {
    'Content-Type': 'application/json',
  },
});

let onLogoutCallback = null;

export const setAuthLogout = (callback) => {
  onLogoutCallback = callback;
};

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle unauthorized centrally
    if (error.response && error.response.status === 401) {
      console.log('401 Unauthorized response received. Attempting to log out.');
      if (onLogoutCallback) {
        await onLogoutCallback();
      }
    }

    // Network errors or timeouts don't have a response
    if (!error.response) {
      error.isNetworkError = true;
      error.customMessage = error.message || 'Network error. Please check your connection.';
      console.error('Network or timeout error from API:', error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
