import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList, User } from '../../types';

type EditProfileNavigationProp = StackNavigationProp<RootStackParamList>;

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const EditProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<EditProfileNavigationProp>();
  const { user, updateUser } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || user?.first_name || '',
    lastName: user?.lastName || user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || user?.phoneNumber || user?.phone_number || '',
    dateOfBirth: user?.dateOfBirth || user?.date_of_birth || '',
    gender: user?.gender || 'prefer_not_to_say',
  });

  const validate = (): string | null => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (formData.dateOfBirth && !DATE_REGEX.test(formData.dateOfBirth)) {
      return 'Date of birth must be in YYYY-MM-DD format (e.g. 1990-05-21)';
    }
    return null;
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      Alert.alert('Invalid Input', validationError);
      return;
    }

    // Only include optional fields if they have values
    const payload: Record<string, any> = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      gender: formData.gender,
    };

    if (formData.phone.trim()) payload.phone = formData.phone.trim();
    if (formData.dateOfBirth.trim()) payload.dateOfBirth = formData.dateOfBirth.trim();

    try {
      setLoading(true);
      await updateUser(payload);
      Alert.alert(
        t('common.success'),
        t('success.profileUpdated') || 'Profile updated successfully',
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      const details = error?.response?.data?.details;
      if (details && Array.isArray(details)) {
        const messages = details.map((d: any) => d.message).join('\n');
        Alert.alert('Validation Error', messages);
      } else {
        Alert.alert(t('common.error'), 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="close" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('profile.editProfile')}</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading}
          style={styles.saveButton}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#E53E3E" />
          ) : (
            <Text style={styles.saveText}>{t('common.save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Profile Photo */}
        <View style={styles.photoSection}>
          <View style={styles.photoPlaceholder}>
            <Icon name="account" size={48} color="#FFFFFF" />
          </View>
          <TouchableOpacity style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Personal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('auth.firstName')} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.firstName}
              onChangeText={(value) => updateField('firstName', value)}
              placeholder="John"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('auth.lastName')} <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.lastName}
              onChangeText={(value) => updateField('lastName', value)}
              placeholder="Doe"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.email')}</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(value) => updateField('email', value)}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('auth.phoneNumber')}</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(value) => updateField('phone', value)}
              placeholder="+33 6 12 34 56 78"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              {t('profile.dateOfBirth')}{' '}
              <Text style={styles.hint}>(YYYY-MM-DD)</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={formData.dateOfBirth}
              onChangeText={(value) => updateField('dateOfBirth', value)}
              placeholder="1990-05-21"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('profile.gender')}</Text>
            <View style={styles.genderOptions}>
              {(['male', 'female', 'other', 'prefer_not_to_say'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.genderOption,
                    formData.gender === option && styles.genderOptionActive,
                  ]}
                  onPress={() => updateField('gender', option)}
                >
                  <Text
                    style={[
                      styles.genderText,
                      formData.gender === option && styles.genderTextActive,
                    ]}
                  >
                    {t(`profile.${option}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('profile.emergencyContacts')}</Text>
            <TouchableOpacity>
              <Icon name="plus-circle" size={24} color="#E53E3E" />
            </TouchableOpacity>
          </View>
          <Text style={styles.comingSoon}>Emergency contact management coming soon</Text>
        </View>

        {/* Addresses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('profile.addresses')}</Text>
            <TouchableOpacity>
              <Icon name="plus-circle" size={24} color="#E53E3E" />
            </TouchableOpacity>
          </View>
          <Text style={styles.comingSoon}>Address management coming soon</Text>
        </View>

        {/* Medical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.medicalInfo')}</Text>
          <Text style={styles.comingSoon}>Medical information management coming soon</Text>
        </View>

        {/* Helper Profile */}
        {user?.isHelper && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Helper Profile</Text>
            <Text style={styles.comingSoon}>Helper profile management coming soon</Text>
          </View>
        )}

        <View style={styles.footer} />
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 4,
    minWidth: 60,
    alignItems: 'flex-end',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E53E3E',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E53E3E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  required: {
    color: '#E53E3E',
  },
  hint: {
    color: '#9CA3AF',
    fontWeight: '400',
    fontSize: 12,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1A202C',
  },
  genderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  genderOptionActive: {
    backgroundColor: '#E53E3E',
    borderColor: '#E53E3E',
  },
  genderText: {
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '500',
  },
  genderTextActive: {
    color: '#FFFFFF',
  },
  comingSoon: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  footer: {
    height: 40,
  },
});

export default EditProfileScreen;
