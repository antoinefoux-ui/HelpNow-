import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../types';

type LegalRouteProp = RouteProp<RootStackParamList, 'Legal'>;

const LegalScreen: React.FC = () => {
  const route = useRoute<LegalRouteProp>();
  const navigation = useNavigation();
  const { type } = route.params;

  const getTitle = () => {
    switch (type) {
      case 'terms':
        return 'Terms of Service';
      case 'privacy':
        return 'Privacy Policy';
      case 'cookies':
        return 'Cookie Policy';
      default:
        return 'Legal';
    }
  };

  const getContent = () => {
    switch (type) {
      case 'terms':
        return `HelpNow Terms of Service

Last Updated: February 14, 2026

1. ACCEPTANCE OF TERMS
By accessing and using the HelpNow application ("App"), you accept and agree to be bound by these Terms of Service.

2. DESCRIPTION OF SERVICE
HelpNow is an emergency assistance platform that connects individuals in need ("Seekers") with nearby trained helpers ("Helpers") during medical emergencies while waiting for professional emergency services.

3. IMPORTANT DISCLAIMER
HelpNow is NOT a substitute for professional emergency services. You must ALWAYS call 112/911 or your local emergency number first in case of a medical emergency. HelpNow helpers provide assistance while waiting for professional services to arrive.

4. USER RESPONSIBILITIES

4.1 Seekers Must:
- Call professional emergency services (112/911) first
- Provide accurate location information
- Give truthful descriptions of the emergency
- Not abuse the service for non-emergency situations

4.2 Helpers Must:
- Only accept requests they are qualified to handle
- Provide accurate information about their training
- Maintain valid certifications
- Prioritize their own safety
- Never provide medical care beyond their training level

5. ELIGIBILITY
You must be at least 18 years old to use this App. By using the App, you represent that you meet this requirement.

6. HELPER VERIFICATION
All Helpers must submit valid certifications which will be verified by HelpNow. We reserve the right to deny or revoke Helper status at any time.

7. LIMITATION OF LIABILITY
HelpNow, its officers, directors, employees, and agents shall not be liable for any damages arising from:
- Use or inability to use the App
- Actions or inactions of Helpers
- Emergency response outcomes
- Data loss or security breaches

8. INDEMNIFICATION
You agree to indemnify and hold harmless HelpNow from any claims arising from your use of the App or violation of these Terms.

9. SUBSCRIPTION AND PAYMENTS
The App requires an annual subscription (€1.99-€2.99). Subscriptions auto-renew unless cancelled. Refunds are subject to App Store/Play Store policies.

10. PRIVACY
Your use of the App is also governed by our Privacy Policy. Please review it carefully.

11. TERMINATION
We reserve the right to suspend or terminate your account at any time for violation of these Terms.

12. CHANGES TO TERMS
We may modify these Terms at any time. Continued use of the App constitutes acceptance of modified Terms.

13. GOVERNING LAW
These Terms are governed by the laws of France.

14. CONTACT
For questions about these Terms, contact: legal@helpnow.com`;

      case 'privacy':
        return `HelpNow Privacy Policy

Last Updated: February 14, 2026

1. INTRODUCTION
HelpNow ("we," "our," "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and protect your information.

2. DATA CONTROLLER
HelpNow is the data controller responsible for your personal data.

3. DATA WE COLLECT

3.1 Information You Provide:
- Name, email, phone number
- Date of birth, gender
- Profile photo
- Medical information (optional)
- Emergency contact details
- Training certifications (for Helpers)
- Addresses

3.2 Automatically Collected Data:
- Location data (when using the App)
- Device information
- Usage data and analytics
- IP address

3.3 Emergency Data:
- Emergency request details
- Voice recordings (if provided)
- Helper locations during active emergencies
- Communications between Seekers and Helpers

4. HOW WE USE YOUR DATA

We use your data to:
- Connect Seekers with nearby Helpers
- Verify Helper certifications
- Provide real-time location tracking
- Send emergency notifications
- Improve our services
- Comply with legal obligations

5. LEGAL BASIS FOR PROCESSING

We process your data based on:
- Contract performance (providing emergency services)
- Legitimate interests (safety and service improvement)
- Consent (optional medical information)
- Legal obligations

6. DATA SHARING

We share your data only:
- With Helpers during active emergencies
- With emergency services if necessary
- With service providers (cloud hosting, analytics)
- When required by law

We NEVER sell your personal data.

7. DATA RETENTION

We retain your data:
- Account data: Until account deletion + 30 days
- Emergency records: 2 years
- Certifications: Until expiry + 1 year

8. YOUR RIGHTS (GDPR)

You have the right to:
- Access your data
- Rectify inaccurate data
- Erase your data ("right to be forgotten")
- Restrict processing
- Data portability
- Object to processing
- Withdraw consent

9. DATA SECURITY

We implement appropriate security measures including:
- Encryption in transit and at rest
- Access controls
- Regular security audits
- Secure data centers (OVH Cloud, EU)

10. COOKIES

We use essential cookies for authentication and session management. No tracking cookies without consent.

11. CHILDREN'S PRIVACY

The App is not intended for users under 18. We do not knowingly collect data from children.

12. INTERNATIONAL TRANSFERS

Your data is stored in EU data centers (OVH Cloud). Any international transfers comply with GDPR.

13. CHANGES TO POLICY

We may update this Privacy Policy. Material changes will be notified via email or App notification.

14. CONTACT US

For privacy questions or to exercise your rights:
Email: privacy@helpnow.com
Address: [Your Company Address]

15. SUPERVISORY AUTHORITY

You have the right to lodge a complaint with your data protection authority.`;

      case 'cookies':
        return `HelpNow Cookie Policy

Last Updated: February 14, 2026

1. WHAT ARE COOKIES?
Cookies are small text files stored on your device when you use our App.

2. COOKIES WE USE

2.1 Essential Cookies (Always Active):
- Authentication cookies
- Session management
- Security cookies

These cookies are necessary for the App to function and cannot be disabled.

2.2 Analytics Cookies (Optional):
- Usage statistics
- Performance monitoring
- Crash reporting

These cookies help us improve the App.

2.3 What We DON'T Use:
- Advertising cookies
- Third-party tracking cookies
- Social media cookies

3. MANAGING COOKIES

Essential cookies cannot be disabled as they are required for the App to work.

You can manage optional cookies in Settings > Privacy.

4. THIRD-PARTY COOKIES

We do not allow third-party cookies except for essential services like:
- Firebase (authentication and analytics)
- Google Maps (location services)

5. COOKIE DURATION

- Session cookies: Deleted when you close the App
- Persistent cookies: Stored for up to 1 year

6. UPDATES

We may update this Cookie Policy. Check back regularly for changes.

7. CONTACT

Questions about cookies? Email: privacy@helpnow.com`;

      default:
        return 'Legal content not found.';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#1A202C" />
        </TouchableOpacity>
        <Text style={styles.title}>{getTitle()}</Text>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.text}>{getContent()}</Text>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            If you have any questions about {getTitle().toLowerCase()}, please contact us at legal@helpnow.com
          </Text>
        </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 60,
  },
  text: {
    fontSize: 14,
    lineHeight: 24,
    color: '#1A202C',
    fontFamily: 'monospace',
  },
  footer: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  footerText: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default LegalScreen;
