import io, { Socket } from 'socket.io-client';
import { SocketEvent, SocketEventData } from '../types';

const SOCKET_URL = process.env.SOCKET_URL || 'https://api.helpnow.com';

class SocketService {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(userId: string, token: string): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
        userId,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Set up listeners for all socket events
    this.setupEventListeners();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.listeners.clear();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    const events: SocketEvent[] = [
      'emergency:created',
      'emergency:accepted',
      'emergency:cancelled',
      'helper:location_update',
      'helper:arrived',
      'emergency:resolved',
    ];

    events.forEach(event => {
      this.socket!.on(event, (data) => {
        this.emit(event, data);
      });
    });
  }

  on(event: SocketEvent, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: SocketEvent, callback?: Function): void {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: SocketEvent, data: any): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  // Emergency-specific methods
  joinEmergencyRoom(requestId: string): void {
    if (this.socket) {
      this.socket.emit('join:emergency', { requestId });
    }
  }

  leaveEmergencyRoom(requestId: string): void {
    if (this.socket) {
      this.socket.emit('leave:emergency', { requestId });
    }
  }

  updateHelperLocation(requestId: string, location: any, eta: number): void {
    if (this.socket) {
      this.socket.emit('helper:update_location', {
        requestId,
        location,
        eta,
      });
    }
  }

  sendMessage(requestId: string, message: string): void {
    if (this.socket) {
      this.socket.emit('message:send', {
        requestId,
        message,
        timestamp: new Date(),
      });
    }
  }

  // Helper availability
  setHelperAvailability(helperId: string, available: boolean, location?: any): void {
    if (this.socket) {
      this.socket.emit('helper:set_availability', {
        helperId,
        available,
        location,
      });
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketService = new SocketService();
