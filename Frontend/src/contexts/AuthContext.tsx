import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  // On app start, try to load user + token from storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
      } finally {
        setLoading(false);
      }
    };

    void initAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      // TODO: adapt this to your backend authService implementation
      // Expecting authService.signIn to return { user, accessToken, refreshToken? }
      const { user: loggedInUser, accessToken } = await authService.signIn(email, password);

      if(loggedInUser) setUser(loggedInUser);
      await AsyncStorage.setItem('user', JSON.stringify(loggedInUser));
      if (accessToken) {
        await AsyncStorage.setItem('accessToken', accessToken);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<User>) => {
    try {
      setLoading(true);

      // TODO: adapt this to your backend authService implementation
      const { user: newUser, accessToken } = await authService.signUp(email, password, userData);

      if(newUser) setUser(newUser);
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
      if (accessToken) {
        await AsyncStorage.setItem('accessToken', accessToken);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);

      // Optional: inform backend about logout / token revoke
      try {
        await authService.signOut?.();
      } catch {
        // backend signOut optional
      }

      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('accessToken');
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
    // TODO: Implement backend password reset call
    // For now, just log it
    console.log('Password reset requested for:', email);
    
    // When ready, uncomment and implement:
    // await authService.resetPassword(email);
  } catch (error) {
    console.error('Reset password error:', error);
    throw error;
  }
};

  const updateUser = async (userData: Partial<User>) => {
    try {
      if (!user) throw new Error('No user logged in');

      const updatedUser = await authService.updateUserProfile(user.id, userData);
      setUser(updatedUser);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      if (!user) return;
      const freshUser = await authService.getUserData(user.id);
      setUser(freshUser);
      await AsyncStorage.setItem('user', JSON.stringify(freshUser));
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
