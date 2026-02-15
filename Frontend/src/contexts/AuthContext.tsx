import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const buildFallbackUser = (
  firebaseUser: { uid: string; email?: string | null; displayName?: string | null },
  overrides: Partial<User> = {}
): User => {
  const [firstNameFromDisplay = '', lastNameFromDisplay = ''] = (firebaseUser.displayName || '').split(' ');

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || overrides.email || '',
    phone: overrides.phone || '',
    firstName: overrides.firstName || firstNameFromDisplay || 'User',
    lastName: overrides.lastName || lastNameFromDisplay || '',
    profilePhoto: overrides.profilePhoto,
    dateOfBirth: overrides.dateOfBirth || '',
    gender: overrides.gender || 'prefer_not_to_say',
    createdAt: overrides.createdAt || new Date(),
    isHelper: overrides.isHelper || false,
    isActive: overrides.isActive ?? true,
    language: overrides.language || 'en',
    emergencyContacts: overrides.emergencyContacts || [],
    addresses: overrides.addresses || [],
    medicalInfo: overrides.medicalInfo,
    helperProfile: overrides.helperProfile,
    rating: overrides.rating || 0,
    totalHelps: overrides.totalHelps || 0,
    verified: overrides.verified || false,
  };
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch full user data from backend
          const userData = await authService.getUserData(firebaseUser.uid);
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user data, using local fallback user:', error);
          setUser(buildFallbackUser(firebaseUser));
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      try {
        const userData = await authService.getUserData(userCredential.user.uid);
        setUser(userData);
      } catch (backendError) {
        console.warn('Backend user fetch failed on sign in, using fallback user:', backendError);
        setUser(buildFallbackUser(userCredential.user));
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      setLoading(true);
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      
      // Create user profile in backend (best-effort)
      try {
        const newUser = await authService.createUserProfile(userCredential.user.uid, {
          email,
          ...userData,
        });

        setUser(newUser);
      } catch (backendError) {
        console.warn('Backend profile creation failed during sign up, using fallback user:', backendError);
        setUser(buildFallbackUser(userCredential.user, {
          email,
          ...userData,
        }));
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await auth().signOut();
      await AsyncStorage.clear();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!user) throw new Error('No user logged in');
      
      try {
        const updatedUser = await authService.updateUserProfile(user.id, userData);
        setUser(updatedUser);
      } catch (backendError) {
        console.warn('Backend profile update failed, applying local update fallback:', backendError);
        setUser({ ...user, ...userData });
      }
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      if (!user) return;
      try {
        const userData = await authService.getUserData(user.id);
        setUser(userData);
      } catch (backendError) {
        console.warn('Refresh user fallback: backend unavailable', backendError);
      }
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
