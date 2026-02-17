import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // On app start, load user + token from storage
  useEffect(() => {
    const initAuth = async () => {
      try {
        const [storedUser, storedToken] = await AsyncStorage.multiGet(['user', 'accessToken']);
        if (storedUser[1]) setUser(JSON.parse(storedUser[1]));
        if (storedToken[1]) setToken(storedToken[1]);
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
      const { user: loggedInUser, accessToken } = await authService.signIn(email, password);

      // Save to state AND storage atomically
      setUser(loggedInUser);
      setToken(accessToken);

      await AsyncStorage.multiSet([
        ['user', JSON.stringify(loggedInUser)],
        ['accessToken', accessToken],
      ]);
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
      const { user: newUser, accessToken } = await authService.signUp(email, password, userData);

      setUser(newUser);
      setToken(accessToken);

      await AsyncStorage.multiSet([
        ['user', JSON.stringify(newUser)],
        ['accessToken', accessToken],
      ]);
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
      try {
        await authService.signOut?.();
      } catch {
        // backend signOut optional
      }
      setUser(null);
      setToken(null);
      await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await authService.resetPassword(email);
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
        token,
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
