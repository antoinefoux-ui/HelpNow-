import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location';

import { useEmergency } from '../../contexts/EmergencyContext';
import { RootStackParamList, EmergencyType, Location as LocationType } from '../../types';

type EmergencyRequestNavigationProp = StackNavigationProp<RootStackParamList, 'EmergencyRequest'>;

interface EmergencyOption {
  type: EmergencyType;
  icon: string;
  color: string;
  labelKey: string;
}

const emergencyOptions: EmergencyOption[] = [
  { type: 'heart_attack',         icon: 'heart-pulse',     color: '#DC2626', labelKey: 'emergency.heartAttack' },
  { type: 'accident',             icon: 'car-emergency',   color: '#EA580C', labelKey: 'emergency.accident' },
  { type: 'fall',                 icon: 'human-handsdown', color: '#D97706', labelKey: 'emergency.fall' },
  { type: 'breathing_difficulty', icon: 'lungs',           color: '#2563EB', labelKey: 'emergency.breathing' },
  { type: 'loss_consciousness',   icon: 'head-alert',      color: '#7C3AED', labelKey: 'emergency.unconscious' },
  { type: 'allergic_reaction',    icon: 'allergy',         color: '#DB2777', labelKey: 'emergency.allergic' },
  { type: 'other',                icon: 'alert-circle',    color: '#6B7280', labelKey: 'emergency.other' },
];

interface ActiveRequest {
  id: string;
  category: EmergencyType | null;
  status: string;
}

const EmergencyRequestScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<EmergencyRequestNavigationProp>();
  const { createEmergencyRequest, updateEmergencyType, cancelEmergencyRequest } = useEmergency();

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeRequest, setActiveRequest] = useState<ActiveRequest | null>(null);
  const [selectedType, setSelectedType]   = useState<EmergencyType | null>(null);
  const [description, setDescription]     = useState('');
  const [loading, setLoading]             = useState(false);
  const [updating, setUpdating]           = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  // ── Pulse animation (only before request is sent) ─────────────────────────
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef  = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!activeRequest) {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 750, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 750, useNativeDriver: true }),
        ])
      );
      pulseRef.current.start();
    } else {
      pulseRef.current?.stop();
      pulseAnim.setValue(1);
    }
    return () => pulseRef.current?.stop();
  }, [!!activeRequest]);

  // ── 1. SOS tap → get location → send request immediately, no confirmation ─
  const handleRequestHelp = async () => {
    if (loading || activeRequest) return;
    setLoading(true);
    setError(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError(t('common.error') + ': Location permission is required.');
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const location: LocationType = {
        latitude:  position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy:  position.coords.accuracy,
      };

      // createEmergencyRequest from your EmergencyContext — type is null until user picks
      const created = await createEmergencyRequest(null, location, description || undefined);
      setActiveRequest(created);
    } catch (err: any) {
      setError(err.message || t('errors.requestFailed'));
    } finally {
      setLoading(false);
    }
  };

  // ── 2. Type tap → auto-updates request immediately, no confirmation ────────
  const handleSelectType = async (type: EmergencyType) => {
    if (!activeRequest || updating) return;
    const newType = selectedType === type ? null : type;
    setSelectedType(newType);   // optimistic
    setUpdating(true);

    try {
      await updateEmergencyType(activeRequest.id, newType);
      setActiveRequest(prev => prev ? { ...prev, category: newType } : prev);
    } catch {
      setSelectedType(selectedType); // revert on failure
    } finally {
      setUpdating(false);
    }
  };

  // ── Cancel ─────────────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!activeRequest || loading) return;
    setLoading(true);

    try {
      await cancelEmergencyRequest(activeRequest.id);
      navigation.goBack();
    } catch {
      setError('Could not cancel. Please try again.');
      setLoading(false);
    }
  };

  // ── Close before sending ───────────────────────────────────────────────────
  const handleClose = () => navigation.goBack();

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ══ STATE 1: No active request — SOS button ══ */}
      {!activeRequest && (
        <>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={28} color="#1A202C" />
            </TouchableOpacity>
            <Text style={styles.title}>{t('emergency.selectType')}</Text>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Warning */}
            <View style={styles.warningBanner}>
              <Icon name="alert" size={24} color="#DC2626" />
              <Text style={styles.warningText}>
                Always call 112/911 first for professional emergency services
              </Text>
            </View>

            {/* Optional description before sending */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>{t('emergency.addDescription')}</Text>
              <View style={styles.textAreaWrapper}>
                <TextInput
                  style={styles.textArea}
                  placeholder="Additional details (optional)"
                  placeholderTextColor="#A0AEC0"
                  multiline
                  numberOfLines={3}
                  value={description}
                  onChangeText={setDescription}
                  maxLength={500}
                />
              </View>
              <Text style={styles.charCount}>{description.length}/500</Text>
            </View>

            {/* Location note */}
            <View style={styles.locationInfo}>
              <Icon name="map-marker" size={20} color="#4299E1" />
              <Text style={styles.locationText}>
                Your current location will be shared with helpers
              </Text>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </ScrollView>

          {/* SOS Button */}
          <View style={styles.footer}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity
                style={[styles.sosButton, loading && styles.sosButtonDisabled]}
                onPress={handleRequestHelp}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading
                  ? <ActivityIndicator color="#FFFFFF" size="large" />
                  : <>
                      <Icon name="alert-circle" size={36} color="#FFFFFF" />
                      <Text style={styles.sosButtonText}>{t('emergency.sendRequest')}</Text>
                    </>
                }
              </TouchableOpacity>
            </Animated.View>
          </View>
        </>
      )}

      {/* ══ STATE 2: Active request — type selector ══ */}
      {activeRequest && (
        <ScrollView
          contentContainerStyle={styles.activeSection}
          showsVerticalScrollIndicator={false}
        >
          {/* Status banner */}
          <View style={styles.statusBanner}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>
              Help request sent — searching for helpers nearby
            </Text>
            {updating
              ? <ActivityIndicator color="#68d391" size="small" style={{ marginLeft: 8 }} />
              : null
            }
          </View>

          {/* Type selection */}
          <Text style={styles.typeHeading}>{t('emergency.selectType')}</Text>
          <Text style={styles.typeSubheading}>
            Optional — tap to update your request instantly
          </Text>

          <View style={styles.optionsGrid}>
            {emergencyOptions.map((option) => {
              const isSelected = selectedType === option.type;
              return (
                <TouchableOpacity
                  key={option.type}
                  style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                  onPress={() => handleSelectType(option.type)}
                  activeOpacity={0.75}
                  disabled={updating}
                >
                  <View style={[
                    styles.optionIconContainer,
                    { backgroundColor: option.color + '20' },
                    isSelected && { backgroundColor: option.color + '35' },
                  ]}>
                    <Icon name={option.icon} size={32} color={option.color} />
                  </View>
                  <Text style={styles.optionLabel}>{t(option.labelKey)}</Text>
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Icon name="check-circle" size={24} color="#10B981" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {/* Cancel */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#E53E3E" />
              : <Text style={styles.cancelText}>{t('common.cancel')} Request</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },

  // ── Header (pre-request) ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: { marginRight: 16 },
  title: { fontSize: 20, fontWeight: '600', color: '#1A202C' },

  // ── Pre-request scroll ──
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 16 },

  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  warningText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#991B1B', fontWeight: '600' },

  descriptionContainer: { marginBottom: 20 },
  descriptionLabel: { fontSize: 16, fontWeight: '600', color: '#1A202C', marginBottom: 12 },
  textAreaWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  textArea: { fontSize: 16, color: '#1A202C', minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: '#718096', textAlign: 'right', marginTop: 4 },

  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  locationText: { flex: 1, marginLeft: 12, fontSize: 13, color: '#2C5282' },

  // ── SOS footer button ──
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sosButton: {
    backgroundColor: '#E53E3E',
    borderRadius: 16,
    height: 64,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#E53E3E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  sosButtonDisabled: { opacity: 0.65 },
  sosButtonText: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginLeft: 12 },

  // ── Active request state ──
  activeSection: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 64 : 40,
    paddingBottom: 56,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    borderWidth: 1,
    borderColor: '#9AE6B4',
    borderRadius: 14,
    padding: 16,
    marginBottom: 32,
  },
  statusDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#48BB78', marginRight: 10,
  },
  statusText: { flex: 1, color: '#22543D', fontSize: 14, fontWeight: '600' },

  typeHeading:    { fontSize: 22, fontWeight: '700', color: '#1A202C', marginBottom: 4 },
  typeSubheading: { fontSize: 13, color: '#718096', marginBottom: 20 },

  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  optionCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  optionCardSelected: { borderColor: '#10B981', backgroundColor: '#F0FDF4' },
  optionIconContainer: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 12,
  },
  optionLabel: { fontSize: 14, fontWeight: '600', color: '#1A202C', textAlign: 'center' },
  selectedIndicator: { position: 'absolute', top: 8, right: 8 },

  cancelButton: {
    borderWidth: 2,
    borderColor: '#E53E3E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelText: { color: '#E53E3E', fontSize: 16, fontWeight: '600' },

  errorText: { color: '#E53E3E', fontSize: 13, textAlign: 'center', marginBottom: 12 },
});

export default EmergencyRequestScreen;
