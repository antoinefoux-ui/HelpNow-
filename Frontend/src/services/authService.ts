import '../config/axios'; // MUST be first - sets up interceptors
import axios from 'axios';
import { User } from '../types';
import { API_ENDPOINTS } from '../config/api';

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

// Helper to safely extract data from response
// Handles both formats: { data: { user, token } } and { user, token }
const extractData = (response: any): AuthResponse => {
  const data = response.data?.data || response.data;
  if (!data || !data.user) {
    console.log('Full response:', JSON.stringify(response.data, null, 2));
    throw new Error(`Unexpected response format: ${JSON.stringify(response.data)}`);
  }
  return data;
};

class AuthService {
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      return extractData(response);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async signUp(
    email: string,
    password: string,
    userData: Partial<User>
  ): Promise<AuthResponse> {
    try {
      const response = await axios.post(API_ENDPOINTS.AUTH.REGISTER, {
        email,
        password,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        isHelper: userData.isHelper || false,
        language: userData.language || 'en',
      });
      return extractData(response);
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await axios.post(API_ENDPOINTS.AUTH.LOGOUT);
    } catch {
      console.log('Backend logout failed (non-critical)');
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await axios.post(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email });
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  }

  async getUserData(userId: string): Promise<User> {
    try {
      const response = await axios.get(API_ENDPOINTS.USERS.GET(userId));
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, userData: Partial<User>): Promise<User> {
    try {
      const response = await axios.put(API_ENDPOINTS.USERS.UPDATE(userId), userData);
      return response.data?.data || response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async deleteAccount(userId: string): Promise<void> {
    try {
      await axios.delete(API_ENDPOINTS.USERS.DELETE(userId));
    } catch (error) {
      console.error('Error deleting account:', error);
      throw error;
    }
  }

  async uploadProfilePhoto(userId: string, photoUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: photoUri,
        type: 'image/jpeg',
        name: 'profile.jpg',
      } as any);
      const response = await axios.post(
        API_ENDPOINTS.USERS.UPLOAD_PHOTO(userId),
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data?.data?.photoUrl || response.data?.photoUrl;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
