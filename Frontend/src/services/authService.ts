import '../config/axios'; // MUST be first - sets up interceptors
import axios from 'axios';
import { User } from '../types';
import { API_ENDPOINTS } from '../config/api';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

class AuthService {
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(API_ENDPOINTS.LOGIN, { email, password });
      return response.data.data;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async signUp(email: string, password: string, userData: Partial<User>): Promise<AuthResponse> {
    try {
      const response = await axios.post(API_ENDPOINTS.REGISTER, {
        email,
        password,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        isHelper: userData.isHelper || false,
        language: userData.language || 'en',
      });
      return response.data.data;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await axios.post(API_ENDPOINTS.LOGOUT);
    } catch {
      console.log('Backend logout failed (non-critical)');
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await axios.post(API_ENDPOINTS.FORGOT_PASSWORD, { email });
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  async getUserData(userId: string): Promise<User> {
    try {
      const response = await axios.get(API_ENDPOINTS.GET_USER(userId));
      return response.data.data;
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, userData: Partial<User>): Promise<User> {
    try {
      const response = await axios.put(API_ENDPOINTS.UPDATE_USER(userId), userData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async deleteAccount(userId: string): Promise<void> {
    try {
      await axios.delete(API_ENDPOINTS.DELETE_USER(userId));
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  async uploadProfilePhoto(userId: string, photoUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('photo', { uri: photoUri, type: 'image/jpeg', name: 'profile.jpg' } as any);
      const response = await axios.post(API_ENDPOINTS.UPLOAD_PHOTO(userId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.data.photoUrl;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
