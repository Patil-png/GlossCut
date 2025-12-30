import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ;

const api = axios.create({
  baseURL: API_URL,
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
    if (error.response && error.response.status === 401) {
      console.log('401 Unauthorized response received. Attempting to log out.');
      if (onLogoutCallback) {
        await onLogoutCallback();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
