// src/config/api.ts
// Centralized API configuration for the HelpNow app

export const API_CONFIG = {
  BASE_URL: 'http://10.0.2.2:3000/api/v1',  // ✅ Works in Android emulator
  SOCKET_URL: 'http://10.0.2.2:3000',
  // ...
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
  
  // Helpers
  HELPERS: {
    LIST: '/helpers',
    GET: (helperId: string) => `/helpers/${helperId}`,
    UPDATE_AVAILABILITY: (helperId: string) => `/helpers/${helperId}/availability`,
    UPDATE_LOCATION: (helperId: string) => `/helpers/${helperId}/location`,
    STATS: (helperId: string) => `/helpers/${helperId}/stats`,
  },
};

// Socket Events
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  
  // Emergency events
  EMERGENCY_CREATED: 'emergency:created',
  EMERGENCY_ACCEPTED: 'emergency:accepted',
  EMERGENCY_CANCELLED: 'emergency:cancelled',
  EMERGENCY_RESOLVED: 'emergency:resolved',
  
  // Helper events
  HELPER_LOCATION_UPDATE: 'helper:location_update',
  HELPER_ARRIVED: 'helper:arrived',
  HELPER_AVAILABILITY: 'helper:set_availability',
  
  // Room events
  JOIN_EMERGENCY: 'join:emergency',
  LEAVE_EMERGENCY: 'leave:emergency',
  
  // Message events
  MESSAGE_SEND: 'message:send',
  MESSAGE_RECEIVED: 'message:received',
};

export default API_CONFIG;
