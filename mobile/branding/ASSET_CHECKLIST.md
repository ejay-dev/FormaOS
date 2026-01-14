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
