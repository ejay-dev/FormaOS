#!/bin/bash
#
# Production Deployment Verification Script
# Verifies that production deployment is working correctly with Stripe
#

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║         Production Deployment Verification Script                ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Get production URL
if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage:${NC} $0 <production-url>"
    echo ""
    echo "Example:"
    echo "  $0 https://formaos.com.au"
    echo ""
    exit 1
fi

PROD_URL="$1"
# Remove trailing slash
PROD_URL="${PROD_URL%/}"

echo -e "${BLUE}Production URL:${NC} $PROD_URL"
echo ""

ERRORS=0
WARNINGS=0

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local description=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL$endpoint" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} ($response)"
    else
        echo -e "${RED}✗${NC} (got $response, expected $expected_status)"
        ((ERRORS++))
    fi
}

# Function to test JSON endpoint
test_json_endpoint() {
    local endpoint=$1
    local description=$2
    local check_field=$3
    
    echo -n "Testing $description... "
    
    response=$(curl -s "$PROD_URL$endpoint" || echo "{}")
    
    if echo "$response" | grep -q "\"$check_field\""; then
        echo -e "${GREEN}✓${NC} (contains $check_field)"
    else
        echo -e "${RED}✗${NC} (missing $check_field)"
        ((ERRORS++))
    fi
}

echo "═══════════════════════════════════════════════════════════════════"
echo "1. Basic Health Checks"
echo "═══════════════════════════════════════════════════════════════════"
test_endpoint "/" "Homepage"
test_endpoint "/api/health" "Health endpoint"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "2. Authentication Endpoints"
echo "═══════════════════════════════════════════════════════════════════"
test_endpoint "/signin" "Sign in page"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "3. Billing Endpoints"
echo "═══════════════════════════════════════════════════════════════════"
# Webhook endpoint should return 405 for GET (expects POST)
test_endpoint "/api/billing/webhook" "Webhook endpoint" "405"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "4. Admin Endpoints (requires authentication)"
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${YELLOW}Note:${NC} Admin endpoints require authentication"
# Should redirect or return 401/403
test_endpoint "/admin/revenue" "Admin revenue page" "302"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "5. Stripe MRR Verification"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}To verify Stripe integration:${NC}"
echo ""
echo "1. Sign in as a founder user"
echo "2. Navigate to: $PROD_URL/admin/revenue"
echo "3. Verify the mode badge shows: ${GREEN}🟢 Live Mode${NC}"
echo "4. Check that MRR value matches Stripe Dashboard"
echo "5. Navigate to: $PROD_URL/admin/revenue/reconciliation"
echo "6. Verify no major discrepancies between Stripe and DB"
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo "6. Stripe Webhook Verification"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}To verify webhook configuration:${NC}"
echo ""
echo "1. Go to Stripe Dashboard → Developers → Webhooks"
echo "2. Find webhook: $PROD_URL/api/billing/webhook"
echo "3. Click 'Send test webhook'"
echo "4. Select event: customer.subscription.updated"
echo "5. Verify webhook returns 200 OK"
echo "6. Check Vercel function logs for webhook processing"
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo "7. Test Checkout Flow (Optional)"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}To test complete billing flow:${NC}"
echo ""
echo "1. Create a test account"
echo "2. Navigate to billing/subscription page"
echo "3. Initiate checkout for Starter plan"
echo "4. Use Stripe test card: 4242 4242 4242 4242"
echo "5. Complete checkout"
echo "6. Verify subscription created in Stripe Dashboard"
echo "7. Verify subscription synced to database"
echo "8. Check admin dashboard shows updated MRR"
echo ""

echo "═══════════════════════════════════════════════════════════════════"
echo "Summary"
echo "═══════════════════════════════════════════════════════════════════"

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All automated checks passed!${NC}"
    echo ""
    echo "Complete the manual verification steps above to fully validate"
    echo "the Stripe integration."
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) found in automated checks${NC}"
    echo ""
    echo "Fix the errors above before proceeding with manual verification."
    exit 1
fi
