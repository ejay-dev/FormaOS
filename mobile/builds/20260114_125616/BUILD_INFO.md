# FormaOS Mobile Build Artifacts

**Build Date**: $(date)
**App Version**: 1.0.0
**Build Number**: 1

## Android Artifacts

### formaos-1.0.0-play.aab
- **Type**: Android App Bundle
- **Use**: Submit directly to Google Play Console
- **Signing**: Requires release keystore (production signing)
- **Size**: Varies (~30-50 MB)
- **Format**: Binary file ready for Play Store distribution

### formaos-1.0.0-debug.apk
- **Type**: Debug APK
- **Use**: Testing on physical devices and emulators
- **Installation**: `adb install formaos-1.0.0-debug.apk`
- **Note**: Not suitable for production

## iOS Artifacts

### formaos-1.0.0.xcarchive
- **Type**: Xcode Archive
- **Use**: Export to .ipa for App Store submission
- **Process**: 
  1. Open Xcode Organizer
  2. Select archive
  3. Click "Distribute App"
  4. Follow export wizard
- **Output**: Generates .ipa ready for App Store Connect

## Signing Requirements

### Android
```bash
# Generate keystore (if not existing)
keytool -genkey -v -keystore formaos.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias formaos-key

# Configure in build.gradle:
signingConfigs {
  release {
    storeFile file("../formaos.keystore")
    storePassword "YOUR_PASSWORD"
    keyAlias "formaos-key"
    keyPassword "YOUR_PASSWORD"
  }
}

# Build signed APK/AAB
./gradlew bundleRelease
```

### iOS
1. Register Bundle ID in Apple Developer
2. Create provisioning profiles
3. Configure signing in Xcode
4. Build and archive
5. Export and upload to App Store Connect

## Deployment Checklist

- [ ] Test all features on physical devices
- [ ] Verify authentication flows
- [ ] Test plan upgrade functionality
- [ ] Check admin dashboard access
- [ ] Validate app icons and splash screens
- [ ] Review app store listings
- [ ] Configure signing certificates
- [ ] Generate signed app bundles
- [ ] Submit to stores

## Next Steps

1. **For Google Play**:
   - Upload formaos-1.0.0-play.aab to Play Console
   - Add screenshots and metadata
   - Complete content rating questionnaire
   - Submit for review

2. **For App Store**:
   - Generate .ipa from xcarchive
   - Upload to App Store Connect
   - Add screenshots and metadata
   - Complete app review information
   - Submit for review

## Support

For issues with builds:
1. Check build logs in `build/outputs/`
2. Verify all dependencies are installed
3. Ensure signing certificates are configured
4. Review platform-specific requirements
