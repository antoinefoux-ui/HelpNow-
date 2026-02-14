// User Types
export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  createdAt: Date;
  isHelper: boolean;
  isActive: boolean;
  language: Language;
  emergencyContacts: EmergencyContact[];
  addresses: Address[];
  medicalInfo?: MedicalInfo;
  helperProfile?: HelperProfile;
  rating: number;
  totalHelps: number;
  verified: boolean;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface Address {
  id: string;
  label: string; // 'home', 'work', etc.
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  apartmentNumber?: string;
  buildingCode?: string;
  floorNumber?: string;
  arrivalInstructions?: string;
  latitude: number;
  longitude: number;
  isPrimary: boolean;
}

export interface MedicalInfo {
  bloodType?: string;
  allergies: string[];
  chronicConditions: string[];
  medications: string[];
  medicalDevices: string[];
  accessibilityNeeds: string[];
}

export interface HelperProfile {
  trainingLevel: TrainingLevel;
  certifications: Certification[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  languagesSpoken: Language[];
  situationsWillingToHelp: EmergencyType[];
  availabilitySchedule: AvailabilitySchedule;
  responseRadius: number; // in meters
  isAvailable: boolean;
  responseTime: number; // average in seconds
  successfulHelps: number;
}

export type TrainingLevel = 
  | 'no_training'
  | 'basic_first_aid'
  | 'advanced_first_aid'
  | 'cpr_aed'
  | 'professional'; // paramedic, nurse, doctor

export interface Certification {
  id: string;
  type: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  documentUrl: string;
  verified: boolean;
}

export interface AvailabilitySchedule {
  always: boolean;
  specificHours?: {
    [key in DayOfWeek]?: TimeRange[];
  };
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface TimeRange {
  start: string; // "09:00"
  end: string; // "17:00"
}

// Emergency Request Types
export interface EmergencyRequest {
  id: string;
  seekerId: string;
  seekerInfo: {
    name: string;
    photo?: string;
    phone: string;
  };
  type: EmergencyType;
  description?: string;
  voiceNoteUrl?: string;
  location: Location;
  address: string;
  status: RequestStatus;
  createdAt: Date;
  acceptedAt?: Date;
  resolvedAt?: Date;
  helpersNotified: string[];
  acceptedHelperId?: string;
  acceptedHelperInfo?: {
    name: string;
    photo?: string;
    phone: string;
    trainingLevel: TrainingLevel;
    rating: number;
    eta: number;
  };
  rating?: number;
  feedback?: string;
}

export type EmergencyType = 
  | 'heart_attack'
  | 'accident'
  | 'fall'
  | 'breathing_difficulty'
  | 'loss_consciousness'
  | 'allergic_reaction'
  | 'other';

export type RequestStatus = 
  | 'pending'
  | 'accepted'
  | 'helper_en_route'
  | 'helper_arrived'
  | 'resolved'
  | 'cancelled'
  | 'expired';

export interface Location {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  Main: undefined;
  EmergencyRequest: undefined;
  ActiveEmergency: { requestId: string };
  HelperResponse: { requestId: string };
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  Help: undefined;
  Legal: { type: 'terms' | 'privacy' | 'cookies' };
};

export type MainTabParamList = {
  Home: undefined;
  Activity: undefined;
  HelperMode: undefined;
  Profile: undefined;
};

// Language Types
export type Language = 
  | 'en'
  | 'fr'
  | 'es'
  | 'pl'
  | 'ru'
  | 'uk'
  | 'sk'
  | 'cs'
  | 'de'
  | 'it';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Notification Types
export interface PushNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;
  timestamp: Date;
}

export type NotificationType = 
  | 'emergency_request'
  | 'helper_accepted'
  | 'helper_arrived'
  | 'emergency_resolved'
  | 'rating_request'
  | 'certification_expiring'
  | 'system_update';

// Socket Events
export type SocketEvent = 
  | 'emergency:created'
  | 'emergency:accepted'
  | 'emergency:cancelled'
  | 'helper:location_update'
  | 'helper:arrived'
  | 'emergency:resolved';

export interface SocketEventData {
  event: SocketEvent;
  data: any;
}

// Settings Types
export interface AppSettings {
  notifications: {
    enabled: boolean;
    emergencyAlerts: boolean;
    systemUpdates: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    sound: boolean;
    vibration: boolean;
  };
  privacy: {
    shareLocation: boolean;
    profileVisibility: 'public' | 'helpers_only' | 'private';
    showActivityHistory: boolean;
  };
  security: {
    biometricEnabled: boolean;
    twoFactorEnabled: boolean;
  };
  preferences: {
    language: Language;
    distanceUnit: 'km' | 'miles';
    theme: 'light' | 'dark' | 'auto';
  };
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  status: 'active' | 'cancelled' | 'expired' | 'grace_period';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  platform: 'ios' | 'android';
  productId: string;
  receipt?: string;
}
