# HelpNow - Emergency Assistance App

![HelpNow Logo](https://via.placeholder.com/200x200?text=HelpNow)

## Overview

HelpNow is a life-saving mobile application that connects people in medical emergencies with nearby trained helpers during the critical minutes before professional emergency services arrive. Available on iOS and Android.

**Key Features:**
- 🚨 One-tap emergency request with geolocation
- 👥 Real-time helper matching and tracking
- 🗺️ Uber/Bolt-style navigation with ETA
- 🌍 Support for 10 languages
- ✅ Verified helper certifications
- 📍 Precise location sharing with arrival instructions
- 💬 In-app communication
- ⭐ Rating and review system
- 🔒 GDPR compliant and privacy-focused

## Supported Languages

- English
- French
- Spanish
- Polish
- Russian
- Ukrainian
- Slovak
- Czech
- German
- Italian

## Technology Stack

### Frontend
- **React Native 0.73** - Cross-platform mobile development
- **TypeScript** - Type-safe JavaScript
- **React Navigation** - Navigation and routing
- **React Native Maps** - Interactive maps
- **Firebase** - Authentication and real-time database
- **Socket.io** - Real-time communication
- **i18next** - Internationalization

### Backend (Requirements)
- **Node.js / Python / Ruby** - Backend server
- **PostgreSQL with PostGIS** - Geospatial database
- **Redis** - Real-time data caching
- **Socket.io** - WebSocket server
- **Express / FastAPI / Rails** - RESTful API

### Infrastructure
- **OVH Cloud** - Hosting (Europe-based, GDPR compliant)
- **Firebase Cloud Messaging** - Push notifications
- **Google Maps / Apple Maps** - Mapping services

## Project Structure

```
HelpNow/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Map.tsx
│   │   └── ...
│   ├── screens/            # App screens
│   │   ├── auth/
│   │   │   ├── SignInScreen.tsx
│   │   │   ├── SignUpScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   ├── home/
│   │   │   └── HomeScreen.tsx
│   │   ├── emergency/
│   │   │   ├── EmergencyRequestScreen.tsx
│   │   │   └── ActiveEmergencyScreen.tsx
│   │   ├── helper/
│   │   │   ├── HelperModeScreen.tsx
│   │   │   └── HelperResponseScreen.tsx
│   │   ├── profile/
│   │   │   ├── ProfileScreen.tsx
│   │   │   └── EditProfileScreen.tsx
│   │   ├── activity/
│   │   │   └── ActivityScreen.tsx
│   │   ├── settings/
│   │   │   ├── SettingsScreen.tsx
│   │   │   └── LegalScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   └── SplashScreen.tsx
│   ├── navigation/         # Navigation configuration
│   │   ├── RootNavigator.tsx
│   │   └── MainTabNavigator.tsx
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx
│   │   └── EmergencyContext.tsx
│   ├── services/           # API and external services
│   │   ├── authService.ts
│   │   ├── emergencyService.ts
│   │   ├── socketService.ts
│   │   ├── locationService.ts
│   │   ├── notificationService.ts
│   │   └── subscriptionService.ts
│   ├── utils/              # Utility functions
│   │   ├── validation.ts
│   │   ├── formatting.ts
│   │   └── constants.ts
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts
│   ├── locales/            # Translation files
│   │   ├── en.json
│   │   ├── fr.json
│   │   ├── es.json
│   │   ├── pl.json
│   │   ├── ru.json
│   │   ├── uk.json
│   │   ├── sk.json
│   │   ├── cs.json
│   │   ├── de.json
│   │   └── it.json
│   ├── assets/             # Images, icons, fonts
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   ├── App.tsx            # Main app component
│   └── i18n.ts            # i18n configuration
├── android/               # Android native code
├── ios/                   # iOS native code
├── app.json              # App configuration
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
└── README.md             # This file
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- React Native development environment
- Xcode (for iOS development)
- Android Studio (for Android development)
- Firebase account
- Google Maps API key
- OVH Cloud account

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository (when available)
git clone https://github.com/yourorg/helpnow.git
cd HelpNow

# Install dependencies
npm install

# iOS only - install pods
cd ios && pod install && cd ..
```

### Step 2: Environment Configuration

Create a `.env` file in the root directory:

```env
# API Configuration
API_URL=https://api.helpnow.com/v1
SOCKET_URL=https://api.helpnow.com

# Google Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Firebase (iOS)
IOS_FIREBASE_CLIENT_ID=your_ios_client_id
IOS_FIREBASE_REVERSED_CLIENT_ID=your_ios_reversed_client_id

# Firebase (Android)
ANDROID_FIREBASE_CLIENT_ID=your_android_client_id
```

### Step 3: Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Add iOS and Android apps to your Firebase project
3. Download `GoogleService-Info.plist` (iOS) and place in `ios/HelpNow/`
4. Download `google-services.json` (Android) and place in `android/app/`
5. Enable Authentication, Firestore, and Cloud Messaging in Firebase Console

### Step 4: Google Maps Setup

**iOS:**
Add to `ios/HelpNow/AppDelegate.mm`:
```objective-c
#import <GoogleMaps/GoogleMaps.h>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  [GMSServices provideAPIKey:@"YOUR_GOOGLE_MAPS_API_KEY"];
  // ... rest of code
}
```

**Android:**
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<meta-data
  android:name="com.google.android.geo.API_KEY"
  android:value="YOUR_GOOGLE_MAPS_API_KEY"/>
```

### Step 5: Run the App

```bash
# iOS
npm run ios

# Android
npm run android

# Start Metro bundler separately
npm start
```

## Backend Setup Requirements

The app requires a backend server with the following endpoints:

### Authentication Endpoints
- `POST /v1/auth/register` - Create new user account
- `POST /v1/auth/login` - User login
- `POST /v1/auth/refresh` - Refresh auth token
- `POST /v1/auth/reset-password` - Password reset

### User Endpoints
- `GET /v1/users/:userId` - Get user profile
- `PUT /v1/users/:userId` - Update user profile
- `DELETE /v1/users/:userId` - Delete account
- `POST /v1/users/:userId/photo` - Upload profile photo
- `POST /v1/users/:userId/certifications` - Upload certifications
- `POST /v1/users/:userId/verify-phone` - Verify phone number

### Emergency Endpoints
- `POST /v1/emergencies` - Create emergency request
- `GET /v1/emergencies/:requestId` - Get emergency details
- `GET /v1/emergencies/active/:userId` - Get active request
- `POST /v1/emergencies/:requestId/accept` - Helper accepts request
- `POST /v1/emergencies/:requestId/cancel` - Cancel request
- `POST /v1/emergencies/:requestId/resolve` - Resolve emergency
- `GET /v1/emergencies/nearby` - Get nearby emergencies
- `GET /v1/emergencies/history/:userId` - Get user history

### Socket.io Events
- `emergency:created` - New emergency created
- `emergency:accepted` - Helper accepted emergency
- `helper:location_update` - Helper location updated
- `helper:arrived` - Helper arrived at location
- `emergency:resolved` - Emergency resolved

### Database Schema (PostgreSQL with PostGIS)

**users table:**
- id (UUID, primary key)
- email (VARCHAR, unique)
- phone (VARCHAR, unique)
- firstName (VARCHAR)
- lastName (VARCHAR)
- profilePhoto (VARCHAR)
- dateOfBirth (DATE)
- gender (VARCHAR)
- isHelper (BOOLEAN)
- rating (DECIMAL)
- totalHelps (INTEGER)
- verified (BOOLEAN)
- createdAt (TIMESTAMP)

**emergency_requests table:**
- id (UUID, primary key)
- seekerId (UUID, foreign key -> users)
- helperId (UUID, foreign key -> users, nullable)
- type (VARCHAR)
- description (TEXT)
- location (GEOGRAPHY(Point, 4326))
- address (VARCHAR)
- status (VARCHAR)
- rating (INTEGER, nullable)
- feedback (TEXT, nullable)
- createdAt (TIMESTAMP)
- acceptedAt (TIMESTAMP, nullable)
- resolvedAt (TIMESTAMP, nullable)

**helper_profiles table:**
- userId (UUID, foreign key -> users)
- trainingLevel (VARCHAR)
- verificationStatus (VARCHAR)
- responseRadius (INTEGER)
- isAvailable (BOOLEAN)
- averageResponseTime (INTEGER)

**certifications table:**
- id (UUID, primary key)
- userId (UUID, foreign key -> users)
- type (VARCHAR)
- issuer (VARCHAR)
- issueDate (DATE)
- expiryDate (DATE)
- documentUrl (VARCHAR)
- verified (BOOLEAN)

## Payment & Subscriptions

### Implementation
The app uses native payment systems:

**iOS:** StoreKit In-App Purchases
- Annual subscription product ID: `com.helpnow.subscription.annual`
- Price: €1.99 or €2.99 per year
- Auto-renewable subscription

**Android:** Google Play Billing
- Annual subscription SKU: `helpnow_annual_subscription`
- Price: €1.99 or €2.99 per year
- Auto-renewable subscription

### Setup Instructions

1. **iOS App Store Connect:**
   - Create app in App Store Connect
   - Configure in-app purchases
   - Add subscription group
   - Create annual subscription product
   - Set pricing in all regions

2. **Google Play Console:**
   - Create app in Play Console
   - Set up subscription in Products > Subscriptions
   - Configure base plan
   - Set pricing across regions

3. **Testing:**
   - iOS: Use sandbox testers in App Store Connect
   - Android: Use test tracks in Play Console

## Features Implementation Status

### ✅ Completed
- Project structure and configuration
- TypeScript types and interfaces
- Multi-language support (10 languages)
- Authentication context
- Emergency management context
- Socket.io real-time communication
- Core services (auth, emergency, socket)
- Navigation structure
- Home screen with emergency button
- API integration framework

### 🚧 In Progress (Next Steps)
- All screen components
- Map integration with real-time tracking
- Push notification handling
- Location tracking service
- Payment/subscription integration
- Image upload and camera integration
- Voice recording for emergencies
- Biometric authentication
- Helper verification system

### 📋 To Be Implemented
- Complete UI components library
- Advanced search and filtering
- Analytics and crash reporting
- Deep linking
- App Store and Play Store assets
- Beta testing and QA
- Performance optimization
- Security auditing
- Comprehensive testing suite

## Development Guidelines

### Code Style
- Use TypeScript for all new files
- Follow ESLint configuration
- Use functional components with hooks
- Keep components small and focused
- Write descriptive commit messages

### Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run linter
npm run lint
```

### Building for Production

**iOS:**
```bash
# Create release build
cd ios
xcodebuild -workspace HelpNow.xcworkspace \
  -scheme HelpNow \
  -configuration Release \
  -archivePath build/HelpNow.xcarchive \
  archive
```

**Android:**
```bash
# Create signed APK/AAB
cd android
./gradlew assembleRelease
# or
./gradlew bundleRelease
```

## Deployment

### OVH Cloud Setup

1. **Create OVH instances:**
   ```bash
   # Production environment
   - Public Cloud instance: B2-15 (4 vCPU, 15GB RAM)
   - PostgreSQL database with PostGIS
   - Object Storage for user uploads
   - Load Balancer for traffic distribution
   ```

2. **Deploy backend:**
   ```bash
   # SSH into OVH instance
   ssh user@your-ovh-instance.com
   
   # Clone backend repo
   git clone your-backend-repo.git
   cd backend
   
   # Install dependencies and start
   npm install
   npm run build
   npm run start:prod
   ```

3. **Configure DNS and SSL:**
   - Point domain to OVH Load Balancer
   - Configure SSL with Let's Encrypt
   - Set up CDN for static assets

### App Store Submission

**iOS:**
1. Archive app in Xcode
2. Upload to App Store Connect
3. Fill in app metadata and screenshots
4. Submit for review
5. Wait for approval (1-2 weeks)

**Android:**
1. Generate signed AAB
2. Upload to Google Play Console
3. Complete store listing
4. Submit for review
5. Wait for approval (few days)

## Legal & Compliance

### Required Documents
All legal documents must be available in all 10 supported languages:

- ✅ Terms of Service
- ✅ Privacy Policy (GDPR compliant)
- ✅ Cookie Policy
- ✅ Community Guidelines
- ✅ Medical Disclaimer
- ✅ Liability Waiver

### GDPR Compliance Checklist
- [ ] Data collection consent
- [ ] Right to access data
- [ ] Right to erasure (delete account)
- [ ] Right to data portability
- [ ] Privacy by design
- [ ] Data breach procedures
- [ ] Cookie consent management

## Support & Contact

- **Email:** support@helpnow.com
- **Website:** https://www.helpnow.com
- **Documentation:** https://docs.helpnow.com
- **Status Page:** https://status.helpnow.com

## Contributing

This is a proprietary application. Internal team members should follow the contribution guidelines in CONTRIBUTING.md.

## License

Copyright © 2026 HelpNow. All rights reserved.
This is proprietary software. Unauthorized copying, distribution, or modification is strictly prohibited.

## Acknowledgments

- Emergency services professionals worldwide
- First aid organizations
- Beta testers and early adopters
- Open source community

---

**Emergency Disclaimer:** HelpNow is designed to supplement, not replace, professional emergency services. Always call 112/911 first in medical emergencies.
