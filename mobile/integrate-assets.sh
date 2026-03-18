#!/bin/bash

# FormaOS Mobile - Branding Asset Integration Script
echo "🎨 FormaOS Mobile - Branding Asset Integration"
echo "=============================================="
echo ""

set -e

# Directories
ICON_SVG="/Users/ejay/formaos/mobile/icon.svg"
SPLASH_SVG="/Users/ejay/formaos/mobile/splash.svg"

# iOS Paths
IOS_ASSETS="ios/App/App/Assets.xcassets"
IOS_ICON_SET="$IOS_ASSETS/AppIcon.appiconset"
IOS_SPLASH_SET="$IOS_ASSETS/SplashScreenAsset.imageset"

# Android Paths
ANDROID_RES="android/app/src/main/res"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Step 1: Document iOS integration
print_step "iOS Icon Integration Instructions"
echo "Since we don't have ImageMagick in this environment, follow these steps:"
echo ""
echo "1. Open icon.svg in a design tool (Figma, Sketch, Adobe XD)"
echo "2. Export the following sizes:"
echo "   • 1024x1024 → AppIcon-1024@1x"
echo "   • 180x180  → AppIcon-60@3x"
echo "   • 120x120  → AppIcon-60@2x"
echo "   • 87x87    → AppIcon-29@3x"
echo "   • 58x58    → AppIcon-29@2x"
echo "   • 80x80    → AppIcon-40@2x"
echo "   • 120x120  → AppIcon-40@3x"
echo ""
echo "3. Place in: $IOS_ICON_SET/"
echo "4. Or use online converter: CloudConvert, convertio.co"
echo ""

# Step 2: Document Android integration
print_step "Android Icon Integration Instructions"
echo "Export icon.svg to PNG sizes:"
echo ""
echo "  Drawable folders needed:"
echo "  • drawable/          (generic, 160dpi, 48x48)"
echo "  • drawable-mdpi/     (160dpi, 48x48)"
echo "  • drawable-hdpi/     (240dpi, 72x72)"
echo "  • drawable-xhdpi/    (320dpi, 96x96)"
echo "  • drawable-xxhdpi/   (480dpi, 144x144)"
echo "  • drawable-xxxhdpi/  (640dpi, 192x192)"
echo ""
echo "Create directories and place icons:"
mkdir -p "$ANDROID_RES"/{drawable,drawable-mdpi,drawable-hdpi,drawable-xhdpi,drawable-xxhdpi,drawable-xxxhdpi}
print_success "Android resource directories created"

# Step 3: Create splash screen directories
print_step "Creating Splash Screen Directories"
mkdir -p "$IOS_ASSETS"
mkdir -p "$IOS_SPLASH_SET"
mkdir -p "$ANDROID_RES"/{drawable,drawable-mdpi,drawable-hdpi,drawable-xhdpi,drawable-xxhdpi,drawable-xxxhdpi}
print_success "Splash screen directories created"

# Step 4: Create configuration files for iOS
print_step "Creating iOS Configuration"
cat > "$IOS_ICON_SET/Contents.json" << 'EOF'
{
  "images" : [
    {
      "idiom" : "iphone",
      "size" : "20x20",
      "scale" : "2x",
      "filename" : "AppIcon-20x20@2x.png"
    },
    {
      "idiom" : "iphone",
      "size" : "20x20",
      "scale" : "3x",
      "filename" : "AppIcon-20x20@3x.png"
    },
    {
      "idiom" : "iphone",
      "size" : "29x29",
      "scale" : "2x",
      "filename" : "AppIcon-29x29@2x.png"
    },
    {
      "idiom" : "iphone",
      "size" : "29x29",
      "scale" : "3x",
      "filename" : "AppIcon-29x29@3x.png"
    },
    {
      "idiom" : "iphone",
      "size" : "40x40",
      "scale" : "2x",
      "filename" : "AppIcon-40x40@2x.png"
    },
    {
      "idiom" : "iphone",
      "size" : "40x40",
      "scale" : "3x",
      "filename" : "AppIcon-40x40@3x.png"
    },
    {
      "idiom" : "iphone",
      "size" : "60x60",
      "scale" : "2x",
      "filename" : "AppIcon-60x60@2x.png"
    },
    {
      "idiom" : "iphone",
      "size" : "60x60",
      "scale" : "3x",
      "filename" : "AppIcon-60x60@3x.png"
    },
    {
      "idiom" : "ios-marketing",
      "size" : "1024x1024",
      "scale" : "1x",
      "filename" : "AppIcon-1024x1024@1x.png"
    }
  ],
  "info" : {
    "version" : 1,
    "author" : "xcode"
  }
}
EOF
print_success "iOS icon configuration created"

# Step 5: Document file placement
print_step "Asset Placement Guide"
echo ""
echo "iOS Icons:"
echo "  Paste PNG files into:"
echo "  → ios/App/App/Assets.xcassets/AppIcon.appiconset/"
echo ""
echo "Android Icons:"
echo "  Paste PNG files into:"
echo "  → android/app/src/main/res/drawable-xxxhdpi/ (192x192)"
echo "  → android/app/src/main/res/drawable-xxhdpi/  (144x144)"
echo "  → android/app/src/main/res/drawable-xhdpi/   (96x96)"
echo "  → android/app/src/main/res/drawable-hdpi/    (72x72)"
echo "  → android/app/src/main/res/drawable-mdpi/    (48x48)"
echo ""

