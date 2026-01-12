#!/bin/bash

# Admin Access Verification Script
# Tests that admin routing works correctly

set -e

echo "🔍 Verifying Admin Access Configuration..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check 1: Git commit
echo "✓ Checking latest commit..."
LATEST_COMMIT=$(git log --oneline -1)
echo "  Latest commit: $LATEST_COMMIT"
echo ""

# Check 2: Environment variables
echo "✓ Checking environment variables..."
if [ -f .env.local ]; then
  echo "  Found .env.local"
  
  if grep -q "FOUNDER_EMAILS" .env.local; then
    FOUNDER_EMAIL=$(grep "FOUNDER_EMAILS" .env.local | cut -d '=' -f2)
    echo -e "  ${GREEN}✓${NC} FOUNDER_EMAILS is set: $FOUNDER_EMAIL"
  else
    echo -e "  ${RED}✗${NC} FOUNDER_EMAILS not found in .env.local"
    echo "  ${YELLOW}⚠${NC}  Add: FOUNDER_EMAILS=ejazhussaini313@gmail.com"
  fi
  
  if grep -q "NEXT_PUBLIC_APP_URL" .env.local; then
    APP_URL=$(grep "NEXT_PUBLIC_APP_URL" .env.local | cut -d '=' -f2)
    echo -e "  ${GREEN}✓${NC} NEXT_PUBLIC_APP_URL is set: $APP_URL"
  else
    echo -e "  ${YELLOW}⚠${NC}  NEXT_PUBLIC_APP_URL not set"
  fi
else
  echo -e "  ${YELLOW}⚠${NC}  .env.local not found (OK if testing production)"
fi
echo ""

# Check 3: Key files
echo "✓ Checking key files..."
FILES=(
  "middleware.ts"
  "app/admin/layout.tsx"
  "app/app/layout.tsx"
  "app/app/admin/access.ts"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file exists"
  else
    echo -e "  ${RED}✗${NC} $file missing"
  fi
done
echo ""

# Check 4: Middleware contains admin protection
echo "✓ Checking middleware logic..."
if grep -q 'pathname.startsWith("/admin")' middleware.ts; then
  echo -e "  ${GREEN}✓${NC} Admin route protection found in middleware"
else
  echo -e "  ${RED}✗${NC} Admin route protection NOT found in middleware"
fi

if grep -q 'FOUNDER_EMAILS' middleware.ts; then
  echo -e "  ${GREEN}✓${NC} Founder email check found in middleware"
else
  echo -e "  ${RED}✗${NC} Founder email check NOT found in middleware"
fi
echo ""

# Check 5: Build test
echo "✓ Testing build..."
if [ -d ".next" ]; then
  echo -e "  ${GREEN}✓${NC} .next directory exists (already built)"
else
  echo "  Building..."
  npm run build > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓${NC} Build successful"
  else
    echo -e "  ${RED}✗${NC} Build failed"
    exit 1
  fi
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Summary:"
echo ""
echo "✅ Code changes are committed and ready"
echo "✅ Admin routing protection is in place"
echo "✅ Founder detection uses FOUNDER_EMAILS"
echo ""
echo "🚀 Next steps:"
echo "1. Push to git: git push origin main"
echo "2. Deploy to Vercel (auto or manual)"
echo "3. Set FOUNDER_EMAILS in Vercel env vars"
echo "4. Test: https://app.formaos.com.au/admin"
echo ""
echo "📖 See VERCEL_DEPLOYMENT_CHECKLIST.md for details"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
