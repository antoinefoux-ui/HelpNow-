/**
 * apiClient.ts
 *
 * Central Axios instance for the app.
 * - Automatically attaches the Bearer token from AsyncStorage on every request.
 * - On 401 "Token expired" responses, clears stored credentials and fires
 *   an event that AuthContext listens to so it can reset state and redirect
 *   to the login screen — without creating a circular import.
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG } from '../config/api';

// ---------------------------------------------------------------------------
// Simple event bus — decouples apiClient from AuthContext (avoids circular dep)
// ---------------------------------------------------------------------------
type AuthEventListener = () => void;
const authEventListeners: AuthEventListener[] = [];

export const onTokenExpired = (listener: AuthEventListener) => {
  authEventListeners.push(listener);
  // Return an unsubscribe function
  return () => {
    const idx = authEventListeners.indexOf(listener);
    if (idx !== -1) authEventListeners.splice(idx, 1);
  };
};

const emitTokenExpired = () => {
  authEventListeners.forEach(fn => fn());
};

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------
export const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — attach stored token to every outgoing request
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem('accessToken');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// ---------------------------------------------------------------------------
// Response interceptor — handle 401 Token expired globally
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  response => response,
  async (error: AxiosError<{ success: boolean; error: string }>) => {
    if (error.response?.status === 401) {
      const serverMessage = error.response.data?.error ?? '';

      if (
        serverMessage === 'Token expired' ||
        serverMessage === 'Invalid token' ||
        serverMessage === 'Unauthorized'
      ) {
        // Clear persisted auth data
        await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);

        // Notify AuthContext (and anyone else listening) to reset state
        emitTokenExpired();
      }
    }

    return Promise.reject(error);
  },
);
