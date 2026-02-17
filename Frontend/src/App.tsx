import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { EmergencyProvider } from './contexts/EmergencyContext';

// Navigation
import { RootNavigator } from './navigation/RootNavigator';

// i18n
import './i18n';

// Add right after imports, before App component
ErrorUtils.setGlobalHandler((error, isFatal) => {
  console.error('GLOBAL ERROR:', error.message, error.stack);
});

// Ignore specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const App: React.FC = () => {
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
