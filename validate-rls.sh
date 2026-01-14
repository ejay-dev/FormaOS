#!/bin/bash

# ============================================================
# RLS Testing & Validation Script
# ============================================================
# Run this after applying RLS policies to verify security

set -e

echo "🔐 FORMAOS RLS VALIDATION TEST SUITE"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

test_case() {
  local name=$1
  local expected=$2
  local actual=$3
  
  if [ "$expected" == "$actual" ]; then
    echo -e "${GREEN}✅ PASS${NC}: $name"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ FAIL${NC}: $name"
    echo "   Expected: $expected"
    echo "   Actual: $actual"
    ((TESTS_FAILED++))
  fi
}

# ============================================================
# 1. CHECK RLS IS ENABLED
# ============================================================
echo ""
echo "1️⃣  CHECKING RLS ENABLEMENT"
echo "---"

# This would require database access - placeholder for manual testing
echo "⚠️  Manual Check Required: Verify in Supabase console:"
echo "   - Authentication > Policies > All tables show RLS enabled"
echo "   - Check these tables: organizations, org_members, org_subscriptions,"
echo "     org_audit_logs, team_invitations, org_files"

# ============================================================
# 2. CHECK MIGRATIONS
# ============================================================
echo ""
echo "2️⃣  CHECKING MIGRATION FILES"
echo "---"

if [ -f "supabase/migrations/20260401_safe_rls_policies.sql" ]; then
  echo -e "${GREEN}✅${NC} Migration file exists"
  ((TESTS_PASSED++))
  
  # Check for correct table names
  if grep -q "org_audit_logs" supabase/migrations/20260401_safe_rls_policies.sql; then
    echo -e "${GREEN}✅${NC} Using correct org_audit_logs table name (plural)"
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌${NC} Migration still uses org_audit_log (singular) - needs fix"
    ((TESTS_FAILED++))
  fi
  
  if grep -q "org_audit_log[^s]" supabase/migrations/20260401_safe_rls_policies.sql; then
    echo -e "${RED}❌${NC} Migration contains org_audit_log (singular) - needs fix"
    ((TESTS_FAILED++))
  else
    echo -e "${GREEN}✅${NC} No org_audit_log (singular) references found"
    ((TESTS_PASSED++))
  fi
else
  echo -e "${RED}❌${NC} Migration file not found"
  ((TESTS_FAILED++))
fi

# ============================================================
# 3. CHECK APPLICATION CODE
# ============================================================
echo ""
echo "3️⃣  CHECKING APPLICATION CODE"
echo "---"

echo "Checking for server-side queries..."

# Check if main dashboard uses server client
if grep -q "createSupabaseServerClient" app/app/page.tsx; then
  echo -e "${GREEN}✅${NC} Dashboard uses server-side client"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌${NC} Dashboard may not be using server-side client"
  ((TESTS_FAILED++))
fi

# Check if team page uses server client
if grep -q "createSupabaseServerClient" app/app/team/page.tsx; then
  echo -e "${GREEN}✅${NC} Team page uses server-side client"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌${NC} Team page may not be using server-side client"
  ((TESTS_FAILED++))
fi

# Check admin routes use admin client
if grep -q "createSupabaseAdminClient" app/api/admin/trials/route.ts; then
  echo -e "${GREEN}✅${NC} Admin trials endpoint uses admin client"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌${NC} Admin trials endpoint may not use admin client"
  ((TESTS_FAILED++))
fi

# ============================================================
# 4. TYPE CHECKING
# ============================================================
echo ""
echo "4️⃣  RUNNING TYPE CHECKS"
echo "---"

if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
  echo -e "${RED}❌${NC} TypeScript errors found"
  ((TESTS_FAILED++))
else
  echo -e "${GREEN}✅${NC} No TypeScript errors"
  ((TESTS_PASSED++))
fi

# ============================================================
# 5. BUILD CHECK
# ============================================================
echo ""
echo "5️⃣  CHECKING BUILD"
echo "---"

# Check if next build would succeed (optional, slow)
# npm run build > /dev/null 2>&1 && echo "✅ Build succeeds" || echo "❌ Build fails"

echo "⚠️  Manual Check: Run 'npm run build' and verify no errors"

# ============================================================
# 6. RUNTIME TESTS (Manual)
# ============================================================
echo ""
echo "6️⃣  RUNTIME TESTS (MANUAL)"
echo "---"

echo "After deployment, test these scenarios:"
echo ""
echo "A) Normal User Access:"
echo "   [ ] Login with normal user account"
echo "   [ ] Dashboard loads - see personal org only"
echo "   [ ] Team page loads - see team members"
echo "   [ ] Subscription page loads"
echo "   [ ] No errors in browser console"
echo ""
echo "B) Founder/Admin Access:"
echo "   [ ] Login with founder account"
echo "   [ ] /admin/dashboard loads"
echo "   [ ] Can view all organizations (via admin API)"
echo "   [ ] Trials page shows all trial subscriptions"
echo "   [ ] No 403/RLS errors"
echo ""
echo "C) Cross-Org Isolation:"
echo "   [ ] Open browser DevTools"
echo "   [ ] Try to query another org_id via Supabase client"
echo "   [ ] Should return empty or error (RLS blocked)"
echo ""
echo "D) Audit Logs:"
echo "   [ ] Navigation to /app/history"
echo "   [ ] Audit logs load correctly"
echo "   [ ] Can see organization audit trail"

# ============================================================
# SUMMARY
# ============================================================
echo ""
echo "====================================="
echo "TEST SUMMARY"
echo "====================================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
  echo ""
  echo "Next Steps:"
  echo "1. Apply RLS migration to Supabase"
  echo "2. Run manual runtime tests above"
  echo "3. Monitor production logs"
  exit 0
else
  echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
  echo ""
  echo "Please fix issues above before deploying"
  exit 1
fi
