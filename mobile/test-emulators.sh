#!/bin/bash

# FormaOS Mobile - Emulator Test Script
echo "📱 FormaOS Mobile - Emulator Launch Guide"
echo "=========================================="
echo ""

# Check if on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "This script is for macOS. On Linux/Windows, use Android Studio or Xcode directly."
    exit 1
fi

echo "🚀 To test the mobile app on emulators:"
echo ""

# iOS Testing
echo "📱 iOS Simulator Testing"
echo "----------------------"
echo "1. Install Xcode from App Store (if not already installed)"
echo "2. Accept Xcode license:"
echo "   sudo xcode-select --reset"
echo "   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer"
echo "3. Open iOS project:"
echo "   cd mobile && npm run open:ios"
echo "4. In Xcode:"
echo "   • Select 'App' scheme (top left)"
echo "   • Select any iPhone simulator"
echo "   • Press ▶ (Run button)"
echo ""

# Android Testing
echo "🤖 Android Emulator Testing"
echo "-------------------------"
echo "1. Install Android Studio from https://developer.android.com/studio"
echo "2. Create a virtual device:"
echo "   • Open Android Studio → Device Manager"
echo "   • Click 'Create Device'"
echo "   • Select Phone: Pixel 6/7"
echo "   • Select API 28 or higher (recommended: API 33+)"
echo "   • Complete creation"
echo "3. Open Android project:"
echo "   cd mobile && npm run open:android"
echo "4. In Android Studio:"
echo "   • Select your virtual device (Device Manager)"
echo "   • Press ▶ (Run button) or run from terminal:"
echo "   ./gradlew runDebug"
echo ""

echo "🧪 Testing Checklist"
echo "-------------------"
echo "✓ App launches without crashes"
echo "✓ FormaOS login page loads"
echo "✓ Can enter credentials"
echo "✓ Authentication works (OAuth redirect)"
echo "✓ Dashboard renders correctly"
echo "✓ Navigation menu works"
echo "✓ Node/wire system displays"
echo "✓ No layout clipping or issues"
echo "✓ Text is readable"
echo "✓ Buttons are responsive"
echo ""

echo "💡 Tips"
echo "------"
echo "• Use Safari dev tools to debug iOS: Develop → iOS device/simulator"
echo "• Use Chrome dev tools for Android: chrome://inspect"
echo "• Check console logs for errors"
echo "• Test both portrait and landscape orientations"
echo "• Try on different screen sizes"
echo ""

echo "📊 Network Testing"
echo "------------------"
echo "The app loads the production URL: https://app.formaos.com.au"
echo "Ensure your device/emulator has:"
echo "• Internet connectivity"
echo "• Access to app.formaos.com.au"
echo "• Valid SSL certificates (should be automatic)"
echo ""

# Check if Android Studio or Xcode is installed
if command -v xcodebuild &> /dev/null; then
    echo "✅ Xcode is installed and available"
else
    echo "⚠️  Xcode not found - install from App Store for iOS testing"
fi

if [ -d "$HOME/Library/Android/sdk" ]; then
    echo "✅ Android SDK is installed"
else
    echo "⚠️  Android SDK not found - install Android Studio for Android testing"
fi

echo ""
echo "Ready to test? Follow the steps above!"