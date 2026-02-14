import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null;

const initializeFirebase = () => {
  if (firebaseApp) return;

  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });

    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error);
  }
};

export interface PushNotification {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
  sound?: string;
  badge?: number;
}

class NotificationService {
  constructor() {
    if (process.env.ENABLE_PUSH_NOTIFICATIONS === 'true') {
      initializeFirebase();
    }
  }

  /**
   * Send push notification to a single device
   */
  async sendToDevice(
    fcmToken: string,
    notification: PushNotification
  ): Promise<boolean> {
    if (!firebaseApp) {
      console.warn('Firebase not initialized, skipping notification');
      return false;
    }

    try {
      const message: admin.messaging.Message = {
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data,
        android: {
          priority: 'high',
          notification: {
            sound: notification.sound || 'default',
            channelId: 'emergency_alerts',
            priority: 'high',
            defaultSound: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: notification.sound || 'default',
              badge: notification.badge,
              contentAvailable: true,
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('Push notification sent:', response);
      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToMultipleDevices(
    fcmTokens: string[],
    notification: PushNotification
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!firebaseApp || fcmTokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: fcmTokens,
        notification: {
          title: notification.title,
          body: notification.body,
          imageUrl: notification.imageUrl,
        },
        data: notification.data,
        android: {
          priority: 'high',
          notification: {
            sound: notification.sound || 'default',
            channelId: 'emergency_alerts',
            priority: 'high',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: notification.sound || 'default',
              badge: notification.badge,
            },
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      
      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      console.error('Failed to send multicast notification:', error);
      return { successCount: 0, failureCount: fcmTokens.length };
    }
  }

  /**
   * Send emergency alert to nearby helpers
   */
  async sendEmergencyAlert(
    helperTokens: string[],
    emergencyType: string,
    distance: number
  ): Promise<void> {
    const notification: PushNotification = {
      title: '🚨 Emergency Alert',
      body: `${emergencyType.replace('_', ' ')} - ${distance.toFixed(1)} km away`,
      data: {
        type: 'emergency_alert',
        emergencyType,
        distance: distance.toString(),
      },
      sound: 'emergency_alert.wav',
    };

    await this.sendToMultipleDevices(helperTokens, notification);
  }

  /**
   * Notify seeker that helper accepted
   */
  async notifyHelperAccepted(
    seekerToken: string,
    helperName: string,
    eta: number
  ): Promise<void> {
    const notification: PushNotification = {
      title: '✅ Helper Accepted',
      body: `${helperName} is on the way! ETA: ${eta} minutes`,
      data: {
        type: 'helper_accepted',
        eta: eta.toString(),
      },
      sound: 'default',
    };

    await this.sendToDevice(seekerToken, notification);
  }

  /**
   * Notify seeker that helper arrived
   */
  async notifyHelperArrived(
    seekerToken: string,
    helperName: string
  ): Promise<void> {
    const notification: PushNotification = {
      title: '📍 Helper Arrived',
      body: `${helperName} has arrived at your location`,
      data: {
        type: 'helper_arrived',
      },
      sound: 'default',
    };

    await this.sendToDevice(seekerToken, notification);
  }

  /**
   * Notify about emergency cancellation
   */
  async notifyCancellation(
    tokens: string[],
    reason: string = 'cancelled'
  ): Promise<void> {
    const notification: PushNotification = {
      title: 'Emergency Cancelled',
      body: `The emergency request was ${reason}`,
      data: {
        type: 'emergency_cancelled',
      },
      sound: 'default',
    };

    await this.sendToMultipleDevices(tokens, notification);
  }

  /**
   * Send general notification
   */
  async sendNotification(
    tokens: string | string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<boolean> {
    const notification: PushNotification = {
      title,
      body,
      data,
    };

    if (Array.isArray(tokens)) {
      const result = await this.sendToMultipleDevices(tokens, notification);
      return result.successCount > 0;
    } else {
      return await this.sendToDevice(tokens, notification);
    }
  }

  /**
   * Subscribe token to topic
   */
  async subscribeToTopic(
    tokens: string | string[],
    topic: string
  ): Promise<void> {
    if (!firebaseApp) return;

    try {
      const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
      await admin.messaging().subscribeToTopic(tokenArray, topic);
      console.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      console.error('Failed to subscribe to topic:', error);
    }
  }

  /**
   * Unsubscribe token from topic
   */
  async unsubscribeFromTopic(
    tokens: string | string[],
    topic: string
  ): Promise<void> {
    if (!firebaseApp) return;

    try {
      const tokenArray = Array.isArray(tokens) ? tokens : [tokens];
      await admin.messaging().unsubscribeFromTopic(tokenArray, topic);
      console.log(`Unsubscribed from topic: ${topic}`);
    } catch (error) {
      console.error('Failed to unsubscribe from topic:', error);
    }
  }
}

export const notificationService = new NotificationService();
