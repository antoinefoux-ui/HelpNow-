import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { EmergencyRequest, EmergencyType, Location } from '../types';
import { emergencyService } from '../services/emergencyService';
import { useAuth } from './AuthContext';
import { socketService } from '../services/socketService';

interface EmergencyContextType {
  activeRequest: EmergencyRequest | null;
  createEmergencyRequest: (type: EmergencyType, location: Location, description?: string) => Promise<void>;
  cancelEmergencyRequest: (requestId: string) => Promise<void>;
  resolveEmergencyRequest: (requestId: string, rating?: number, feedback?: string) => Promise<void>;
  refreshActiveRequest: () => Promise<void>;
}

const EmergencyContext = createContext<EmergencyContextType | undefined>(undefined);

export const EmergencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeRequest, setActiveRequest] = useState<EmergencyRequest | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      // Check for active emergency request on mount
      checkActiveRequest();
      
      // Subscribe to socket events
      socketService.on('emergency:accepted', handleEmergencyAccepted);
      socketService.on('helper:location_update', handleHelperLocationUpdate);
      socketService.on('helper:arrived', handleHelperArrived);
      socketService.on('emergency:resolved', handleEmergencyResolved);
    }

    return () => {
      socketService.off('emergency:accepted');
      socketService.off('helper:location_update');
      socketService.off('helper:arrived');
      socketService.off('emergency:resolved');
    };
  }, [user]);

  const checkActiveRequest = async () => {
    try {
      if (!user) return;
      const request = await emergencyService.getActiveRequest(user.id);
      setActiveRequest(request);
    } catch (error) {
      console.error('Error checking active request:', error);
    }
  };

  const createEmergencyRequest = async (
    type: EmergencyType,
    location: Location,
    description?: string
  ) => {
    try {
      if (!user) throw new Error('User not authenticated');
      
      const request = await emergencyService.createRequest({
        seekerId: user.id,
        seekerInfo: {
          name: `${user.firstName} ${user.lastName}`,
          photo: user.profilePhoto,
          phone: user.phone,
        },
        type,
        location,
        description,
      });

      setActiveRequest(request);
    } catch (error) {
      console.error('Error creating emergency request:', error);
      throw error;
    }
  };

  const cancelEmergencyRequest = async (requestId: string) => {
    try {
      await emergencyService.cancelRequest(requestId);
      setActiveRequest(null);
    } catch (error) {
      console.error('Error cancelling request:', error);
      throw error;
    }
  };

  const resolveEmergencyRequest = async (
    requestId: string,
    rating?: number,
    feedback?: string
  ) => {
    try {
      await emergencyService.resolveRequest(requestId, rating, feedback);
      setActiveRequest(null);
    } catch (error) {
      console.error('Error resolving request:', error);
      throw error;
    }
  };

  const refreshActiveRequest = async () => {
    try {
      if (!activeRequest) return;
      const updatedRequest = await emergencyService.getRequest(activeRequest.id);
      setActiveRequest(updatedRequest);
    } catch (error) {
      console.error('Error refreshing request:', error);
    }
  };

  // Socket event handlers
  const handleEmergencyAccepted = (data: any) => {
    if (activeRequest && data.requestId === activeRequest.id) {
      setActiveRequest(prev => prev ? { ...prev, ...data.request } : null);
    }
  };

  const handleHelperLocationUpdate = (data: any) => {
    if (activeRequest && data.requestId === activeRequest.id) {
      setActiveRequest(prev => 
        prev ? { 
          ...prev, 
          acceptedHelperInfo: {
            ...prev.acceptedHelperInfo!,
            eta: data.eta,
          }
        } : null
      );
    }
  };

  const handleHelperArrived = (data: any) => {
    if (activeRequest && data.requestId === activeRequest.id) {
      setActiveRequest(prev => 
        prev ? { ...prev, status: 'helper_arrived' } : null
      );
    }
  };

  const handleEmergencyResolved = (data: any) => {
    if (activeRequest && data.requestId === activeRequest.id) {
      setActiveRequest(null);
    }
  };

  return (
    <EmergencyContext.Provider
      value={{
        activeRequest,
        createEmergencyRequest,
        cancelEmergencyRequest,
        resolveEmergencyRequest,
        refreshActiveRequest,
      }}
    >
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergency = () => {
  const context = useContext(EmergencyContext);
  if (context === undefined) {
    throw new Error('useEmergency must be used within an EmergencyProvider');
  }
  return context;
};
