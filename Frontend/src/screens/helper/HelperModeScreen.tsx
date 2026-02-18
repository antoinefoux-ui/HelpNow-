import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Slider from '@react-native-community/slider';

import { useAuth } from '../../contexts/AuthContext';
import { socketService } from '../../services/socketService';

const HelperModeScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();

  const [isAvailable, setIsAvailable] = useState(false);
  const [responseRadius, setResponseRadius] = useState(5); // in km
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.helperProfile) {
      setIsAvailable(user.helperProfile.isAvailable);
      setResponseRadius((user.helperProfile.responseRadius || 5000) / 1000);
    }
  }, [user]);

  const handleToggleAvailability = async (value: boolean) => {
    if (!user) return;

    // Check if helper profile is complete
    if (!user.helperProfile) {
      Alert.alert(
        'Setup Required',
        'Please complete your helper profile first',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!user.helperProfile.verificationStatus || user.helperProfile.verificationStatus !== 'verified') {
      Alert.alert(
        'Verification Required',
        'Your helper profile needs to be verified before you can go online',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setLoading(true);
      setIsAvailable(value);

      // Update user profile
await updateUser({
  helperProfile: user.helperProfile ? {
    ...user.helperProfile,
    isAvailable: value,
  } : undefined,
});

      // Update socket connection
      if (value) {
        socketService.setHelperAvailability(user.id, true);
        Alert.alert(
          t('common.success'),
          'You are now available to help! You will receive emergency notifications.',
          [{ text: t('common.ok') }]
        );
      } else {
        socketService.setHelperAvailability(user.id, false);
      }
    } catch (error) {
      console.error('Failed to update availability:', error);
      setIsAvailable(!value); // Revert on error
      Alert.alert(t('common.error'), 'Failed to update availability');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRadius = async () => {
    if (!user) return;

    try {
      setLoading(true);
      await updateUser({
        helperProfile: {
          ...user.helperProfile!,
          responseRadius: responseRadius * 1000, // Convert to meters
        },
      });

      Alert.alert(
        t('common.success'),
        `Response radius updated to ${responseRadius} km`,
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      console.error('Failed to update radius:', error);
      Alert.alert(t('common.error'), 'Failed to update radius');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = () => {
    return isAvailable ? '#10B981' : '#6B7280';
  };

  const getStatusText = () => {
    return isAvailable ? t('helper.online') : t('helper.offline');
  };

  // Mock statistics - TODO: Get from backend
  const stats = {
    totalHelps: user?.totalHelps || 0,
    avgResponseTime: user?.helperProfile?.responseTime || 0,
    rating: Number(user?.rating) || 0,
    successfulHelps: user?.helperProfile?.successfulHelps || 0,
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t('helper.title')}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Icon name="circle" size={8} color="#FFFFFF" />
          <Text style={styles.statusText}>{getStatusText()}</Text>
        </View>
      </View>

      {/* Availability Toggle Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Icon name="heart-pulse" size={28} color={getStatusColor()} />
            <View style={styles.cardTitleText}>
              <Text style={styles.cardTitle}>{t('helper.availableToHelp')}</Text>
              <Text style={styles.cardSubtitle}>
                {isAvailable 
                  ? 'You will receive emergency notifications'
                  : 'Turn on to start receiving requests'}
              </Text>
            </View>
          </View>
          <Switch
            value={isAvailable}
            onValueChange={handleToggleAvailability}
            disabled={loading}
            trackColor={{ false: '#CBD5E0', true: '#86EFAC' }}
            thumbColor={isAvailable ? '#10B981' : '#F3F4F6'}
          />
        </View>
      </View>

      {/* Response Radius Card */}
      {user?.helperProfile && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="map-marker-radius" size={24} color="#3B82F6" />
            <Text style={styles.cardTitle}>{t('helper.responseRadius')}</Text>
          </View>
          
          <View style={styles.radiusContainer}>
            <Text style={styles.radiusValue}>{responseRadius.toFixed(1)} km</Text>
            <Text style={styles.radiusSubtext}>
              Emergency requests within this radius
            </Text>
          </View>

          <Slider
            style={styles.slider}
            minimumValue={0.5}
            maximumValue={20}
            step={0.5}
            value={responseRadius}
            onValueChange={setResponseRadius}
            minimumTrackTintColor="#3B82F6"
            maximumTrackTintColor="#CBD5E0"
            thumbTintColor="#3B82F6"
          />

          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdateRadius}
            disabled={loading}
          >
            <Text style={styles.updateButtonText}>Update Radius</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Statistics Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="chart-line" size={24} color="#F59E0B" />
          <Text style={styles.cardTitle}>{t('helper.statistics')}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Icon name="hand-heart" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{stats.totalHelps}</Text>
            <Text style={styles.statLabel}>{t('helper.totalHelps')}</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEF3C7' }]}>
              <Icon name="clock-fast" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.statValue}>
              {Math.floor(stats.avgResponseTime / 60) || 0}m
            </Text>
            <Text style={styles.statLabel}>{t('helper.avgResponseTime')}</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FEE2E2' }]}>
              <Icon name="star" size={24} color="#EF4444" />
            </View>
            <Text style={styles.statValue}>{(stats.rating || 0).toFixed(1)}</Text>
            <Text style={styles.statLabel}>{t('helper.rating')}</Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIconContainer, { backgroundColor: '#D1FAE5' }]}>
              <Icon name="check-circle" size={24} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{stats.successfulHelps}</Text>
            <Text style={styles.statLabel}>Successful</Text>
          </View>
        </View>
      </View>

      {/* Helper Profile Info */}
      {user?.helperProfile && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="account-details" size={24} color="#8B5CF6" />
            <Text style={styles.cardTitle}>Helper Profile</Text>
          </View>

          <View style={styles.profileInfo}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Training Level:</Text>
              <Text style={styles.profileValue}>
                {user.helperProfile.trainingLevel.replace('_', ' ').toUpperCase()}
              </Text>
            </View>

            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Verification:</Text>
              <View style={styles.verificationBadge}>
                <Icon 
                  name={user.helperProfile.verificationStatus === 'verified' ? 'check-decagram' : 'clock-outline'} 
                  size={16} 
                  color={user.helperProfile.verificationStatus === 'verified' ? '#10B981' : '#F59E0B'} 
                />
                <Text style={[
                  styles.verificationText,
                  { color: user.helperProfile.verificationStatus === 'verified' ? '#10B981' : '#F59E0B' }
                ]}>
                  {user.helperProfile.verificationStatus.toUpperCase()}
                </Text>
              </View>
            </View>

            {user.helperProfile.situationsWillingToHelp && user.helperProfile.situationsWillingToHelp.length > 0 && (
              <View style={styles.profileRow}>
                <Text style={styles.profileLabel}>Can Help With:</Text>
                <View style={styles.situationsList}>
                  {user.helperProfile.situationsWillingToHelp.map((situation, index) => (
                    <View key={index} style={styles.situationTag}>
                      <Text style={styles.situationText}>
                        {situation.replace('_', ' ')}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Setup Helper Profile Button */}
      {!user?.helperProfile && (
        <TouchableOpacity style={styles.setupCard}>
          <Icon name="account-plus" size={48} color="#3B82F6" />
          <Text style={styles.setupTitle}>Become a Helper</Text>
          <Text style={styles.setupText}>
            Complete your helper profile to start assisting people in emergencies
          </Text>
          <View style={styles.setupButton}>
            <Text style={styles.setupButtonText}>Setup Helper Profile</Text>
            <Icon name="arrow-right" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      )}

      {/* Important Notice */}
      <View style={styles.noticeCard}>
        <Icon name="information" size={24} color="#3B82F6" />
        <Text style={styles.noticeText}>
          As a helper, you provide assistance while waiting for professional emergency services. 
          Always ensure your own safety first and call 112/911 when needed.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitleText: {
    marginLeft: 12,
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginLeft: 12,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  radiusContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  radiusValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  radiusSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  updateButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  profileInfo: {
    gap: 16,
  },
  profileRow: {
    gap: 8,
  },
  profileLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  profileValue: {
    fontSize: 16,
    color: '#1A202C',
    fontWeight: '500',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verificationText: {
    fontSize: 14,
    fontWeight: '600',
  },
  situationsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  situationTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  situationText: {
    fontSize: 12,
    color: '#4B5563',
    textTransform: 'capitalize',
  },
  setupCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  setupTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginTop: 16,
    marginBottom: 8,
  },
  setupText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  setupButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#1E40AF',
    lineHeight: 20,
  },
});

export default HelperModeScreen;
