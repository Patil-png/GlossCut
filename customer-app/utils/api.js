import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ;

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
    // Mark network errors for easier debugging
    if (!error.response) {
      error.isNetworkError = true;
      error.customMessage = error.message || 'Network error. Please check your connection.';
      console.error('Network or timeout error from API:', error.message);
    }

    // Handle unauthorized centrally with guard
    if (error.response && error.response.status === 401) {
      console.log('401 Unauthorized response received. Attempting to log out.');
      if (onLogoutCallback && !api.__logoutInProgress) {
        try {
          api.__logoutInProgress = true;
          await onLogoutCallback();
        } finally {
          api.__logoutInProgress = false;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
