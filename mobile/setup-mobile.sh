#!/bin/bash

# FormaOS Mobile - Complete Setup and Validation Script
set -e

echo "🚀 FormaOS Mobile - Complete Setup"
echo "=================================="

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check prerequisites
print_step "Checking Prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version is $NODE_VERSION. Please upgrade to Node.js 18+ and try again."
    exit 1
fi
print_success "Node.js $(node -v) installed"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm and try again."
    exit 1
fi
print_success "npm $(npm -v) installed"

# Check for Capacitor CLI
if ! command -v cap &> /dev/null; then
    print_warning "Capacitor CLI not found. Installing globally..."
    npm install -g @capacitor/cli
    print_success "Capacitor CLI installed"
else
    print_success "Capacitor CLI $(cap --version) installed"
fi

# Check development tools
if [[ "$OSTYPE" == "darwin"* ]]; then
    if ! command -v xcodebuild &> /dev/null; then
        print_warning "Xcode not found. Install Xcode for iOS development."
    else
        print_success "Xcode available for iOS development"
    fi
fi

# Step 1: Install mobile dependencies
print_step "Installing Mobile Dependencies..."
cd "$(dirname "$0")"
npm install
print_success "Mobile dependencies installed"

# Step 2: Build web app for mobile
print_step "Building Web App for Mobile..."
cd ..

# Backup original next.config.ts
if [ -f "next.config.ts" ]; then
    cp next.config.ts next.config.ts.backup
fi

# Use mobile configuration
cp mobile/next.config.mobile.ts next.config.ts

# Build the web app
print_step "Building Next.js app with static export..."
npm run build

# Restore original config
if [ -f "next.config.ts.backup" ]; then
    mv next.config.ts.backup next.config.ts
else
    rm next.config.ts
fi

print_success "Web app built for mobile"

# Step 3: Initialize Capacitor
cd mobile
print_step "Initializing Capacitor..."

# Check if Capacitor is already initialized
if [ ! -f "capacitor.config.json" ] && [ ! -f "capacitor.config.ts" ]; then
    npx cap init "FormaOS" "com.formaos.mobile"
else
    print_success "Capacitor already initialized"
fi

# Step 4: Add platforms
print_step "Adding Mobile Platforms..."

# Add iOS platform if not exists
if [ ! -d "ios" ]; then
    npx cap add ios
    print_success "iOS platform added"
else
    print_success "iOS platform already exists"
fi

# Add Android platform if not exists  
if [ ! -d "android" ]; then
    npx cap add android
    print_success "Android platform added"
else
    print_success "Android platform already exists"
fi

# Step 5: Copy web assets and sync
print_step "Syncing Web Assets..."
npx cap copy
npx cap sync
print_success "Assets synced with native platforms"

# Step 6: Generate placeholder assets
print_step "Generating App Assets..."
./generate-assets.sh
print_success "App assets generated"

# Step 7: Validation
print_step "Running Validation Checks..."

# Check web build output
if [ ! -d "../out" ]; then
    print_error "Web build output directory '../out' not found"
    exit 1
fi
print_success "Web build output found"

# Check web build has index.html
if [ ! -f "../out/index.html" ]; then
    print_error "index.html not found in build output"
    exit 1
fi
print_success "Main index.html found"

# Check iOS project
if [ -d "ios" ] && [ -f "ios/App/App.xcodeproj/project.pbxproj" ]; then
    print_success "iOS project structure valid"
else
    print_warning "iOS project structure needs verification"
fi

# Check Android project
if [ -d "android" ] && [ -f "android/build.gradle" ]; then
    print_success "Android project structure valid"
else
    print_warning "Android project structure needs verification"
fi

# Final summary
echo ""
echo "🎉 FormaOS Mobile Setup Complete!"
echo "================================"
echo ""
echo "📱 Next Steps:"
echo ""
echo "iOS Development:"
echo "  npm run open:ios    # Open in Xcode"
echo "  npm run dev        # Live reload development"
echo ""
echo "Android Development:"  
echo "  npm run open:android    # Open in Android Studio"
echo "  npm run dev:android    # Live reload development"
echo ""
echo "Production Build:"
echo "  npm run build      # Build for production"
echo ""
echo "📋 Pre-Store Submission Checklist:"
echo "  □ Replace placeholder app icons with final designs"
echo "  □ Create splash screen assets"
echo "  □ Test on physical devices"
echo "  □ Verify all authentication flows"
echo "  □ Test plan upgrade functionality"
echo "  □ Validate admin dashboard access"
echo "  □ Configure app signing (iOS)"
echo "  □ Generate keystore (Android)"
echo "  □ Create store listings and metadata"
echo ""
echo "🔗 Useful Commands:"
echo "  npm run sync        # Sync web changes to mobile"
echo "  npm run copy        # Copy web assets only"
echo ""
print_success "Setup completed successfully! 🚀"