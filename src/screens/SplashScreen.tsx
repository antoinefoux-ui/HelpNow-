import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SplashScreen: React.FC = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      // Navigation handled by RootNavigator based on auth state
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* App Icon/Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🚑</Text>
          </View>
        </View>

        {/* App Name */}
        <Text style={styles.appName}>HelpNow</Text>
        <Text style={styles.tagline}>Emergency Assistance</Text>

        {/* Loading Indicator */}
        <ActivityIndicator
          size="large"
          color="#FFFFFF"
          style={styles.loader}
        />
      </View>

      {/* Footer */}
      <Text style={styles.footer}>Connecting helpers in your community</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E53E3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 60,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  loader: {
    marginTop: 40,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default SplashScreen;
