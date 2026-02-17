// src/config/axios.ts
// Axios interceptor to add authentication token to all requests

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from './api';

// Set base URL globally so all requests use the right server
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
      return config;
    } catch (error) {
      console.error('Error getting token from storage:', error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401 errors
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.log('Unauthorized - clearing tokens');
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    }
    return Promise.reject(error);
  }
);

export default axios;
