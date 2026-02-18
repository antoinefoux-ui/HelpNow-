import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

import { emergencyService } from '../../services/emergencyService';
import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList, Location as LocationType } from '../../types';

type HelperResponseRouteProp = RouteProp<RootStackParamList, 'HelperResponse'>;
type HelperResponseNavigationProp = StackNavigationProp<RootStackParamList, 'HelperResponse'>;

const HelperResponseScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<HelperResponseRouteProp>();
  const navigation = useNavigation<HelperResponseNavigationProp>();
  const { user } = useAuth();

  const [request, setRequest] = useState<any>(null);
  const [accepted, setAccepted] = useState(false);
  const [helperLocation, setHelperLocation] = useState<LocationType | null>(null);
  const [eta, setEta] = useState<number>(0);

  useEffect(() => {
    loadRequest();
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (accepted && helperLocation) {
      const interval = setInterval(() => {
        updateHelperLocation();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [accepted, helperLocation]);

  const loadRequest = async () => {
    try {
      const data = await emergencyService.getRequest(route.params.requestId);
      setRequest(data);
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to load request');
      navigation.goBack();
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const location: LocationType = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };
      setHelperLocation(location);

      if (request) {
        const distance = calculateDistance(location, request.location);
        const calculatedEta = emergencyService.calculateETA(distance);
        setEta(calculatedEta);
      }
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const calculateDistance = (from: LocationType, to: LocationType): number => {
    const R = 6371e3;
    const φ1 = (from.latitude * Math.PI) / 180;
    const φ2 = (to.latitude * Math.PI) / 180;
    const Δφ = ((to.latitude - from.latitude) * Math.PI) / 180;
    const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const updateHelperLocation = async () => {
    if (!helperLocation || !user || !request) return;
    try {
      await getCurrentLocation();
      await emergencyService.updateHelperLocation(request.id, user.id, helperLocation, eta);
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  };

  const handleAccept = async () => {
    if (!user) return;
    try {
      await emergencyService.acceptRequest(request.id, user.id);
      setAccepted(true);
      Alert.alert(t('common.success'), 'Request accepted! Navigate to the location.', [
        { text: t('common.ok') },
      ]);
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to accept request');
    }
  };

  const handleDecline = () => {
    Alert.alert('Decline Request', 'Are you sure you want to decline this request?', [
      { text: t('common.no'), style: 'cancel' },
      { text: t('common.yes'), onPress: () => navigation.goBack() },
    ]);
  };

  const handleNavigate = () => {
    if (!request) return;
    const destination = `${request.location.latitude},${request.location.longitude}`;
    const url = Platform.select({
      ios: `maps:0,0?q=${destination}`,
      android: `geo:0,0?q=${destination}`,
    });
    if (url) Linking.openURL(url);
  };

  const handleMarkArrived = async () => {
    if (!user) return;
    try {
      await emergencyService.markHelperArrived(request.id, user.id);
      Alert.alert(
        t('common.success'),
        'Marked as arrived. Provide assistance to the person in need.',
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(t('common.error'), 'Failed to mark arrival');
    }
  };

  const handleCallSeeker = () => {
    if (request?.seekerInfo?.phone) {
      Linking.openURL(`tel:${request.seekerInfo.phone}`);
    }
  };

  if (!request) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const distance = helperLocation
    ? (calculateDistance(helperLocation, request.location) / 1000).toFixed(1)
    : '?';

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: request.location.latitude,
          longitude: request.location.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation
      >
        <Marker
          coordinate={{
            latitude: request.location.latitude,
            longitude: request.location.longitude,
          }}
          title="Emergency Location"
        >
          <View style={styles.emergencyMarker}>
            <Icon name="alert-circle" size={32} color="#FFFFFF" />
          </View>
        </Marker>
      </MapView>

      {/* Emergency Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.typeBadge}>
          <Icon name="alert" size={20} color="#DC2626" />
          <Text style={styles.typeText}>{request.type.replace('_', ' ')}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Icon name="map-marker-distance" size={24} color="#6B7280" />
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{distance} km</Text>
          </View>
          <View style={styles.stat}>
            <Icon name="clock-outline" size={24} color="#6B7280" />
            <Text style={styles.statLabel}>ETA</Text>
            <Text style={styles.statValue}>{eta} min</Text>
          </View>
        </View>

        {accepted && (
          <View style={styles.seekerInfo}>
            <View style={styles.seekerAvatar}>
              <Icon name="account" size={32} color="#6B7280" />
            </View>
            <View style={styles.seekerDetails}>
              <Text style={styles.seekerName}>{request.seekerInfo.name}</Text>
              <Text style={styles.seekerAddress}>{request.address}</Text>
            </View>
            <TouchableOpacity style={styles.callButton} onPress={handleCallSeeker}>
              <Icon name="phone" size={24} color="#10B981" />
            </TouchableOpacity>
          </View>
        )}

        {request.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Description:</Text>
            <Text style={styles.descriptionText}>{request.description}</Text>
          </View>
        )}

        {!accepted ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={handleDecline}
            >
              <Icon name="close" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{t('helper.decline')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAccept}
            >
              <Icon name="check" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{t('helper.accept')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[styles.navButton, styles.navigateButton]}
              onPress={handleNavigate}
            >
              <Icon name="navigation" size={24} color="#FFFFFF" />
              <Text style={styles.navButtonText}>{t('helper.navigateToLocation')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navButton, styles.arrivedButton]}
              onPress={handleMarkArrived}
            >
              <Icon name="check-circle" size={24} color="#FFFFFF" />
              <Text style={styles.navButtonText}>{t('helper.markArrived')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  map: { flex: 1 },
  emergencyMarker: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  infoCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  typeText: { fontSize: 14, fontWeight: '600', color: '#DC2626', marginLeft: 8, textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  stat: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#1A202C', marginTop: 4 },
  seekerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  seekerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  seekerDetails: { flex: 1 },
  seekerName: { fontSize: 16, fontWeight: '600', color: '#1A202C', marginBottom: 4 },
  seekerAddress: { fontSize: 13, color: '#6B7280' },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  descriptionContainer: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 16 },
  descriptionLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 4 },
  descriptionText: { fontSize: 14, color: '#1A202C', lineHeight: 20 },
  actionButtons: { flexDirection: 'row', gap: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  declineButton: { backgroundColor: '#EF4444' },
  acceptButton: { backgroundColor: '#10B981' },
  actionButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  navigationButtons: { gap: 12 },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  navigateButton: { backgroundColor: '#3B82F6' },
  arrivedButton: { backgroundColor: '#10B981' },
  navButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});

export default HelperResponseScreen;
