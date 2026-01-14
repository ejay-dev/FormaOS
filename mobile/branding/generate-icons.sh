#!/bin/bash

# Generate FormaOS Mobile Icons and Splash Screens
echo "🎨 Generating FormaOS Mobile Branding Assets"
echo "==========================================="

# Colors
PURPLE="#667eea"
DARK_PURPLE="#764ba2"
DARK_BG="#0A0A0A"

# Create icon SVG with better quality
cat > icon.svg << 'ICONEOF'
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="1024" height="1024" fill="url(#grad)" rx="200"/>
  
  <circle cx="512" cy="400" r="100" fill="white" opacity="0.95"/>
  
  <circle cx="280" cy="280" r="50" fill="white" opacity="0.8"/>
  <circle cx="744" cy="280" r="50" fill="white" opacity="0.8"/>
  <circle cx="180" cy="640" r="50" fill="white" opacity="0.8"/>
  <circle cx="844" cy="640" r="50" fill="white" opacity="0.8"/>
  <circle cx="512" cy="800" r="50" fill="white" opacity="0.8"/>
  
  <line x1="512" y1="400" x2="280" y2="280" stroke="white" stroke-width="4" opacity="0.7"/>
  <line x1="512" y1="400" x2="744" y2="280" stroke="white" stroke-width="4" opacity="0.7"/>
  <line x1="512" y1="400" x2="180" y2="640" stroke="white" stroke-width="4" opacity="0.7"/>
  <line x1="512" y1="400" x2="844" y2="640" stroke="white" stroke-width="4" opacity="0.7"/>
  <line x1="512" y1="400" x2="512" y2="800" stroke="white" stroke-width="4" opacity="0.7"/>
</svg>
ICONEOF

# Create splash screen SVG
cat > splash.svg << 'SPLASHEOF'
<svg width="1242" height="2688" viewBox="0 0 1242 2688" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0A0A0A;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#1A1A2E;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#16213E;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="1242" height="2688" fill="url(#bgGrad)"/>
  
  <g transform="translate(621, 1200)">
    <circle cx="0" cy="0" r="80" fill="white" opacity="0.95"/>
    
    <circle cx="-150" cy="-100" r="35" fill="white" opacity="0.8"/>
    <circle cx="150" cy="-100" r="35" fill="white" opacity="0.8"/>
    <circle cx="-150" cy="100" r="35" fill="white" opacity="0.8"/>
    <circle cx="150" cy="100" r="35" fill="white" opacity="0.8"/>
    
    <line x1="0" y1="0" x2="-150" y2="-100" stroke="white" stroke-width="3" opacity="0.7"/>
    <line x1="0" y1="0" x2="150" y2="-100" stroke="white" stroke-width="3" opacity="0.7"/>
    <line x1="0" y1="0" x2="-150" y2="100" stroke="white" stroke-width="3" opacity="0.7"/>
    <line x1="0" y1="0" x2="150" y2="100" stroke="white" stroke-width="3" opacity="0.7"/>
  </g>
  
  <text x="621" y="1450" font-family="Arial, sans-serif" font-size="56" font-weight="bold" text-anchor="middle" fill="white">FormaOS</text>
  <text x="621" y="1520" font-family="Arial, sans-serif" font-size="28" text-anchor="middle" fill="rgba(255,255,255,0.8)">Operational Compliance</text>
  <text x="621" y="1560" font-family="Arial, sans-serif" font-size="28" text-anchor="middle" fill="rgba(255,255,255,0.8)">Operating System</text>
</svg>
SPLASHEOF

echo "✅ SVG templates created:"
echo "  ✓ icon.svg (1024x1024)"
echo "  ✓ splash.svg (1242x2688)"
echo ""
echo "📝 To generate PNG files, use an online SVG converter or:"
echo "  • Figma (recommended): export as PNG"
echo "  • Inkscape: File → Export As"
echo "  • ImageMagick: convert icon.svg icon.png"
echo ""
echo "iOS Icon Sizes Required:"
echo "  □ 1024x1024 (App Store)"
echo "  □ 180x180 (@3x iPhone)"
echo "  □ 120x120 (@2x iPhone)"
echo "  □ 87x87 (@3x Settings)"
echo "  □ 58x58 (@2x Settings)"
echo "  □ 40x40 (@2x Notification)"
echo "  □ 60x60 (@2x Spotlight)"
echo ""
echo "Android Icon Sizes Required:"
echo "  □ 512x512 (Google Play)"
echo "  □ 192x192 (XXXHDPI)"
echo "  □ 108x108 Adaptive Icon foreground"
echo ""
echo "These SVGs serve as templates for all required sizes."
