// src/config/api.ts

export const API_CONFIG = {
  BASE_URL: 'https://helpnow-production.up.railway.app/api/v1',
  TIMEOUT: 10000, // 10 seconds
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
};

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  
  // Users
  USERS: {
    GET: (userId: string) => `/users/${userId}`,
    CREATE: '/users',
    UPDATE: (userId: string) => `/users/${userId}`,
    DELETE: (userId: string) => `/users/${userId}`,
    UPLOAD_PHOTO: (userId: string) => `/users/${userId}/photo`,
    CERTIFICATIONS: (userId: string) => `/users/${userId}/certifications`,
    VERIFY_PHONE: (userId: string) => `/users/${userId}/verify-phone`,
    SEND_VERIFICATION: (userId: string) => `/users/${userId}/send-verification`,
  },
  
  // Emergencies
  EMERGENCIES: {
    CREATE: '/emergencies',
    GET: (requestId: string) => `/emergencies/${requestId}`,
    ACTIVE: (userId: string) => `/emergencies/active/${userId}`,
    NEARBY: '/emergencies/nearby',
    HISTORY: (userId: string) => `/emergencies/history/${userId}`,
    ACCEPT: (requestId: string) => `/emergencies/${requestId}/accept`,
    CANCEL: (requestId: string) => `/emergencies/${requestId}/cancel`,
    HELPER_LOCATION: (requestId: string) => `/emergencies/${requestId}/helper-location`,
    ARRIVED: (requestId: string) => `/emergencies/${requestId}/arrived`,
    RESOLVE: (requestId: string) => `/emergencies/${requestId}/resolve`,
    VOICE_NOTE: (requestId: string) => `/emergencies/${requestId}/voice-note`,
  },
};
