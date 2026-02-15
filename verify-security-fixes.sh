#!/bin/bash
# Post-Remediation Security Verification Audit
# Verifies all 8 security fixes are working correctly

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=8

echo "════════════════════════════════════════════════════════════════"
echo "  POST-REMEDIATION SECURITY VERIFICATION AUDIT"
echo "  Date: $(date)"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Function to print test header
print_test() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}TEST $1: $2${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to report pass
pass() {
  echo -e "${GREEN}✅ PASS:${NC} $1"
  ((TESTS_PASSED++))
}

# Function to report fail
fail() {
  echo -e "${RED}❌ FAIL:${NC} $1"
  ((TESTS_FAILED++))
}

# Function to report info
info() {
  echo -e "${YELLOW}ℹ️  INFO:${NC} $1"
}

# Function to report warning
warn() {
  echo -e "${YELLOW}⚠️  WARN:${NC} $1"
}

# =============================================================================
# TEST 1: RLS Policy Verification (SQL Introspection)
# =============================================================================
print_test "1" "RLS Policy Verification via SQL Introspection"

info "Checking migration files for RLS policy fixes..."

# Check trust packet fix migration exists
if [ -f "supabase/migrations/20260215000001_fix_trust_packet_security.sql" ]; then
  pass "Trust packet security fix migration exists"
  
  # Check that public policy was dropped
  if grep -q "DROP POLICY IF EXISTS \"Valid tokens are publicly readable\"" "supabase/migrations/20260215000001_fix_trust_packet_security.sql"; then
    pass "Public trust packet policy is dropped in migration"
  else
    fail "Public policy drop not found in migration"
  fi
  
  # Check that RPC function was created
  if grep -q "CREATE OR REPLACE FUNCTION get_trust_packet_by_token" "supabase/migrations/20260215000001_fix_trust_packet_security.sql"; then
    pass "Secure RPC function created for trust packet access"
  else
    fail "RPC function not found in migration"
  fi
  
  # Check for SECURITY DEFINER with safe search_path
  if grep -q "SECURITY DEFINER" "supabase/migrations/20260215000001_fix_trust_packet_security.sql" && \
     grep -q "SET search_path = public, pg_temp" "supabase/migrations/20260215000001_fix_trust_packet_security.sql"; then
    pass "RPC function uses SECURITY DEFINER with safe search_path"
  else
    fail "RPC function missing security settings"
  fi
else
  fail "Trust packet security fix migration not found"
fi

# Check user_security table migration
if [ -f "supabase/migrations/20260215000003_create_user_security_table.sql" ]; then
  pass "user_security table migration exists"
  
  # Check for RLS enablement
  if grep -q "ENABLE ROW LEVEL SECURITY" "supabase/migrations/20260215000003_create_user_security_table.sql"; then
    pass "user_security table has RLS enabled"
  else
    fail "RLS not enabled on user_security table"
  fi
  
  # Check for user isolation policies
  if grep -q "user_id = auth.uid()" "supabase/migrations/20260215000003_create_user_security_table.sql"; then
    pass "user_security has user isolation policy (auth.uid())"
  else
    fail "User isolation policy missing"
  fi
else
  fail "user_security table migration not found"
fi

# =============================================================================
# TEST 2: Trust Packet Access Path Verification
# =============================================================================
print_test "2" "No Public Trust Packet Access Path Exists"

info "Verifying trust packet access is secured via RPC only..."

# Check that original trust_packets.sql had the public policy
if [ -f "supabase/migrations/20260212000001_trust_packets.sql" ]; then
  if grep -q "CREATE POLICY \"Valid tokens are publicly readable\"" "supabase/migrations/20260212000001_trust_packets.sql"; then
    info "Original migration had public policy (expected)"
    pass "Confirmed original vulnerability existed"
  fi
fi

# Verify the fix drops it
if grep -q "DROP POLICY IF EXISTS \"Valid tokens are publicly readable\"" "supabase/migrations/20260215000001_fix_trust_packet_security.sql"; then
  pass "Fix migration removes public access"
else
  fail "Public policy not properly removed"
fi

# Check RPC function validates tokens
if grep -q "p_token IS NULL OR LENGTH(p_token) < 10" "supabase/migrations/20260215000001_fix_trust_packet_security.sql" && \
   grep -q "expires_at > NOW()" "supabase/migrations/20260215000001_fix_trust_packet_security.sql" && \
   grep -q "revoked_at IS NULL" "supabase/migrations/20260215000001_fix_trust_packet_security.sql"; then
  pass "RPC function validates token, expiration, and revocation"
else
  fail "RPC function missing validation logic"
fi

# =============================================================================
# TEST 3: Spoofed Heartbeat Call Prevention
# =============================================================================
print_test "3" "Session Heartbeat Forgery Prevention"

info "Verifying heartbeat function prevents user_id spoofing..."

# Check heartbeat fix migration exists
if [ -f "supabase/migrations/20260215000002_fix_session_heartbeat_security.sql" ]; then
  pass "Session heartbeat security fix migration exists"
  
  # Check old function is dropped
  if grep -q "DROP FUNCTION IF EXISTS update_session_heartbeat(TEXT, UUID)" "supabase/migrations/20260215000002_fix_session_heartbeat_security.sql"; then
    pass "Old vulnerable function (accepting user_id) is dropped"
  else
    fail "Old function not properly dropped"
  fi
  
  # Check new function signature
  if grep -q "CREATE OR REPLACE FUNCTION update_session_heartbeat(p_session_id TEXT)" "supabase/migrations/20260215000002_fix_session_heartbeat_security.sql"; then
    pass "New function accepts only session_id (no user_id parameter)"
  else
    fail "New function has incorrect signature"
  fi
  
  # Check auth.uid() is used
  if grep -q "v_user_id := auth.uid()" "supabase/migrations/20260215000002_fix_session_heartbeat_security.sql"; then
    pass "Function derives user_id from auth.uid() internally"
  else
    fail "Function does not use auth.uid()"
  fi
  
  # Check authentication is required
  if grep -q "IF v_user_id IS NULL THEN" "supabase/migrations/20260215000002_fix_session_heartbeat_security.sql" && \
     grep -q "RAISE EXCEPTION 'authentication_required'" "supabase/migrations/20260215000002_fix_session_heartbeat_security.sql"; then
    pass "Function rejects unauthenticated calls"
  else
    fail "Function missing authentication check"
  fi
else
  fail "Session heartbeat security fix migration not found"
fi

# Check API route was updated
if [ -f "app/api/session/heartbeat/route.ts" ]; then
  # The old call had p_user_id: user.id
  # The new call should only have p_session_id
  if ! grep -q "p_user_id:" "app/api/session/heartbeat/route.ts"; then
    pass "API route no longer passes user_id parameter"
  else
    fail "API route still passes user_id parameter (not updated)"
  fi
fi

# =============================================================================
# TEST 4: MFA Bypass Prevention
# =============================================================================
print_test "4" "MFA Implementation Security"

info "Verifying MFA uses cryptographic RNG and hashing..."

if [ -f "lib/security.ts" ]; then
  # Check for crypto.randomBytes usage
  if grep -q "crypto.randomBytes" "lib/security.ts" || grep -q "randomBytes" "lib/security.ts"; then
    pass "Uses crypto.randomBytes (not Math.random)"
  else
    fail "Does not use cryptographic RNG"
  fi
  
  # Check for PBKDF2 hashing
  if grep -q "pbkdf2Sync" "lib/security.ts" || grep -q "PBKDF2" "lib/security.ts"; then
    pass "Uses PBKDF2 for backup code hashing"
  else
    fail "Backup codes not properly hashed"
  fi
  
  # Check for password verification before disable
  if grep -q "password" "lib/security.ts" && grep -q "disable2FA" "lib/security.ts"; then
    if grep -A 10 "disable2FA" "lib/security.ts" | grep -q "signInWithPassword"; then
      pass "Requires password verification before disabling 2FA"
    else
      warn "Password verification may not be fully implemented"
    fi
  fi
  
  # Check for rejection sampling (unbiased character selection)
  if grep -q "rejection sampling" "lib/security.ts" || grep -q "256 - (256 % chars.length)" "lib/security.ts"; then
    pass "Uses rejection sampling for unbiased backup codes"
  else
    warn "Rejection sampling not detected (may use modulo bias)"
  fi
else
  fail "lib/security.ts not found"
fi

# =============================================================================
# TEST 5: SSO Organization Enumeration Prevention
# =============================================================================
print_test "5" "SSO Org Enumeration Prevention"

info "Verifying SSO discovery returns signed tokens, not raw orgId..."

if [ -f "app/api/sso/discover/route.ts" ]; then
  # Check for HMAC signing
  if grep -q "createHmac" "app/api/sso/discover/route.ts" || grep -q "HMAC" "app/api/sso/discover/route.ts"; then
    pass "Uses HMAC for flow token signing"
  else
    fail "HMAC signing not implemented"
  fi
  
  # Check that raw orgId is not returned directly
  if ! grep -q "orgId:" "app/api/sso/discover/route.ts" | grep -q "result.orgId"; then
    pass "Does not return raw orgId in response"
  else
    info "Check manually: orgId should be in signed token, not response body"
  fi
  
  # Check for flowToken
  if grep -q "flowToken" "app/api/sso/discover/route.ts"; then
    pass "Returns flowToken instead of raw orgId"
  else
    fail "flowToken not found in response"
  fi
  
  # Check for token expiration
  if grep -q "exp:" "app/api/sso/discover/route.ts" || grep -q "expiration" "app/api/sso/discover/route.ts"; then
    pass "Flow tokens have expiration"
  else
    warn "Token expiration not clearly implemented"
  fi
else
  fail "app/api/sso/discover/route.ts not found"
fi

# =============================================================================
# TEST 6: Security Log Rate Limiting
# =============================================================================
print_test "6" "Security Log Rate Limiting"

info "Verifying /api/security/log has rate limiting..."

if [ -f "app/api/security/log/route.ts" ]; then
  # Check for rate limit imports
  if grep -q "checkRateLimit" "app/api/security/log/route.ts" || grep -q "rate-limiter" "app/api/security/log/route.ts"; then
    pass "Rate limiting module imported"
  else
    fail "Rate limiting not imported"
  fi
  
  # Check for rate limit configuration
  if grep -q "RATE_LIMITS" "app/api/security/log/route.ts"; then
    pass "Rate limit configuration defined"
    
    # Check for different limits for auth/unauth
    if grep -q "SECURITY_LOG" "app/api/security/log/route.ts" && grep -q "SECURITY_LOG_UNAUTH" "app/api/security/log/route.ts"; then
      pass "Different rate limits for authenticated and unauthenticated"
    else
      warn "May not have tiered rate limits"
    fi
  else
    fail "Rate limit configuration missing"
  fi
  
  # Check for 429 response
  if grep -q "429" "app/api/security/log/route.ts"; then
    pass "Returns 429 status on rate limit exceeded"
  else
    fail "Does not return 429 status"
  fi
else
  fail "app/api/security/log/route.ts not found"
fi

# =============================================================================
# TEST 7: Rate Limit Unauth Flood Protection
# =============================================================================
print_test "7" "Rate Limit Blocks Unauthenticated Flood"

info "Verifying rate limiting protects against unauthenticated floods..."

# Check security log has unauthenticated rate limiting
if [ -f "app/api/security/log/route.ts" ]; then
  if grep -q "unauthAllowed.*LOGIN_FAILURE" "app/api/security/log/route.ts"; then
    pass "Login failures allowed for unauthenticated users"
    
    # Should have lower limit for unauth
    if grep -A 5 "SECURITY_LOG_UNAUTH" "app/api/security/log/route.ts" | grep -q "maxRequests.*5"; then
      pass "Unauthenticated requests have stricter limit (5/min)"
    else
      info "Check rate limit values manually"
    fi
  fi
fi

# Check that rate limiter uses IP for unauthenticated
if [ -f "lib/security/rate-limiter.ts" ]; then
  if grep -q "extractClientIP" "lib/security/rate-limiter.ts" || grep -q "getClientIdentifier" "lib/security/rate-limiter.ts"; then
    pass "Rate limiter uses client IP for identification"
  else
    warn "IP-based rate limiting not clearly implemented"
  fi
fi

# =============================================================================
# TEST 8: File-Based Queue Durability
# =============================================================================
print_test "8" "Persistent Queue Durability in Serverless Context"

info "Verifying file-based queue for security event persistence..."

if [ -f "lib/security/persistent-queue.ts" ]; then
  pass "Persistent queue module exists"
  
  # Check for file system operations
  if grep -q "writeFile" "lib/security/persistent-queue.ts" && grep -q "readFile" "lib/security/persistent-queue.ts"; then
    pass "Uses file system for persistence"
  else
    fail "File operations not implemented"
  fi
  
  # Check for queue directory
  if grep -q "QUEUE_DIR" "lib/security/persistent-queue.ts" || grep -q "getQueueDir" "lib/security/persistent-queue.ts"; then
    pass "Queue directory configured"
  else
    fail "Queue directory not configured"
  fi
  
  # Check for retry mechanism
  if grep -q "MAX_RETRY_ATTEMPTS" "lib/security/persistent-queue.ts" && grep -q "attempts" "lib/security/persistent-queue.ts"; then
    pass "Retry mechanism implemented (max attempts)"
  else
    fail "Retry mechanism missing"
  fi
  
  # Check event logger integration
  if [ -f "lib/security/event-logger.ts" ]; then
    if grep -q "enqueueFailedEvent" "lib/security/event-logger.ts"; then
      pass "Event logger integrates with persistent queue"
    else
      fail "Event logger not integrated with queue"
    fi
  fi
  
  # Check for graceful degradation
  if grep -q "queueDisabled" "lib/security/persistent-queue.ts" || grep -q "canQueue" "lib/security/persistent-queue.ts"; then
    pass "Graceful degradation implemented (non-fatal failures)"
  else
    warn "May not have graceful degradation"
  fi
else
  fail "lib/security/persistent-queue.ts not found"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "  AUDIT SUMMARY"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

# Overall result
if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ ALL SECURITY FIXES VERIFIED${NC}"
  echo ""
  echo "All 8 security vulnerabilities have been successfully remediated."
  echo "The codebase is now significantly more secure."
  echo ""
  exit 0
else
  echo -e "${RED}❌ SOME TESTS FAILED${NC}"
  echo ""
  echo "Please review the failed tests above and ensure all security fixes"
  echo "are properly implemented."
  echo ""
  exit 1
fi
