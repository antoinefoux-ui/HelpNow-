import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from 'react-native-geolocation-service';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../contexts/AuthContext';
import { useEmergency } from '../../contexts/EmergencyContext';
import { RootStackParamList, Location } from '../../types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user } = useAuth();
  const { activeRequest } = useEmergency();

  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [address, setAddress] = useState<string>('');
  const [nearbyHelpersCount, setNearbyHelpersCount] = useState<number>(0);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (activeRequest) {
      navigation.navigate('ActiveEmergency', { requestId: activeRequest.id });
    }
  }, [activeRequest]);

  const requestLocationPermission = async () => {
    try {
      const permission = Platform.select({
        ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE,
        android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
      });

      if (!permission) return;

      const result = await request(permission);

      if (result === RESULTS.GRANTED) {
        getCurrentLocation();
      } else {
        Alert.alert(
          t('errors.locationPermission'),
          'Please enable location services in settings',
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() },
          ]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        };
        setCurrentLocation(location);
        reverseGeocode(location);
        // TODO: Fetch nearby helpers count
        setNearbyHelpersCount(Math.floor(Math.random() * 20) + 5);
      },
      (error) => {
        console.error('Error getting location:', error);
        Alert.alert(t('common.error'), t('errors.locationUnavailable'));
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
  };

  const reverseGeocode = async (location: Location) => {
    // TODO: Implement reverse geocoding
    setAddress('Current Location');
  };

  const handleRequestHelp = () => {
    if (!currentLocation) {
      Alert.alert(
        t('common.error'),
        t('errors.locationUnavailable'),
        [
          { text: t('common.ok'), onPress: getCurrentLocation },
        ]
      );
      return;
    }

    navigation.navigate('EmergencyRequest');
  };

  const callEmergencyServices = () => {
    const emergencyNumber = Platform.select({
      ios: '112',
      android: '112',
    }) || '112';

    Alert.alert(
      'Call Emergency Services',
      `Call ${emergencyNumber}?`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.yes'),
          onPress: () => Linking.openURL(`tel:${emergencyNumber}`),
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>{t('app.name')}</Text>
        <Text style={styles.tagline}>{t('app.tagline')}</Text>
      </View>

      {/* Emergency Disclaimer */}
      <View style={styles.disclaimerCard}>
        <Icon name="information" size={24} color="#F59E0B" />
        <Text style={styles.disclaimerText}>
          {t('home.callEmergencyServices')}
        </Text>
      </View>

      {/* Main Emergency Button */}
      <TouchableOpacity
        style={styles.emergencyButton}
        onPress={handleRequestHelp}
        activeOpacity={0.8}
      >
        <Icon name="alert-circle" size={60} color="#FFFFFF" />
        <Text style={styles.emergencyButtonText}>
          {t('home.requestHelp')}
        </Text>
      </TouchableOpacity>

      {/* Location Info */}
      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <Icon name="map-marker" size={24} color="#E53E3E" />
          <Text style={styles.locationTitle}>{t('home.yourLocation')}</Text>
        </View>
        <Text style={styles.locationAddress}>{address || 'Getting location...'}</Text>
        <TouchableOpacity onPress={getCurrentLocation}>
          <Text style={styles.refreshLocation}>Refresh Location</Text>
        </TouchableOpacity>
      </View>

      {/* Nearby Helpers */}
      <View style={styles.helpersCard}>
        <Icon name="account-group" size={32} color="#48BB78" />
        <Text style={styles.helpersCount}>
          {t('home.nearbyHelpers', { count: nearbyHelpersCount })}
        </Text>
      </View>

      {/* Emergency Contacts */}
      <View style={styles.contactsCard}>
        <Text style={styles.sectionTitle}>{t('home.emergencyContacts')}</Text>
        {user?.emergencyContacts && user.emergencyContacts.length > 0 ? (
          user.emergencyContacts.map((contact) => (
            <View key={contact.id} style={styles.contactItem}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRelation}>{contact.relationship}</Text>
              </View>
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${contact.phone}`)}
              >
                <Icon name="phone" size={24} color="#4299E1" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No emergency contacts added</Text>
        )}
      </View>

      {/* Call Emergency Services Button */}
      <TouchableOpacity
        style={styles.callButton}
        onPress={callEmergencyServices}
      >
        <Icon name="phone" size={24} color="#FFFFFF" />
        <Text style={styles.callButtonText}>Call 112 / 911</Text>
      </TouchableOpacity>

      {/* Disclaimer */}
      <Text style={styles.footerDisclaimer}>
        {t('home.disclaimer')}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  tagline: {
    fontSize: 16,
    color: '#718096',
    marginTop: 4,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 30,
  },
  disclaimerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },
  emergencyButton: {
    backgroundColor: '#E53E3E',
    borderRadius: 20,
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    elevation: 8,
    shadowColor: '#E53E3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  emergencyButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginLeft: 8,
  },
  locationAddress: {
    fontSize: 16,
    color: '#4A5568',
    marginBottom: 8,
  },
  refreshLocation: {
    fontSize: 14,
    color: '#4299E1',
    fontWeight: '600',
  },
  helpersCard: {
    backgroundColor: '#F0FFF4',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  helpersCount: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#22543D',
    marginLeft: 16,
  },
  contactsCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
  },
  contactRelation: {
    fontSize: 14,
    color: '#718096',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#A0AEC0',
    fontStyle: 'italic',
  },
  callButton: {
    backgroundColor: '#4299E1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  footerDisclaimer: {
    fontSize: 12,
    color: '#A0AEC0',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default HomeScreen;
