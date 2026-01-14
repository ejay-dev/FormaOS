#!/bin/bash

# FormaOS Mobile - Asset Generation Script
echo "🎨 Generating FormaOS Mobile Assets..."

# Create assets directory
mkdir -p assets/icons
mkdir -p assets/splash

# Create a simple SVG icon for FormaOS
cat > assets/icons/icon.svg << 'EOF'
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
    <filter id="blur">
      <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
    </filter>
  </defs>
  
  <!-- Background with glassmorphism effect -->
  <rect width="1024" height="1024" fill="url(#grad)" rx="180"/>
  
  <!-- Central node representing the OS core -->
  <circle cx="512" cy="400" r="80" fill="rgba(255,255,255,0.9)" stroke="rgba(255,255,255,0.6)" stroke-width="4"/>
  
  <!-- Network nodes representing connected systems -->
  <circle cx="300" cy="300" r="40" fill="rgba(255,255,255,0.7)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
  <circle cx="724" cy="300" r="40" fill="rgba(255,255,255,0.7)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
  <circle cx="200" cy="600" r="40" fill="rgba(255,255,255,0.7)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
  <circle cx="824" cy="600" r="40" fill="rgba(255,255,255,0.7)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
  <circle cx="512" cy="700" r="40" fill="rgba(255,255,255,0.7)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
  
  <!-- Connection wires -->
  <line x1="512" y1="400" x2="300" y2="300" stroke="rgba(255,255,255,0.6)" stroke-width="3"/>
  <line x1="512" y1="400" x2="724" y2="300" stroke="rgba(255,255,255,0.6)" stroke-width="3"/>
  <line x1="512" y1="400" x2="200" y2="600" stroke="rgba(255,255,255,0.6)" stroke-width="3"/>
  <line x1="512" y1="400" x2="824" y2="600" stroke="rgba(255,255,255,0.6)" stroke-width="3"/>
  <line x1="512" y1="400" x2="512" y2="700" stroke="rgba(255,255,255,0.6)" stroke-width="3"/>
  
  <!-- FormaOS text -->
  <text x="512" y="850" font-family="Arial, sans-serif" font-size="64" font-weight="bold" text-anchor="middle" fill="white">FormaOS</text>
</svg>
EOF

# Create splash screen SVG
cat > assets/splash/splash.svg << 'EOF'
<svg width="1242" height="2688" viewBox="0 0 1242 2688" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0A0A0A;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#1A1A2E;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213E;stop-opacity:1" />
    </linearGradient>
    
    <!-- Animated particles -->
    <circle id="particle" r="2" fill="rgba(255,255,255,0.3)">
      <animateMotion dur="8s" repeatCount="indefinite" path="M0,0 Q100,50 200,0 T400,0"/>
      <animate attributeName="opacity" values="0;1;0" dur="4s" repeatCount="indefinite"/>
    </circle>
  </defs>
  
  <!-- Background -->
  <rect width="1242" height="2688" fill="url(#bgGrad)"/>
  
  <!-- Central logo area -->
  <g transform="translate(621, 1200)">
    <!-- Main node -->
    <circle cx="0" cy="0" r="60" fill="rgba(255,255,255,0.9)" stroke="rgba(255,255,255,0.6)" stroke-width="3"/>
    
    <!-- Satellite nodes -->
    <circle cx="-120" cy="-80" r="25" fill="rgba(255,255,255,0.7)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
    <circle cx="120" cy="-80" r="25" fill="rgba(255,255,255,0.7)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
    <circle cx="-120" cy="80" r="25" fill="rgba(255,255,255,0.7)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
    <circle cx="120" cy="80" r="25" fill="rgba(255,255,255,0.7)" stroke="rgba(255,255,255,0.4)" stroke-width="2"/>
    
    <!-- Connection lines -->
    <line x1="0" y1="0" x2="-120" y2="-80" stroke="rgba(255,255,255,0.6)" stroke-width="2"/>
    <line x1="0" y1="0" x2="120" y2="-80" stroke="rgba(255,255,255,0.6)" stroke-width="2"/>
    <line x1="0" y1="0" x2="-120" y2="80" stroke="rgba(255,255,255,0.6)" stroke-width="2"/>
    <line x1="0" y1="0" x2="120" y2="80" stroke="rgba(255,255,255,0.6)" stroke-width="2"/>
  </g>
  
  <!-- App title -->
  <text x="621" y="1400" font-family="Arial, sans-serif" font-size="48" font-weight="bold" text-anchor="middle" fill="white">FormaOS</text>
  <text x="621" y="1460" font-family="Arial, sans-serif" font-size="24" text-anchor="middle" fill="rgba(255,255,255,0.7)">Operational Compliance Operating System</text>
  
  <!-- Loading indicator -->
  <g transform="translate(621, 1600)">
    <circle cx="0" cy="0" r="20" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
    <circle cx="0" cy="0" r="20" fill="none" stroke="white" stroke-width="2" stroke-dasharray="31.4" stroke-dashoffset="31.4">
      <animate attributeName="stroke-dashoffset" dur="2s" values="31.4;0" repeatCount="indefinite"/>
    </circle>
  </g>
  
  <!-- Floating particles -->
  <use href="#particle" transform="translate(100, 400)"/>
  <use href="#particle" transform="translate(300, 800)" opacity="0.6"/>
  <use href="#particle" transform="translate(800, 600)" opacity="0.4"/>
  <use href="#particle" transform="translate(1000, 1000)" opacity="0.8"/>
</svg>
EOF

echo "✅ Assets generated successfully!"
echo "📱 Icon: assets/icons/icon.svg"
echo "🌟 Splash: assets/splash/splash.svg"
echo ""
echo "Next steps:"
echo "1. Convert SVGs to PNG using design tools or online converters"
echo "2. Generate all required icon sizes for iOS and Android"
echo "3. Replace placeholder assets in the mobile app"