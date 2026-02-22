/**
 * config/axios.ts
 *
 * Configures the global axios instance.
 * Import this ONCE at the app entry point (e.g., App.tsx or index.ts).
 *
 * Sets up:
 *  - baseURL
 *  - request interceptor: attaches Bearer token from AsyncStorage
 *  - response interceptor: on 401, attempts silent token refresh before
 *    falling back to clearing auth state and firing the tokenExpired event
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, API_ENDPOINTS } from './api';

// Separate axios instance used exclusively for the token-refresh call.
// Bypasses the global interceptors to avoid infinite retry loops.
const refreshClient = axios.create({ baseURL: API_CONFIG.BASE_URL });

// ---------------------------------------------------------------------------
// Base config
// ---------------------------------------------------------------------------
axios.defaults.baseURL = API_CONFIG.BASE_URL;
axios.defaults.timeout = 10_000;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json, text/plain, */*';

// ---------------------------------------------------------------------------
// Token-expired event bus
// Decouples this module from AuthContext to avoid circular imports.
// AuthContext subscribes via onTokenExpired(); this module fires the event.
// ---------------------------------------------------------------------------
type Listener = () => void;
const listeners: Listener[] = [];

export const onTokenExpired = (fn: Listener): (() => void) => {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i !== -1) listeners.splice(i, 1);
  };
};

const emitTokenExpired = () => listeners.forEach(fn => fn());

// ---------------------------------------------------------------------------
// Request interceptor — attach stored token on every outbound request
// ---------------------------------------------------------------------------
axios.interceptors.request.use(
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
// Response interceptor — handle expired / invalid tokens globally
// ---------------------------------------------------------------------------
// Augment config type to carry the one-shot retry flag.
type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

axios.interceptors.response.use(
  response => response,
  async (error: AxiosError<{ success: boolean; error: string }>) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const msg = error.response.data?.error ?? '';

      if (
        msg === 'Token expired' ||
        msg === 'Invalid token' ||
        msg === 'Unauthorized'
      ) {
        // --- attempt silent refresh ---
        const storedRefreshToken = await AsyncStorage.getItem('refreshToken');

        if (storedRefreshToken) {
          originalRequest._retry = true; // prevent infinite loop
          try {
            const refreshResponse = await refreshClient.post(
              API_ENDPOINTS.AUTH.REFRESH,
              { refreshToken: storedRefreshToken },
            );
            const newAccessToken =
              refreshResponse.data?.data?.accessToken as string | undefined;

            if (newAccessToken) {
              await AsyncStorage.setItem('accessToken', newAccessToken);
              originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`);
              return axios(originalRequest); // retry original request
            }
          } catch {
            // refresh itself failed — fall through to sign-out
          }
        }

        // No refresh token available or refresh failed → sign out
        console.warn('[axios] 401 Token expired — clearing auth state');
        await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
        emitTokenExpired();
      }
    }

    return Promise.reject(error);
  },
);

export default axios;
