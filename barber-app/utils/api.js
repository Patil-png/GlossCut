import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

import { Platform } from 'react-native';

const PROD_URL = 'https://api.glosscut.com';
export const API_URL = process.env.EXPO_PUBLIC_API_URL || PROD_URL;

// console.log('🔹 [API] Initialized with URL:', API_URL);

if (API_URL.includes('localhost') && Platform.OS === 'android') {
  // console.warn('⚠️ Using localhost on Android may fail. Use 10.0.2.2 instead.');
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
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      // Debug: Check for extra quotes or whitespace
      const cleanToken = token.trim().replace(/^"|"$/g, '');
      console.log(`🔹 API Req: ${config.url} | Token: ${cleanToken.substring(0, 10)}... | Headers set`);

      config.headers['x-auth-token'] = cleanToken;
      config.headers['Authorization'] = `Bearer ${cleanToken}`;
    } else {
      console.warn(`🔸 API Req: ${config.url} | No token in SecureStore!`);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Updates: ${response.config.url} | Status: ${response.status}`);
    return response;
  },
  async (error) => {
    // Handle unauthorized centrally
    if (error.response && error.response.status === 401) {
      console.log(`❌ 401 Unauthorized: ${error.config?.url} | Token: ${error.config?.headers['x-auth-token']?.substring(0, 10)}...`);
      console.log(`Attempting to log out.`);

      // Avoid calling logout multiple times when many requests fail concurrently
      if (onLogoutCallback && !api.__logoutInProgress) {
        try {
          api.__logoutInProgress = true;
          await onLogoutCallback();
        } finally {
          api.__logoutInProgress = false;
        }
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
