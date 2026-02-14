import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import PushNotification from 'react-native-push-notification';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { EmergencyProvider } from './contexts/EmergencyContext';

// Navigation
import { RootNavigator } from './navigation/RootNavigator';

// i18n
import './i18n';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

// Configure push notifications
PushNotification.configure({
  onNotification: function (notification) {
    console.log('NOTIFICATION:', notification);
  },
  permissions: {
    alert: true,
    badge: true,
    sound: true,
  },
  popInitialNotification: true,
  requestPermissions: true,
});

const App: React.FC = () => {
  useEffect(() => {
    // Request notification permissions
    requestNotificationPermission();

    // Set up foreground message handler
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log('Foreground message:', remoteMessage);
      
      // Display local notification
      PushNotification.localNotification({
        channelId: 'emergency-channel',
        title: remoteMessage.notification?.title || 'HelpNow',
        message: remoteMessage.notification?.body || '',
        playSound: true,
        soundName: 'default',
        importance: 'high',
        priority: 'high',
      });
    });

    return unsubscribe;
  }, []);

  const requestNotificationPermission = async () => {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        const token = await messaging().getToken();
        console.log('FCM Token:', token);
        // TODO: Send token to backend
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <EmergencyProvider>
            <NavigationContainer>
              <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
              <RootNavigator />
            </NavigationContainer>
          </EmergencyProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;
