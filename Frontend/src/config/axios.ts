// src/config/axios.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './api';

// Set base URL globally
axios.defaults.baseURL = API_CONFIG.BASE_URL;
axios.defaults.timeout = API_CONFIG.TIMEOUT;
axios.defaults.headers.common['Content-Type'] = 'application/json';

// Request interceptor - adds token to all requests
axios.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error getting token from storage:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - log 401 but DON'T auto-clear tokens
// (clearing tokens on 401 causes race conditions on first load)
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('401 Unauthorized on:', error.config?.url);
    }
    return Promise.reject(error);
  }
);

export default axios;
