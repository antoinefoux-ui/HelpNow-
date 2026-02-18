import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Animated,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { useEmergency } from '../../contexts/EmergencyContext';
import { RootStackParamList } from '../../types';

type ActiveEmergencyRouteProp = RouteProp<RootStackParamList, 'ActiveEmergency'>;
type ActiveEmergencyNavigationProp = StackNavigationProp<RootStackParamList, 'ActiveEmergency'>;

const ActiveEmergencyScreen: React.FC = () => {
  const { t } = useTranslation();
  const route = useRoute<ActiveEmergencyRouteProp>();
  const navigation = useNavigation<ActiveEmergencyNavigationProp>();
  const { activeRequest, cancelEmergencyRequest, resolveEmergencyRequest, refreshActiveRequest } = useEmergency();

  const [pulseAnim] = useState(new Animated.Value(1));

  // Support both flat DB response (latitude/longitude) and nested location object
  const lat = activeRequest?.location?.latitude ?? activeRequest?.latitude;
  const lng = activeRequest?.location?.longitude ?? activeRequest?.longitude;

  useEffect(() => {
    const interval = setInterval(() => {
      refreshActiveRequest();
    }, 5000);

    if (activeRequest?.status === 'pending') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }

    return () => clearInterval(interval);
  }, [activeRequest?.status]);

  if (!activeRequest || lat == null || lng == null) {
    return (
      <View style={styles.container}>
        <Text>No active emergency request</Text>
      </View>
    );
  }

  const handleCancel = () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this emergency request?',
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelEmergencyRequest(activeRequest.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert(t('common.error'), 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const handleResolve = () => {
    Alert.alert(
      'Mark as Resolved',
      'Has the emergency been resolved?',
      [
        { text: t('common.no'), style: 'cancel' },
        {
          text: t('common.yes'),
          onPress: async () => {
            try {
              await resolveEmergencyRequest(activeRequest.id);
              navigation.goBack();
            } catch (error) {
              Alert.alert(t('common.error'), 'Failed to resolve request');
            }
          },
        },
      ]
    );
  };

  const handleCallHelper = () => {
    if (activeRequest.acceptedHelperInfo?.phone) {
      Linking.openURL(`tel:${activeRequest.acceptedHelperInfo.phone}`);
    }
  };

  const handleMessageHelper = () => {
    Alert.alert('Coming Soon', 'In-app messaging will be available soon');
  };

  const getStatusColor = () => {
    switch (activeRequest.status) {
      case 'pending':
        return '#F59E0B';
      case 'accepted':
      case 'helper_en_route':
        return '#3B82F6';
      case 'helper_arrived':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusText = () => {
    switch (activeRequest.status) {
      case 'pending':
        return t('emergency.waitingForResponse');
      case 'accepted':
        return t('emergency.helperAccepted');
      case 'helper_en_route':
        return t('emergency.helperEnRoute');
      case 'helper_arrived':
        return t('emergency.helperArrived');
      default:
        return 'Unknown status';
    }
  };

  const helpersNotifiedCount = activeRequest.helpersNotified?.length ?? 0;

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        {/* User Location Marker */}
        <Marker
          coordinate={{ latitude: lat, longitude: lng }}
          title="Your Location"
        >
          <View style={styles.userMarker}>
            <Icon name="account" size={24} color="#FFFFFF" />
          </View>
        </Marker>

        {/* Helper Location Marker (if helper accepted) */}
        {activeRequest.acceptedHelperInfo && (
          <Marker
            coordinate={{
              latitude: lat + 0.002,
              longitude: lng + 0.002,
            }}
            title="Helper"
          >
            <View style={styles.helperMarker}>
              <Icon name="account-heart" size={24} color="#FFFFFF" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: getStatusColor() }]}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Icon
            name={activeRequest.status === 'pending' ? 'clock-outline' : 'check-circle'}
            size={24}
            color="#FFFFFF"
          />
        </Animated.View>
        <Text style={styles.statusText}>{getStatusText()}</Text>
      </View>

      {/* Helper Info Card (when helper accepted) */}
      {activeRequest.acceptedHelperInfo && (
        <View style={styles.helperCard}>
          <View style={styles.helperHeader}>
            <View style={styles.helperAvatar}>
              <Icon name="account" size={32} color="#4B5563" />
            </View>
            <View style={styles.helperInfo}>
              <Text style={styles.helperName}>
                {activeRequest.acceptedHelperInfo.name}
              </Text>
              <View style={styles.helperBadge}>
                <Icon name="shield-check" size={16} color="#10B981" />
                <Text style={styles.helperBadgeText}>
                  {activeRequest.acceptedHelperInfo.trainingLevel}
                </Text>
              </View>
              {activeRequest.acceptedHelperInfo.rating != null && (
                <View style={styles.ratingContainer}>
                  <Icon name="star" size={16} color="#F59E0B" />
                  <Text style={styles.ratingText}>
                    {activeRequest.acceptedHelperInfo.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>
            {activeRequest.acceptedHelperInfo.eta && (
              <View style={styles.etaContainer}>
                <Text style={styles.etaLabel}>ETA</Text>
                <Text style={styles.etaTime}>
                  {activeRequest.acceptedHelperInfo.eta} min
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton]}
              onPress={handleCallHelper}
            >
              <Icon name="phone" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{t('emergency.callHelper')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.messageButton]}
              onPress={handleMessageHelper}
            >
              <Icon name="message-text" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{t('emergency.messageHelper')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Waiting State (no helper yet) */}
      {!activeRequest.acceptedHelperInfo && (
        <View style={styles.waitingCard}>
          <Animated.View style={[styles.searchingIcon, { transform: [{ scale: pulseAnim }] }]}>
            <Icon name="account-search" size={48} color="#F59E0B" />
          </Animated.View>
          <Text style={styles.waitingTitle}>{t('emergency.searching')}</Text>
          {helpersNotifiedCount > 0 && (
            <Text style={styles.waitingText}>
              {helpersNotifiedCount} {t('emergency.helpersNotified')}
            </Text>
          )}
        </View>
      )}

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        {activeRequest.status === 'helper_arrived' ? (
          <TouchableOpacity
            style={[styles.bottomButton, styles.resolveButton]}
            onPress={handleResolve}
          >
            <Icon name="check-circle" size={24} color="#FFFFFF" />
            <Text style={styles.bottomButtonText}>{t('emergency.markResolved')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.bottomButton, styles.cancelButton]}
            onPress={handleCancel}
          >
            <Icon name="close-circle" size={24} color="#FFFFFF" />
            <Text style={styles.bottomButtonText}>{t('emergency.cancelRequest')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  map: {
    flex: 1,
  },
  userMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E53E3E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  helperMarker: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  statusBanner: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  statusText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  helperCard: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  helperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  helperAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  helperInfo: {
    flex: 1,
  },
  helperName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 4,
  },
  helperBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  helperBadgeText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '600',
  },
  etaContainer: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  etaLabel: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '600',
  },
  etaTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  callButton: {
    backgroundColor: '#10B981',
  },
  messageButton: {
    backgroundColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  waitingCard: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  searchingIcon: {
    marginBottom: 16,
  },
  waitingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 8,
  },
  waitingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  bottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  cancelButton: {
    backgroundColor: '#EF4444',
  },
  resolveButton: {
    backgroundColor: '#10B981',
  },
  bottomButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default ActiveEmergencyScreen;
