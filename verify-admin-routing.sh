#!/bin/bash

# ============================================================
# ADMIN ROUTING PRODUCTION VERIFICATION SCRIPT
# ============================================================
# This script tests the admin routing fix in production
# Run after deployment is complete

set -e

APP_URL="https://app.formaos.com.au"
SITE_URL="https://formaos.com.au"

echo "🚀 Admin Routing Production Verification"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Domain routing
echo "📋 Test 1: Domain Routing"
echo "-----------------------"
echo "Testing that /admin routes to app domain..."

REDIRECT=$(curl -s -o /dev/null -w "%{redirect_url}" "$SITE_URL/admin")
if [[ "$REDIRECT" == *"app.formaos.com.au"* ]]; then
  echo -e "${GREEN}✅ PASS${NC}: Marketing domain redirects to app domain"
  echo "  Redirect: $REDIRECT"
else
  echo -e "${RED}❌ FAIL${NC}: Marketing domain does not redirect correctly"
  echo "  Got: $REDIRECT"
fi
echo ""

# Test 2: Admin page exists
echo "📋 Test 2: Admin Page Accessibility"
echo "-----------------------------------"
echo "Testing that admin routes exist..."

# This will return 307 or similar for unauthenticated users
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL/admin")
if [[ "$STATUS" == "307" || "$STATUS" == "308" ]]; then
  echo -e "${GREEN}✅ PASS${NC}: Admin route accessible (redirect to auth expected)"
  echo "  Status: $STATUS"
elif [[ "$STATUS" == "200" ]]; then
  echo -e "${GREEN}✅ PASS${NC}: Admin page loaded successfully"
  echo "  Status: $STATUS"
elif [[ "$STATUS" == "404" ]]; then
  echo -e "${RED}❌ FAIL${NC}: Admin route not found (404)"
  echo "  Status: $STATUS"
else
  echo -e "${YELLOW}⚠️  WARNING${NC}: Unexpected status code"
  echo "  Status: $STATUS"
fi
echo ""

# Test 3: Production environment check
echo "📋 Test 3: Production Deployment"
echo "-------------------------------"
echo "Testing production deployment status..."

RESPONSE=$(curl -s "$APP_URL/api/health" 2>/dev/null || echo "")
if [[ -n "$RESPONSE" ]]; then
  echo -e "${GREEN}✅ PASS${NC}: Production server is responding"
else
  echo -e "${YELLOW}⚠️  WARNING${NC}: Could not reach health endpoint"
fi
echo ""

# Test 4: Check if latest commit is deployed
echo "📋 Test 4: Latest Deployment"
echo "---------------------------"
echo "Checking if latest fixes are deployed..."

LATEST_COMMIT="6c213ca"
echo "Expected latest commit: $LATEST_COMMIT"
echo "Check Vercel Dashboard: https://vercel.com/ejay-dev/FormaOS/deployments"
echo ""

# Manual testing instructions
echo "📋 Manual Testing Required"
echo "-------------------------"
echo "To fully test the admin routing:"
echo ""
echo "1️⃣  Incognito Browser Test:"
echo "   - Open incognito window"
echo "   - Visit: $APP_URL/admin"
echo "   - Expected: Redirects to Google Auth"
echo "   - After login: Admin Dashboard should load"
echo "   - NOT: User dashboard or pricing page"
echo ""
echo "2️⃣  Check Console Logs:"
echo "   - Open DevTools → Console"
echo "   - Look for founder check logs"
echo "   - Search for: '[Middleware]', '[admin/layout]'"
echo ""
echo "3️⃣  Verify Admin Pages:"
echo "   - Click through all 9 admin pages"
echo "   - Dashboard, Users, Orgs, Billing, Trials, Features, Security, System, Audit"
echo "   - Each should load without errors"
echo ""
echo "4️⃣  Test Non-Founder Access:"
echo "   - Create/login with non-founder account"
echo "   - Visit: $APP_URL/admin"
echo "   - Expected: Redirect to /pricing"
echo "   - NOT: Error page or admin dashboard"
echo ""
echo "5️⃣  Vercel Logs:"
echo "   - https://vercel.com/ejay-dev/FormaOS"
echo "   - Select latest deployment"
echo "   - Click 'Runtime Logs' tab"
echo "   - Trigger admin access and watch logs"
echo ""

# Checklist
echo "✅ Pre-Deployment Checklist"
echo "============================"
echo "- [ ] All code changes committed"
echo "- [ ] Build passes locally (npm run build)"
echo "- [ ] No TypeScript errors"
echo "- [ ] Git push successful"
echo "- [ ] Vercel deployment triggered"
echo "- [ ] Deployment shows 'Ready'"
echo ""

echo "✅ Post-Deployment Verification"
echo "=============================="
echo "- [ ] Domain routing works (test 1)"
echo "- [ ] Admin page accessible (test 2)"
echo "- [ ] Production responding (test 3)"
echo "- [ ] Manual browser test passed"
echo "- [ ] Founder can access admin"
echo "- [ ] Non-founder blocked from admin"
echo "- [ ] Console logs show founder detection"
echo ""

echo "📊 Deployment Summary"
echo "==================="
echo "Latest commits:"
git log --oneline -5 | sed 's/^/  /'
echo ""
echo "Deployment status:"
echo "  Check: https://vercel.com/ejay-dev/FormaOS"
echo ""
echo "✅ All tests completed. Review results above."
