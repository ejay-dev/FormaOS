# FormaOS Mobile App

> 📱 Native iOS and Android wrapper for the FormaOS web application using Capacitor.

## Overview

FormaOS Mobile wraps the existing FormaOS web application into native mobile containers while preserving all functionality including authentication, plans, permissions, and the node/wire system logic.

## Features

- ✅ **Native Mobile Shell**: Capacitor-based wrapper for iOS and Android
- ✅ **Authentication Preserved**: Full login and session management
- ✅ **Plan System**: Complete access control and upgrade flows
- ✅ **Admin Permissions**: Full admin dashboard functionality  
- ✅ **Node/Wire Logic**: Visual state management system
- ✅ **Mobile Optimized**: Responsive design and mobile-specific UI
- ✅ **Safe Area Support**: Notch and rounded corner compatibility
- ✅ **Native Gestures**: Touch, swipe, and back button handling

## Project Structure

```
mobile/
├── package.json              # Mobile app dependencies
├── capacitor.config.json     # Capacitor configuration
├── capacitor.config.ts       # TypeScript Capacitor config
├── build-mobile.sh          # Build script for mobile apps
├── generate-assets.sh       # Asset generation script
├── src/
│   ├── mobile.ts            # Mobile app initialization
│   └── mobile.css           # Mobile-specific styles
├── ios/
│   └── Info.plist          # iOS app configuration
├── android/
│   ├── AndroidManifest.xml # Android app manifest
│   └── build.gradle.kts    # Android build configuration
└── resources/
    └── icon.json           # Icon generation config
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Xcode (for iOS development)
- Android Studio (for Android development)
- Capacitor CLI: `npm install -g @capacitor/cli`

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Build Web App for Mobile

```bash
# Run the mobile build script
./build-mobile.sh
```

### 3. Add Platforms

```bash
# Add iOS platform
npm run add:ios

# Add Android platform  
npm run add:android
```

### 4. Generate Assets

```bash
# Generate app icons and splash screens
./generate-assets.sh

# Note: You'll need to convert SVGs to PNG and place them in the correct directories
```

### 5. Open in IDEs

```bash
# Open iOS project in Xcode
npm run open:ios

# Open Android project in Android Studio
npm run open:android
```

## Development

### Live Reload Development

```bash
# iOS with live reload
npm run dev

# Android with live reload
npm run dev:android
```

### Building for Production

```bash
# Build web app and sync
npm run build

# Then build native apps in Xcode/Android Studio
```

## Configuration

### Capacitor Configuration

The app is configured via `capacitor.config.json`:

- **App ID**: `com.formaos.mobile`
- **App Name**: `FormaOS`
- **Web Directory**: `../out` (Next.js build output)
- **Scheme**: HTTPS for Android compatibility

### Mobile Optimizations

The mobile wrapper includes:

- **Safe Area Support**: Automatic padding for notches and rounded corners
- **Status Bar**: Dark theme matching FormaOS branding
- **Keyboard Handling**: Automatic resize when keyboard appears
- **Back Button**: Native Android back button handling
- **Splash Screen**: 2-second branded loading screen

### Deep Links

Supports deep linking for:
- Auth redirects: `formaos://auth/callback`
- App URLs: `https://app.formaos.com.au/*`

## Store Preparation

### iOS App Store

1. **Bundle Configuration**:
   - Bundle ID: `com.formaos.mobile`
   - App Name: `FormaOS`
   - Version: `1.0.0`

2. **Required Assets**:
   - App Icons (20x20 to 1024x1024)
   - Launch Images
   - App Store Screenshots

3. **Permissions**:
   - Camera (for evidence capture)
   - Photo Library (for document uploads)
   - Location (for compliance auditing)

### Android Google Play

1. **Package Configuration**:
   - Package Name: `com.formaos.mobile`
   - App Name: `FormaOS`
   - Version Code: `1`
   - Version Name: `1.0.0`

2. **Required Assets**:
   - App Icons (48dp to 192dp)
   - Feature Graphic (1024x500)
   - Screenshots (Phone, Tablet)

3. **Permissions**:
   - Internet access
   - Camera access
   - Storage access
   - Location access

## Testing Checklist

Before submitting to app stores, verify:

- [ ] App launches correctly on iOS and Android
- [ ] Login flow works (including OAuth redirects)
- [ ] Plan upgrade flows function properly
- [ ] Admin dashboard is accessible
- [ ] Node/wire system responds to user actions
- [ ] No UI clipping or layout issues
- [ ] Safe area handling works on all devices
- [ ] Back button works correctly on Android
- [ ] Deep links redirect properly
- [ ] All permissions are properly requested

## Deployment

### iOS Deployment

1. Open project in Xcode: `npm run open:ios`
2. Configure signing and provisioning profiles
3. Build for release: Product → Archive
4. Upload to App Store Connect
5. Submit for review

### Android Deployment

1. Open project in Android Studio: `npm run open:android`
2. Generate signed APK/AAB: Build → Generate Signed Bundle/APK
3. Upload to Google Play Console
4. Submit for review

## Troubleshooting

### Common Issues

**Build Fails**:
- Ensure web app builds successfully first
- Check that `out` directory exists with built files
- Verify Capacitor CLI is installed globally

**iOS Build Errors**:
- Update Xcode to latest version
- Clean build folder: Product → Clean Build Folder
- Check iOS deployment target (minimum iOS 13)

**Android Build Errors**:
- Update Android Studio and SDK
- Check Gradle version compatibility
- Verify Android API level (minimum API 24)

**Deep Links Not Working**:
- Verify URL schemes in configuration
- Check AndroidManifest.xml intent filters
- Test with physical devices (not simulators)

## Future Enhancements

Architecture is prepared for:
- Push Notifications
- Biometric Authentication  
- Camera File Uploads
- Offline Caching
- Background Sync

## Support

For mobile-specific issues, check:
1. Capacitor documentation: https://capacitorjs.com
2. iOS development guide: https://developer.apple.com
3. Android development guide: https://developer.android.com

## License

MIT License - see main project LICENSE file.