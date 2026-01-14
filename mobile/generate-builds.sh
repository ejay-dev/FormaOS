#!/bin/bash

# FormaOS Mobile - Store-Ready Build Generation
echo "📦 FormaOS Mobile - Build Generation for App Store & Play Store"
echo "=============================================================="
echo ""

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BUILD_DATE=$(date +%Y%m%d_%H%M%S)
BUILD_DIR="builds/$BUILD_DATE"
APP_VERSION="1.0.0"
APP_BUILD_NUMBER="1"

# Helper functions
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Create build directory
print_step "Creating build directory..."
mkdir -p "$BUILD_DIR/ios"
mkdir -p "$BUILD_DIR/android"
mkdir -p "$BUILD_DIR/metadata"
print_success "Build directory created: $BUILD_DIR"

# ============================================================================
# ANDROID BUILD
# ============================================================================

print_step "Building Android Release..."
echo ""

cd android

# Build the AAB (Android App Bundle) for Google Play
print_step "Generating Android App Bundle (.aab) for Google Play..."
if command -v gradle &> /dev/null; then
    ./gradlew bundleRelease \
        -DAPK_OUTPUT_PATH="../$BUILD_DIR/android" \
        -DBUILD_NUMBER=$APP_BUILD_NUMBER \
        || print_warning "Gradle build requires keystore configuration"
    
    # Check if build was successful
    if [ -f "app/build/outputs/bundle/release/app-release.aab" ]; then
        cp app/build/outputs/bundle/release/app-release.aab "../$BUILD_DIR/android/formaos-$APP_VERSION-play.aab"
        print_success "Android App Bundle created: $BUILD_DIR/android/formaos-$APP_VERSION-play.aab"
    else
        print_warning "AAB build requires keystore - configure signing in build.gradle"
    fi
else
    print_warning "Gradle wrapper not found - requires Android build tools"
fi

# Build APK for manual testing
print_step "Generating Debug APK for testing..."
if [ -f "gradlew" ]; then
    ./gradlew assembleDebug 2>/dev/null || true
    if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
        cp app/build/outputs/apk/debug/app-debug.apk "../$BUILD_DIR/android/formaos-$APP_VERSION-debug.apk"
        print_success "Debug APK created for testing"
    fi
else
    print_warning "Android build requires gradlew - not available in environment"
fi

cd ..

# ============================================================================
# iOS BUILD
# ============================================================================

print_step "Building iOS Release..."
echo ""

cd ios/App

# Build scheme
SCHEME="App"
CONFIGURATION="Release"

print_step "Generating iOS App Archive (.xcarchive)..."
if command -v xcodebuild &> /dev/null; then
    # Clean build folder
    xcodebuild clean -scheme "$SCHEME" -configuration "$CONFIGURATION" 2>/dev/null || true
    
    # Build archive
    xcodebuild archive \
        -scheme "$SCHEME" \
        -configuration "$CONFIGURATION" \
        -archivePath "../../$BUILD_DIR/ios/formaos-$APP_VERSION.xcarchive" \
        -destination "generic/platform=iOS" \
        CODE_SIGN_IDENTITY="" \
        CODE_SIGNING_REQUIRED=NO \
        2>/dev/null || print_warning "iOS build requires Xcode configuration"
    
    # Check if archive was successful
    if [ -d "../../$BUILD_DIR/ios/formaos-$APP_VERSION.xcarchive" ]; then
        print_success "iOS Archive created: ../../$BUILD_DIR/ios/formaos-$APP_VERSION.xcarchive"
        
        # Generate IPA (can be exported from Xcode GUI)
        print_step "To generate IPA for App Store:"
        echo "  1. Open Xcode"
        echo "  2. Window → Organizer"
        echo "  3. Select archive: formaos-$APP_VERSION"
        echo "  4. Click 'Distribute App'"
        echo "  5. Select 'App Store Connect' as destination"
        echo "  6. Follow the export wizard"
    else
        print_warning "iOS build skipped - requires Xcode environment"
    fi
else
    print_warning "Xcode not found - iOS builds require macOS with Xcode installed"
fi

cd ../..

# ============================================================================
# GENERATE STORE METADATA
# ============================================================================

print_step "Generating Store Metadata..."

# App Store Connect metadata
cat > "$BUILD_DIR/metadata/appstore-metadata.json" << 'EOF'
{
  "app_name": "FormaOS",
  "subtitle": "Operational Compliance Operating System",
  "description": "FormaOS is a comprehensive operational compliance operating system designed for modern businesses to streamline their compliance workflows, risk management, and audit processes.",
  "keywords": ["compliance", "risk", "audit", "business", "productivity"],
  "category": "Business",
  "support_url": "https://formaos.com.au/support",
  "privacy_url": "https://formaos.com.au/privacy",
  "version": "1.0.0",
  "release_notes": "Initial release of FormaOS Mobile - Full compliance management on the go."
}
EOF

# Google Play metadata
cat > "$BUILD_DIR/metadata/playstore-metadata.json" << 'EOF'
{
  "app_name": "FormaOS",
  "short_description": "Operational Compliance Operating System - Streamline your compliance workflows",
  "full_description": "FormaOS is a comprehensive operational compliance operating system designed for modern businesses to streamline their compliance workflows, risk management, and audit processes.\n\nKey Features:\n• Visual Node System: Intuitive node and wire interface for managing compliance workflows\n• Plan-Based Access: Flexible subscription plans with feature activation\n• Admin Dashboard: Comprehensive administrative controls and oversight\n• Risk Management: Advanced risk assessment and heatmap visualization\n• Audit Trail: Complete audit logging and compliance tracking\n• Team Collaboration: Role-based permissions and team management\n• Evidence Management: Secure document and evidence storage\n• Mobile Optimized: Full-featured mobile experience with native gestures",
  "keywords": ["compliance management", "risk assessment", "audit software", "business productivity", "workflow automation"],
  "category": "Business",
  "content_rating": "Everyone",
  "privacy_policy": "https://formaos.com.au/privacy",
  "version": "1.0.0",
  "release_notes": "Initial release of FormaOS Mobile - Full compliance management on the go."
}
EOF

print_success "Metadata files generated"

# ============================================================================
# BUILD DOCUMENTATION
# ============================================================================

cat > "$BUILD_DIR/BUILD_INFO.md" << 'EOF'
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
EOF

print_success "Build documentation created"

# ============================================================================
# SUMMARY
# ============================================================================

echo ""
echo "📦 Build Generation Complete"
echo "============================="
echo ""
echo "Build artifacts location: $BUILD_DIR"
echo ""

if [ -d "$BUILD_DIR/ios" ] && [ "$(ls -A $BUILD_DIR/ios)" ]; then
    echo "📱 iOS Artifacts:"
    ls -lh "$BUILD_DIR/ios"
    echo ""
fi

if [ -d "$BUILD_DIR/android" ] && [ "$(ls -A $BUILD_DIR/android)" ]; then
    echo "🤖 Android Artifacts:"
    ls -lh "$BUILD_DIR/android"
    echo ""
fi

if [ -f "$BUILD_DIR/metadata/appstore-metadata.json" ]; then
    echo "📋 Metadata:"
    echo "  ✓ appstore-metadata.json"
    echo "  ✓ playstore-metadata.json"
    echo ""
fi

echo "📄 Build Information: $BUILD_DIR/BUILD_INFO.md"
echo ""
echo "Next steps:"
echo "1. Review build artifacts"
echo "2. Test APK/archive on devices"
echo "3. Configure signing (if not already done)"
echo "4. Submit to app stores"
echo ""
print_success "Build generation complete!"