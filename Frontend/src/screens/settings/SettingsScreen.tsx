import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useAuth } from '../../contexts/AuthContext';
import { RootStackParamList } from '../../types';

type SettingsNavigationProp = StackNavigationProp<RootStackParamList>;

const SettingsScreen: React.FC = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<SettingsNavigationProp>();
  const { user, updateUser } = useAuth();

  // Notification settings
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);

  // Privacy settings
  const [shareLocation, setShareLocation] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'helpers_only' | 'private'>('helpers_only');
  const [showActivityHistory, setShowActivityHistory] = useState(true);

  // Security settings
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            // TODO: Implement account deletion
            Alert.alert('Account Deleted', 'Your account has been deleted.');
          },
        },
      ]
    );
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

  const renderSettingRow = (
    label: string,
    value: boolean,
    onChange: (value: boolean) => void,
    description?: string
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#CBD5E0', true: '#FCA5A5' }}
        thumbColor={value ? '#E53E3E' : '#F3F4F6'}
      />
    </View>
  );

  const renderNavigationRow = (label: string, icon: string, onPress: () => void, badge?: string) => (
    <TouchableOpacity style={styles.navigationRow} onPress={onPress}>
      <View style={styles.navigationLeft}>
        <Icon name={icon} size={22} color="#6B7280" />
        <Text style={styles.navigationLabel}>{label}</Text>
      </View>
      <View style={styles.navigationRight}>
        {badge && <Text style={styles.badge}>{badge}</Text>}
        <Icon name="chevron-right" size={24} color="#CBD5E0" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      {/* Notifications */}
      {renderSection(t('settings.notifications'), 'bell',
        <>
          {renderSettingRow(
            t('settings.emergencyAlerts'),
            emergencyAlerts,
            setEmergencyAlerts,
            'Critical alerts about nearby emergencies'
          )}
          {renderSettingRow(
            t('settings.systemUpdates'),
            systemUpdates,
            setSystemUpdates,
            'Updates about new features and changes'
          )}
          {renderSettingRow(
            t('settings.emailNotifications'),
            emailNotifications,
            setEmailNotifications
          )}
          {renderSettingRow(
            t('settings.smsNotifications'),
            smsNotifications,
            setSmsNotifications
          )}
          {renderSettingRow(t('settings.sound'), sound, setSound)}
          {renderSettingRow(t('settings.vibration'), vibration, setVibration)}
        </>
      )}

      {/* Privacy */}
      {renderSection(t('settings.privacy'), 'shield-account',
        <>
          {renderSettingRow(
            t('settings.shareLocation'),
            shareLocation,
            setShareLocation,
            'Share your location with helpers during emergencies'
          )}
          {renderSettingRow(
            t('settings.activityHistory'),
            showActivityHistory,
            setShowActivityHistory,
            'Show your emergency history to others'
          )}
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('settings.profileVisibility')}</Text>
          </View>
          <View style={styles.visibilityOptions}>
            {['public', 'helpers_only', 'private'].map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.visibilityOption,
                  profileVisibility === option && styles.visibilityOptionActive,
                ]}
                onPress={() => setProfileVisibility(option as any)}
              >
                <Text
                  style={[
                    styles.visibilityText,
                    profileVisibility === option && styles.visibilityTextActive,
                  ]}
                >
                  {t(`settings.${option}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Security */}
      {renderSection(t('settings.security'), 'lock',
        <>
          {renderSettingRow(
            t('settings.biometricAuth'),
            biometricEnabled,
            setBiometricEnabled,
            'Use Face ID or fingerprint to unlock'
          )}
          {renderSettingRow(
            t('settings.twoFactor'),
            twoFactorEnabled,
            setTwoFactorEnabled,
            'Add extra security to your account'
          )}
          {renderNavigationRow(
            t('settings.changePassword'),
            'key-change',
            () => navigation.navigate('ForgotPassword')
          )}
        </>
      )}

      {/* Language & Region */}
      {renderSection(t('settings.language'), 'translate',
        <>
          {renderNavigationRow(
            'Language',
            'web',
            () => Alert.alert('Coming Soon', 'Language selection will be available soon'),
            user?.language.toUpperCase()
          )}
        </>
      )}

      {/* Subscription */}
      {renderSection(t('settings.subscription'), 'credit-card',
        <>
          {renderNavigationRow(
            t('settings.subscriptionStatus'),
            'card-account-details',
            () => Alert.alert('Subscription', 'Active until Dec 31, 2026'),
            t('settings.active')
          )}
          {renderNavigationRow(
            t('settings.manageSubscription'),
            'cog',
            () => Alert.alert('Manage Subscription', 'Opens App Store/Play Store')
          )}
          {renderNavigationRow(
            t('settings.restorePurchases'),
            'restore',
            () => Alert.alert('Restore Purchases', 'Checking for previous purchases...')
          )}
        </>
      )}

      {/* Legal */}
      {renderSection(t('settings.legal'), 'file-document',
        <>
          {renderNavigationRow(
            t('settings.termsOfService'),
            'text-box-check',
            () => navigation.navigate('Legal', { type: 'terms' })
          )}
          {renderNavigationRow(
            t('settings.privacyPolicy'),
            'shield-check',
            () => navigation.navigate('Legal', { type: 'privacy' })
          )}
          {renderNavigationRow(
            t('settings.cookiePolicy'),
            'cookie',
            () => navigation.navigate('Legal', { type: 'cookies' })
          )}
          {renderNavigationRow(
            t('settings.communityGuidelines'),
            'account-group',
            () => Alert.alert('Community Guidelines', 'Opens community guidelines')
          )}
        </>
      )}

      {/* Support */}
      {renderSection(t('settings.support'), 'help-circle',
        <>
          {renderNavigationRow(
            t('settings.contactSupport'),
            'email',
            () => Alert.alert('Contact Support', 'support@helpnow.com')
          )}
          {renderNavigationRow(
            t('settings.faq'),
            'frequently-asked-questions',
            () => Alert.alert('FAQ', 'Opens FAQ page')
          )}
          {renderNavigationRow(
            t('settings.reportBug'),
            'bug',
            () => Alert.alert('Report Bug', 'Opens bug report form')
          )}
        </>
      )}

      {/* About */}
      {renderSection(t('settings.about'), 'information',
        <>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>{t('settings.version')}</Text>
            <Text style={styles.versionText}>1.0.0 (Beta)</Text>
          </View>
        </>
      )}

      {/* Danger Zone */}
      <View style={styles.dangerSection}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Icon name="delete-forever" size={20} color="#EF4444" />
          <Text style={styles.deleteButtonText}>{t('settings.deleteAccount')}</Text>
        </TouchableOpacity>
        <Text style={styles.deleteWarning}>{t('settings.deleteAccountWarning')}</Text>
      </View>

      <View style={styles.footer} />
    </ScrollView>
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
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A202C',
    marginLeft: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    color: '#1A202C',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  navigationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  navigationLabel: {
    fontSize: 16,
    color: '#1A202C',
    marginLeft: 12,
  },
  navigationRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  versionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  visibilityOptions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginTop: 8,
  },
  visibilityOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  visibilityOptionActive: {
    backgroundColor: '#E53E3E',
    borderColor: '#E53E3E',
  },
  visibilityText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  visibilityTextActive: {
    color: '#FFFFFF',
  },
  dangerSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 32,
    marginBottom: 16,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#FEE2E2',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  deleteWarning: {
    fontSize: 12,
    color: '#991B1B',
    marginTop: 8,
    textAlign: 'center',
  },
  footer: {
    height: 100,
  },
});

export default SettingsScreen;