# Step 6: Copy SVG templates to branding folder
print_step "Storing SVG Templates"
cp "$ICON_SVG" branding/icons/icon.svg 2>/dev/null && print_success "Icon template stored" || true
cp "$SPLASH_SVG" branding/splash/splash.svg 2>/dev/null && print_success "Splash template stored" || true

# Step 7: Create asset checklist
cat > branding/ASSET_CHECKLIST.md << 'EOF'
# FormaOS Mobile - Asset Integration Checklist

## SVG Templates Created
- ✅ icon.svg (1024x1024) - Primary app icon
- ✅ splash.svg (1242x2688) - Launch splash screen

## iOS Assets Required

### App Icons
- [ ] AppIcon-20x20@2x.png (40x40)
- [ ] AppIcon-20x20@3x.png (60x60)
- [ ] AppIcon-29x29@2x.png (58x58)
- [ ] AppIcon-29x29@3x.png (87x87)
- [ ] AppIcon-40x40@2x.png (80x80)
- [ ] AppIcon-40x40@3x.png (120x120)
- [ ] AppIcon-60x60@2x.png (120x120)
- [ ] AppIcon-60x60@3x.png (180x180)
- [ ] AppIcon-1024x1024@1x.png (1024x1024)

### Splash Screen
- [ ] LaunchScreen.storyboard (built-in, customize in Xcode)

**Location**: `ios/App/App/Assets.xcassets/AppIcon.appiconset/`

## Android Assets Required

### App Icons
Folder Structure:
```
android/app/src/main/res/
├── drawable/            (ic_launcher.png)
├── drawable-mdpi/       (ic_launcher.png - 48x48)
├── drawable-hdpi/       (ic_launcher.png - 72x72)
├── drawable-xhdpi/      (ic_launcher.png - 96x96)
├── drawable-xxhdpi/     (ic_launcher.png - 144x144)
└── drawable-xxxhdpi/    (ic_launcher.png - 192x192)
```

### Adaptive Icon (Android 8.0+)
```
android/app/src/main/res/
├── drawable/ic_launcher_foreground.xml
├── drawable/ic_launcher_background.xml
└── mipmap-anydpi-v33/ic_launcher.xml
```

### Splash Screen
- [ ] splash_screen_background.xml (drawable)
- [ ] splash_icon.png (drawable-xxxhdpi)

## Conversion Tools

### Online Converters
- **CloudConvert**: https://cloudconvert.com/svg-to-png
- **Convertio**: https://convertio.co/svg-png/
- **zamzar**: https://www.zamzar.com/convert/svg-to-png/

### Desktop Tools
- **Figma**: Free, export PNG in any size
- **Inkscape**: Free, open-source (File → Export)
- **Adobe XD**: Professional, full feature support
- **Sketch**: Mac-only, professional tool

### Command Line (macOS)
```bash
# Using ImageMagick
brew install imagemagick
convert -density 300 icon.svg -resize 1024x1024 icon-1024.png

# Using Inkscape
brew install inkscape
inkscape icon.svg -w 1024 -h 1024 -o icon-1024.png
```

## Step-by-Step Integration

### 1. Generate PNG Files from SVG
1. Open icon.svg in design tool or converter
2. Export each required size
3. Name files as specified above

### 2. iOS Integration
1. Navigate to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
2. Delete existing placeholder images
3. Place all PNG files in this folder
4. Verify Contents.json has correct filenames

### 3. Android Integration
1. Create drawable folders in `android/app/src/main/res/`
2. Place PNG files in appropriate density folders
3. Update AndroidManifest.xml if needed

### 4. Build and Test
```bash
# iOS
npm run open:ios
# In Xcode: Product → Build

# Android
npm run open:android
# In Android Studio: Build → Make Project
```

### 5. Verify
- [ ] App icon displays correctly on home screen
- [ ] Splash screen appears on launch
- [ ] Icons are not pixelated or blurry
- [ ] Safe area respected on notched devices
- [ ] All sizes work on both phones and tablets

## Timeline
- **Design**: Complete ✅
- **SVG Templates**: Complete ✅
- **PNG Export**: [User to complete using converter tool]
- **iOS Integration**: [After PNG export]
- **Android Integration**: [After PNG export]
- **Testing**: [After integration]
- **Ready for Store**: [After testing]

## Support

For icon sizing questions, refer to:
- **iOS**: https://developer.apple.com/design/human-interface-guidelines/app-icons
- **Android**: https://developer.android.com/guide/practices/ui_guidelines/icon_design

For splash screen design:
- **iOS**: https://developer.apple.com/design/human-interface-guidelines/launch-screens
- **Android**: https://developer.android.com/guide/topics/ui/splash-screen
EOF

print_success "Asset checklist created"

echo ""
echo "📦 Branding Asset Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Convert SVG files to PNG using a design tool"
echo "2. Follow the checklist in: branding/ASSET_CHECKLIST.md"
echo "3. Place PNG files in the correct directories"
echo "4. Build and test in Xcode/Android Studio"
echo ""
