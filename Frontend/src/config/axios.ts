// src/config/axios.ts
// Axios interceptor to add authentication token to all requests

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors (optional but recommended)
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('Unauthorized - token may be invalid');
      
      // Optional: Clear storage and redirect to login
      // await AsyncStorage.removeItem('accessToken');
      // await AsyncStorage.removeItem('user');
      // Navigate to login screen
    }
    
    return Promise.reject(error);
  }
);

export default axios;
