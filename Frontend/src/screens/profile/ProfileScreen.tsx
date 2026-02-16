import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../types';

type ProfileNavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<ProfileNavigationProp>();
  const { user, signOut } = useAuth();

  if (!user) {
    return null;
  }

  const handleSignOut = () => {
    signOut();
  };

  const renderSection = (title: string, icon: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Icon name={icon} size={24} color="#E53E3E" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );

  const renderInfoRow = (label: string, value: string, icon?: string) => (
    <View style={styles.infoRow}>
      {icon && <Icon name={icon} size={20} color="#6B7280" style={styles.infoIcon} />}
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'Not provided'}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>{t('profile.title')}</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="cog" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          {user.profilePhoto ? (
            <Image source={{ uri: user.profilePhoto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Icon name="account" size={48} color="#FFFFFF" />
            </View>
          )}
          <TouchableOpacity style={styles.editAvatarButton}>
            <Icon name="camera" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.profileName}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={styles.profileEmail}>{user.email}</Text>

        {user.isHelper && user.helperProfile && (
          <View style={styles.helperBadge}>
            <Icon name="shield-check" size={16} color="#10B981" />
            <Text style={styles.helperBadgeText}>Verified Helper</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.editProfileButton}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Icon name="pencil" size={18} color="#FFFFFF" />
          <Text style={styles.editProfileText}>{t('profile.editProfile')}</Text>
        </TouchableOpacity>
      </View>

      {/* Personal Information */}
      {renderSection(t('profile.personalInfo'), 'account-details',
        <>
          {renderInfoRow('Phone', user.phone, 'phone')}
          {renderInfoRow('Date of Birth', user.dateOfBirth || 'Not set', 'calendar')}
          {renderInfoRow('Gender', user.gender || 'Not set', 'gender-male-female')}
          {renderInfoRow('Language', user.language.toUpperCase(), 'translate')}
        </>
      )}

      {/* Emergency Contacts */}
      {renderSection(t('profile.emergencyContacts'), 'account-multiple',
        user.emergencyContacts && user.emergencyContacts.length > 0 ? (
          user.emergencyContacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRelation}>{contact.relationship}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
              <TouchableOpacity style={styles.contactCallButton}>
                <Icon name="phone" size={20} color="#10B981" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No emergency contacts added</Text>
        )
      )}

      {/* Addresses */}
      {renderSection(t('profile.addresses'), 'map-marker',
        user.addresses && user.addresses.length > 0 ? (
          user.addresses.map((address) => (
            <View key={address.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <Text style={styles.addressLabel}>{address.label}</Text>
                {address.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryText}>Primary</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressText}>
                {address.street}, {address.city}
              </Text>
              {address.apartmentNumber && (
                <Text style={styles.addressDetail}>
                  Apt: {address.apartmentNumber}
                </Text>
              )}
              {address.arrivalInstructions && (
                <Text style={styles.addressInstructions}>
                  {address.arrivalInstructions}
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No addresses added</Text>
        )
      )}

      {/* Medical Information */}
      {user.medicalInfo && renderSection(t('profile.medicalInfo'), 'medical-bag',
        <>
          {user.medicalInfo.bloodType && renderInfoRow('Blood Type', user.medicalInfo.bloodType, 'water')}
          {user.medicalInfo.allergies && user.medicalInfo.allergies.length > 0 && (
            <View style={styles.infoRow}>
              <Icon name="alert" size={20} color="#6B7280" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Allergies</Text>
                <Text style={styles.infoValue}>
                  {user.medicalInfo.allergies.join(', ')}
                </Text>
              </View>
            </View>
          )}
          {user.medicalInfo.medications && user.medicalInfo.medications.length > 0 && (
            <View style={styles.infoRow}>
              <Icon name="pill" size={20} color="#6B7280" style={styles.infoIcon} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Medications</Text>
                <Text style={styles.infoValue}>
                  {user.medicalInfo.medications.join(', ')}
                </Text>
              </View>
            </View>
          )}
        </>
      )}

      {/* Helper Profile */}
      {user.isHelper && user.helperProfile && renderSection('Helper Profile', 'heart-pulse',
        <>
          {renderInfoRow('Training Level', user.helperProfile.trainingLevel.replace('_', ' ').toUpperCase())}
          {renderInfoRow('Verification Status', user.helperProfile.verificationStatus.toUpperCase())}
          {renderInfoRow('Response Radius', `${(user.helperProfile.responseRadius / 1000).toFixed(1)} km`)}
          
          {user.helperProfile.certifications && user.helperProfile.certifications.length > 0 && (
            <View style={styles.certificationsContainer}>
              <Text style={styles.certificationsTitle}>Certifications</Text>
              {user.helperProfile.certifications.map((cert) => (
                <View key={cert.id} style={styles.certCard}>
                  <Icon name="certificate" size={20} color="#F59E0B" />
                  <View style={styles.certInfo}>
                    <Text style={styles.certType}>{cert.type}</Text>
                    <Text style={styles.certIssuer}>{cert.issuer}</Text>
                    <Text style={styles.certDate}>
                      Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                    </Text>
                  </View>
                  {cert.verified && (
                    <Icon name="check-decagram" size={20} color="#10B981" />
                  )}
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Statistics */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Your Impact</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{user.totalHelps || 0}</Text>
            <Text style={styles.statLabel}>Total Helps</Text>
          </View>
          <View style={styles.statBox}>
            <View style={styles.ratingContainer}>
              <Icon name="star" size={20} color="#F59E0B" />
              <Text style={styles.statValue}>
                {user.rating && !isNaN(Number(user.rating)) 
                  ? Number(user.rating).toFixed(1) 
                  : '0.0'}
              </Text>
            </View>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Icon name="logout" size={20} color="#EF4444" />
        <Text style={styles.signOutText}>{t('auth.signOut')}</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>HelpNow v1.0.0</Text>
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
    paddingBottom: 120,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  settingsButton: {
    padding: 8,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E53E3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  helperBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  helperBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 6,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E53E3E',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  editProfileText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
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
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#1A202C',
    fontWeight: '500',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
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
    fontSize: 13,
    color: '#6B7280',
  },
  contactPhone: {
    fontSize: 13,
    color: '#4B5563',
    marginTop: 2,
  },
  contactCallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressCard: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    textTransform: 'capitalize',
  },
  primaryBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  primaryText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#3B82F6',
  },
  addressText: {
    fontSize: 14,
    color: '#1A202C',
  },
  addressDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  addressInstructions: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  certificationsContainer: {
    marginTop: 8,
  },
  certificationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 8,
  },
  certCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    marginBottom: 8,
  },
  certInfo: {
    flex: 1,
    marginLeft: 12,
  },
  certType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A202C',
  },
  certIssuer: {
    fontSize: 12,
    color: '#6B7280',
  },
  certDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  statLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default ProfileScreen;
