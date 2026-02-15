import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';

// Screens
import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import SignInScreen from '../screens/auth/SignInScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import MainTabNavigator from './MainTabNavigator';
import EmergencyRequestScreen from '../screens/emergency/EmergencyRequestScreen';
import ActiveEmergencyScreen from '../screens/emergency/ActiveEmergencyScreen';
import HelperResponseScreen from '../screens/helper/HelperResponseScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import LegalScreen from '../screens/settings/LegalScreen';

import { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
      }}
    >
      {!user ? (
        // Auth Stack
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      ) : (
        // Main App Stack
        <>
          <Stack.Screen name="Main" component={MainTabNavigator} />
          <Stack.Screen 
            name="EmergencyRequest" 
            component={EmergencyRequestScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="ActiveEmergency" 
            component={ActiveEmergencyScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="HelperResponse" 
            component={HelperResponseScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Legal" component={LegalScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};
