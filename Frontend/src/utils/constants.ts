/**
 * App-wide constants
 */

export const APP_NAME = 'HelpNow';
export const APP_VERSION = '1.0.0';

/**
 * API Configuration
 */
export const API_CONFIG = {
  BASE_URL: process.env.API_URL || 'http://localhost:3000/api/v1',
  SOCKET_URL: process.env.SOCKET_URL || 'http://localhost:3000',
  TIMEOUT: 30000, // 30 seconds
};

/**
 * Emergency Types
 */
export const EMERGENCY_TYPES = {
  HEART_ATTACK: 'heart_attack',
  ACCIDENT: 'accident',
  FALL: 'fall',
  BREATHING_DIFFICULTY: 'breathing_difficulty',
  LOSS_CONSCIOUSNESS: 'loss_consciousness',
  ALLERGIC_REACTION: 'allergic_reaction',
  OTHER: 'other',
} as const;

/**
 * Helper Training Levels
 */
export const TRAINING_LEVELS = {
  CPR_AED: 'cpr_aed',
  FIRST_AID: 'first_aid',
  EMT: 'emt',
  PARAMEDIC: 'paramedic',
  NURSE: 'nurse',
  DOCTOR: 'doctor',
  LIFEGUARD: 'lifeguard',
  WILDERNESS_FIRST_AID: 'wilderness_first_aid',
} as const;

/**
 * Emergency Status
 */
export const EMERGENCY_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  HELPER_EN_ROUTE: 'helper_en_route',
  HELPER_ARRIVED: 'helper_arrived',
  RESOLVED: 'resolved',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
} as const;

/**
 * Colors
 */
export const COLORS = {
  // Primary
  primary: '#E53E3E',
  primaryDark: '#C53030',
  primaryLight: '#FC8181',

  // Secondary
  secondary: '#3B82F6',
  secondaryDark: '#2563EB',
  secondaryLight: '#60A5FA',

  // Success
  success: '#10B981',
  successDark: '#059669',
  successLight: '#34D399',

  // Warning
  warning: '#F59E0B',
  warningDark: '#D97706',
  warningLight: '#FBBF24',

  // Error
  error: '#EF4444',
  errorDark: '#DC2626',
  errorLight: '#F87171',

  // Neutrals
  black: '#1A202C',
  gray900: '#2D3748',
  gray700: '#4A5568',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9CA3AF',
  gray300: '#CBD5E0',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  gray50: '#F9FAFB',
  white: '#FFFFFF',

  // Special
  background: '#F7FAFC',
  surface: '#FFFFFF',
  border: '#E2E8F0',
};

/**
 * Spacing
 */
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Font Sizes
 */
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

/**
 * Border Radius
 */
export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

/**
 * Map Configuration
 */
export const MAP_CONFIG = {
  DEFAULT_ZOOM: 15,
  DEFAULT_REGION: {
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  },
  MARKER_SIZE: 50,
};

/**
 * Limits
 */
export const LIMITS = {
  MAX_EMERGENCY_CONTACTS: 5,
  MAX_ADDRESSES: 3,
  MAX_DESCRIPTION_LENGTH: 500,
  MAX_RESPONSE_RADIUS: 20000, // 20km in meters
  MIN_RESPONSE_RADIUS: 500, // 500m
  DEFAULT_RESPONSE_RADIUS: 5000, // 5km
};

/**
 * Timeouts
 */
export const TIMEOUTS = {
  EMERGENCY_REQUEST_EXPIRY: 30 * 60 * 1000, // 30 minutes
  LOCATION_UPDATE_INTERVAL: 10000, // 10 seconds
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

/**
 * Emergency Numbers by Country
 */
export const EMERGENCY_NUMBERS: Record<string, string> = {
  EU: '112',
  US: '911',
  UK: '999',
  FR: '112',
  DE: '112',
  ES: '112',
  IT: '112',
  PL: '112',
};

/**
 * Supported Languages
 */
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
];

/**
 * Regex Patterns
 */
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s-()]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
};

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@helpnow:auth_token',
  REFRESH_TOKEN: '@helpnow:refresh_token',
  USER_DATA: '@helpnow:user_data',
  LANGUAGE: '@helpnow:language',
  ONBOARDING_COMPLETED: '@helpnow:onboarding_completed',
};

/**
 * Socket Events
 */
export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Helper
  HELPER_SET_AVAILABILITY: 'helper:set_availability',
  HELPER_AVAILABILITY_UPDATED: 'helper:availability_updated',

  // Emergency
  EMERGENCY_CREATE: 'emergency:create',
  EMERGENCY_NEW_REQUEST: 'emergency:new_request',
  EMERGENCY_ACCEPT: 'emergency:accept',
  EMERGENCY_HELPER_ACCEPTED: 'emergency:helper_accepted',
  EMERGENCY_UPDATE_LOCATION: 'emergency:update_location',
  HELPER_LOCATION_UPDATE: 'helper:location_update',
  EMERGENCY_HELPER_ARRIVED: 'emergency:helper_arrived',
  HELPER_ARRIVED: 'helper:arrived',
  EMERGENCY_RESOLVE: 'emergency:resolve',
  EMERGENCY_RESOLVED: 'emergency:resolved',
  EMERGENCY_CANCEL: 'emergency:cancel',
  EMERGENCY_CANCELLED: 'emergency:cancelled',
  EMERGENCY_JOIN: 'emergency:join',
  EMERGENCY_LEAVE: 'emergency:leave',

  // Ping
  PING: 'ping',
  PONG: 'pong',
};

/**
 * Animation Durations
 */
export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  slow: 500,
};

/**
 * Screen Names
 */
export const SCREENS = {
  // Auth
  SPLASH: 'Splash',
  ONBOARDING: 'Onboarding',
  SIGN_IN: 'SignIn',
  SIGN_UP: 'SignUp',
  FORGOT_PASSWORD: 'ForgotPassword',

  // Main
  HOME: 'Home',
  ACTIVITY: 'Activity',
  HELPER_MODE: 'HelperMode',
  PROFILE: 'Profile',

  // Emergency
  EMERGENCY_REQUEST: 'EmergencyRequest',
  ACTIVE_EMERGENCY: 'ActiveEmergency',
  HELPER_RESPONSE: 'HelperResponse',

  // Profile
  EDIT_PROFILE: 'EditProfile',

  // Settings
  SETTINGS: 'Settings',
  LEGAL: 'Legal',
};
