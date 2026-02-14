import axios from 'axios';
import { User } from '../types';

const API_URL = process.env.API_URL || 'https://api.helpnow.com/v1';

class AuthService {
  async getUserData(userId: string): Promise<User> {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting user data:', error);
      throw error;
    }
  }

  async createUserProfile(userId: string, userData: Partial<User>): Promise<User> {
    try {
      const response = await axios.post(`${API_URL}/users`, {
        id: userId,
        ...userData,
        createdAt: new Date(),
        isHelper: false,
        isActive: true,
        rating: 0,
        totalHelps: 0,
        verified: false,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, userData: Partial<User>): Promise<User> {
    try {
      const response = await axios.put(`${API_URL}/users/${userId}`, userData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async deleteAccount(userId: string): Promise<void> {
    try {
      await axios.delete(`${API_URL}/users/${userId}`);
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
        `${API_URL}/users/${userId}/photo`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data.photoUrl;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      throw error;
    }
  }

  async uploadCertification(userId: string, documentUri: string, certData: any): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('document', {
        uri: documentUri,
        type: 'application/pdf',
        name: 'certification.pdf',
      } as any);
      formData.append('data', JSON.stringify(certData));

      const response = await axios.post(
        `${API_URL}/users/${userId}/certifications`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error('Error uploading certification:', error);
      throw error;
    }
  }

  async verifyPhone(userId: string, phone: string, code: string): Promise<boolean> {
    try {
      const response = await axios.post(`${API_URL}/users/${userId}/verify-phone`, {
        phone,
        code,
      });
      return response.data.success;
    } catch (error) {
      console.error('Error verifying phone:', error);
      throw error;
    }
  }

  async sendPhoneVerificationCode(userId: string, phone: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/users/${userId}/send-verification`, {
        phone,
      });
    } catch (error) {
      console.error('Error sending verification code:', error);
      throw error;
    }
  }
}

export const authService = new AuthService();
