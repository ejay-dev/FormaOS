#!/bin/bash

# FormaOS Mobile Build Script
echo "🚀 Building FormaOS Mobile..."

# Ensure we're in the mobile directory
cd "$(dirname "$0")"

# Build the web app with mobile configuration
echo "📱 Building web app for mobile..."
cd ..
cp mobile/next.config.mobile.ts next.config.mobile.ts
npm run build -- --config next.config.mobile.ts
rm next.config.mobile.ts

# Return to mobile directory and sync with Capacitor
echo "🔄 Syncing with Capacitor..."
cd mobile
npm install
npx cap sync

echo "✅ Mobile build complete!"
echo "📱 iOS: npm run open:ios"
echo "🤖 Android: npm run open:android"