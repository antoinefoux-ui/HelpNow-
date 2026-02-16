import axios from 'axios';
import { EmergencyRequest, EmergencyType, Location } from '../types';

import { API_CONFIG } from '../config/api';
const API_URL = API_CONFIG.BASE_URL;

interface CreateRequestData {
  seekerId: string;
  seekerInfo: {
    name: string;
    photo?: string;
    phone: string;
  };
  type: EmergencyType;
  location: Location;
  description?: string;
  voiceNoteUrl?: string;
}

class EmergencyService {
  async createRequest(data: CreateRequestData): Promise<EmergencyRequest> {
    try {
      // First, get the address from coordinates
      const address = await this.reverseGeocode(data.location);
      
      const response = await axios.post(`${API_URL}/emergencies`, {
        ...data,
        address,
        status: 'pending',
        createdAt: new Date(),
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error creating emergency request:', error);
      throw error;
    }
  }

  async getRequest(requestId: string): Promise<EmergencyRequest> {
    try {
      const response = await axios.get(`${API_URL}/emergencies/${requestId}`);
      return response.data.data;
    } catch (error) {
      console.error('Error getting emergency request:', error);
      throw error;
    }
  }

  async getActiveRequest(userId: string): Promise<EmergencyRequest | null> {
    try {
      const response = await axios.get(`${API_URL}/emergencies/active/${userId}`);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error getting active request:', error);
      throw error;
    }
  }

  async acceptRequest(requestId: string, helperId: string): Promise<EmergencyRequest> {
    try {
      const response = await axios.post(`${API_URL}/emergencies/${requestId}/accept`, {
        helperId,
      });
      return response.data.data;
    } catch (error) {
      console.error('Error accepting request:', error);
      throw error;
    }
  }

  async cancelRequest(requestId: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/emergencies/${requestId}/cancel`);
    } catch (error) {
      console.error('Error cancelling request:', error);
      throw error;
    }
  }

  async updateHelperLocation(
    requestId: string, 
    helperId: string, 
    location: Location,
    eta: number
  ): Promise<void> {
    try {
      await axios.post(`${API_URL}/emergencies/${requestId}/helper-location`, {
        helperId,
        location,
        eta,
      });
    } catch (error) {
      console.error('Error updating helper location:', error);
      throw error;
    }
  }

  async markHelperArrived(requestId: string, helperId: string): Promise<void> {
    try {
      await axios.post(`${API_URL}/emergencies/${requestId}/arrived`, {
        helperId,
      });
    } catch (error) {
      console.error('Error marking helper arrived:', error);
      throw error;
    }
  }

  async resolveRequest(
    requestId: string, 
    rating?: number, 
    feedback?: string
  ): Promise<void> {
    try {
      await axios.post(`${API_URL}/emergencies/${requestId}/resolve`, {
        rating,
        feedback,
        resolvedAt: new Date(),
      });
    } catch (error) {
      console.error('Error resolving request:', error);
      throw error;
    }
  }

  async getNearbyRequests(location: Location, radius: number): Promise<EmergencyRequest[]> {
    try {
      const response = await axios.get(`${API_URL}/emergencies/nearby`, {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
          radius,
        },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting nearby requests:', error);
      throw error;
    }
  }

  async getUserHistory(userId: string, limit: number = 20): Promise<EmergencyRequest[]> {
    try {
      const response = await axios.get(`${API_URL}/emergencies/history/${userId}`, {
        params: { limit },
      });
      return response.data.data;
    } catch (error) {
      console.error('Error getting user history:', error);
      throw error;
    }
  }

  async reverseGeocode(location: Location): Promise<string> {
    try {
      // Using a geocoding service to get address from coordinates
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json`,
        {
          params: {
            latlng: `${location.latitude},${location.longitude}`,
            key: process.env.GOOGLE_MAPS_API_KEY,
          },
        }
      );
      
      if (response.data.results && response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }
      
      return 'Unknown location';
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return 'Unknown location';
    }
  }

  async uploadVoiceNote(requestId: string, audioUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'voice_note.m4a',
      } as any);

      const response = await axios.post(
        `${API_URL}/emergencies/${requestId}/voice-note`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data.data.voiceNoteUrl;
    } catch (error) {
      console.error('Error uploading voice note:', error);
      throw error;
    }
  }

  calculateETA(distance: number, averageSpeed: number = 40): number {
    // distance in meters, speed in km/h
    // Returns ETA in minutes
    const distanceKm = distance / 1000;
    const timeHours = distanceKm / averageSpeed;
    return Math.ceil(timeHours * 60);
  }
}

export const emergencyService = new EmergencyService();
