import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Geolocation from 'react-native-geolocation-service';

import { useEmergency } from '../../contexts/EmergencyContext';
import { RootStackParamList, EmergencyType, Location } from '../../types';

type EmergencyRequestNavigationProp = StackNavigationProp<RootStackParamList, 'EmergencyRequest'>;

interface EmergencyOption {
  type: EmergencyType;
  icon: string;
  color: string;
  labelKey: string;
}

const emergencyOptions: EmergencyOption[] = [
  {
    type: 'heart_attack',
    icon: 'heart-pulse',
    color: '#DC2626',
    labelKey: 'emergency.heartAttack',
  },
  {
    type: 'accident',
    icon: 'car-crash',
    color: '#EA580C',
    labelKey: 'emergency.accident',
  },
  {
    type: 'fall',
    icon: 'human-handsdown',
    color: '#D97706',
    labelKey: 'emergency.fall',
  },
  {
    type: 'breathing_difficulty',
    icon: 'lungs',
    color: '#2563EB',
    labelKey: 'emergency.breathing',
  },
  {
    type: 'loss_consciousness',
    icon: 'head-alert',
    color: '#7C3AED',
    labelKey: 'emergency.unconscious',
  },
  {
    type: 'allergic_reaction',
    icon: 'allergy',
    color: '#DB2777',
    labelKey: 'emergency.allergic',
  },
  {
    type: 'other',
    icon: 'alert-circle',
    color: '#6B7280',
    labelKey: 'emergency.other',
  },
];

const EmergencyRequestScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<EmergencyRequestNavigationProp>();
  const { createEmergencyRequest } = useEmergency();

  const [selectedType, setSelectedType] = useState<EmergencyType | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async () => {
    if (!selectedType) {
      Alert.alert(t('common.error'), 'Please select an emergency type');
      return;
    }

    Alert.alert(
      'Send Emergency Request',
      'This will notify nearby helpers. Always call 112/911 first for professional help.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('emergency.sendRequest'),
          style: 'destructive',
          onPress: sendRequest,
        },
      ]
    );
  };

  const sendRequest = async () => {
    try {
      setLoading(true);

      // Get current location
      const position = await new Promise<Geolocation.GeoPosition>((resolve, reject) => {
        Geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 10000,
          }
        );
      });

      const location: Location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      // Create emergency request
      await createEmergencyRequest(selectedType!, location, description || undefined);

      // Navigate to active emergency screen
      navigation.goBack();
    } catch (error: any) {
      console.error('Error creating emergency request:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('errors.requestFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
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
        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Icon name="alert" size={24} color="#DC2626" />
          <Text style={styles.warningText}>
            Always call 112/911 first for professional emergency services
          </Text>
        </View>

        {/* Emergency Type Selection */}
        <View style={styles.optionsGrid}>
          {emergencyOptions.map((option) => (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.optionCard,
                selectedType === option.type && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedType(option.type)}
            >
              <View
                style={[
                  styles.optionIconContainer,
                  { backgroundColor: option.color + '20' },
                ]}
              >
                <Icon name={option.icon} size={32} color={option.color} />
              </View>
              <Text style={styles.optionLabel}>{t(option.labelKey)}</Text>
              {selectedType === option.type && (
                <View style={styles.selectedIndicator}>
                  <Icon name="check-circle" size={24} color="#10B981" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Description Input */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionLabel}>
            {t('emergency.addDescription')}
          </Text>
          <View style={styles.textAreaWrapper}>
            <TextInput
              style={styles.textArea}
              placeholder="Additional details (optional)"
              placeholderTextColor="#A0AEC0"
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
              maxLength={500}
            />
          </View>
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* Voice Note Option (Future Feature) */}
        <TouchableOpacity style={styles.voiceButton} disabled>
          <Icon name="microphone" size={24} color="#718096" />
          <Text style={styles.voiceButtonText}>
            {t('emergency.recordVoiceNote')} (Coming Soon)
          </Text>
        </TouchableOpacity>

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Icon name="map-marker" size={20} color="#4299E1" />
          <Text style={styles.locationText}>
            Your current location will be shared with helpers
          </Text>
        </View>
      </ScrollView>

      {/* Send Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!selectedType || loading) && styles.sendButtonDisabled,
          ]}
          onPress={handleSendRequest}
          disabled={!selectedType || loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Icon name="send" size={24} color="#FFFFFF" />
              <Text style={styles.sendButtonText}>
                {t('emergency.sendRequest')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  closeButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A202C',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#991B1B',
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
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
  optionCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  optionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 12,
  },
  textAreaWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  textArea: {
    fontSize: 16,
    color: '#1A202C',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'right',
    marginTop: 4,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 20,
    opacity: 0.5,
  },
  voiceButtonText: {
    fontSize: 16,
    color: '#718096',
    marginLeft: 12,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    padding: 12,
    borderRadius: 8,
  },
  locationText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#2C5282',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  sendButton: {
    flexDirection: 'row',
    backgroundColor: '#E53E3E',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CBD5E0',
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
});

export default EmergencyRequestScreen;
