#!/bin/bash
#
# Stripe Configuration Validator
# Validates that Stripe is properly configured for production deployment
#

set -e

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║          Stripe Configuration Validation Script                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check if variable is set
check_env_var() {
    local var_name=$1
    local is_required=$2
    local expected_prefix=$3
    
    if [ -z "${!var_name}" ]; then
        if [ "$is_required" = "true" ]; then
            echo -e "${RED}✗${NC} $var_name: NOT SET (required)"
            ((ERRORS++))
        else
            echo -e "${YELLOW}⚠${NC} $var_name: NOT SET (optional)"
            ((WARNINGS++))
        fi
        return 1
    else
        # Check prefix if provided
        if [ -n "$expected_prefix" ]; then
            if [[ "${!var_name}" == ${expected_prefix}* ]]; then
                echo -e "${GREEN}✓${NC} $var_name: SET (${expected_prefix}...)"
            else
                echo -e "${RED}✗${NC} $var_name: SET but wrong prefix (expected: ${expected_prefix})"
                ((ERRORS++))
                return 1
            fi
        else
            echo -e "${GREEN}✓${NC} $var_name: SET"
        fi
    fi
    return 0
}

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo -e "${YELLOW}⚠${NC} .env.local not found - checking environment variables..."
    echo ""
else
    echo -e "${GREEN}✓${NC} Found .env.local - loading variables..."
    export $(cat .env.local | grep -v '^#' | xargs)
    echo ""
fi

echo "═══════════════════════════════════════════════════════════════════"
echo "Checking Stripe Configuration..."
echo "═══════════════════════════════════════════════════════════════════"

# Check Stripe Secret Key
check_env_var "STRIPE_SECRET_KEY" "true" "sk_"

# Detect mode if key is set
if [ -n "$STRIPE_SECRET_KEY" ]; then
    if [[ "$STRIPE_SECRET_KEY" == sk_live_* ]]; then
        echo -e "  ${GREEN}→${NC} Mode: LIVE (production)"
    elif [[ "$STRIPE_SECRET_KEY" == sk_test_* ]]; then
        echo -e "  ${YELLOW}→${NC} Mode: TEST (development)"
        ((WARNINGS++))
    else
        echo -e "  ${RED}→${NC} Mode: UNKNOWN (invalid key format)"
        ((ERRORS++))
    fi
fi

# Check Webhook Secret
check_env_var "STRIPE_WEBHOOK_SECRET" "true" "whsec_"

# Check Price IDs (optional - code has defaults)
echo ""
check_env_var "STRIPE_PRICE_BASIC" "false" "price_"
check_env_var "STRIPE_PRICE_PRO" "false" "price_"
check_env_var "STRIPE_PRICE_ENTERPRISE" "false" "price_"

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "Checking Code Configuration..."
echo "═══════════════════════════════════════════════════════════════════"

# Check that stripe.ts exists and has correct price IDs
if [ -f "lib/billing/stripe.ts" ]; then
    echo -e "${GREEN}✓${NC} lib/billing/stripe.ts exists"
    
    # Extract price IDs from code
    BASIC_PRICE=$(grep -oP "basic:\s*\"price_[^\"]*\"" lib/billing/stripe.ts | grep -oP "price_[^\"]*" || echo "")
    PRO_PRICE=$(grep -oP "pro:\s*\"price_[^\"]*\"" lib/billing/stripe.ts | grep -oP "price_[^\"]*" || echo "")
    
    if [ -n "$BASIC_PRICE" ]; then
        echo -e "${GREEN}✓${NC} Basic price in code: $BASIC_PRICE"
        # Verify it matches expected
        if [ "$BASIC_PRICE" = "price_1So1UsAHrAKKo3OlrgiqfEcc" ]; then
            echo -e "  ${GREEN}→${NC} Matches FormaOS Starter production price"
        else
            echo -e "  ${YELLOW}→${NC} Different from documented production price"
            ((WARNINGS++))
        fi
    else
        echo -e "${RED}✗${NC} Basic price not found in code"
        ((ERRORS++))
    fi
    
    if [ -n "$PRO_PRICE" ]; then
        echo -e "${GREEN}✓${NC} Pro price in code: $PRO_PRICE"
        # Verify it matches expected
        if [ "$PRO_PRICE" = "price_1So1VmAHrAKKo3OlP6k9TMn4" ]; then
            echo -e "  ${GREEN}→${NC} Matches FormaOS Pro production price"
        else
            echo -e "  ${YELLOW}→${NC} Different from documented production price"
            ((WARNINGS++))
        fi
    else
        echo -e "${RED}✗${NC} Pro price not found in code"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} lib/billing/stripe.ts not found"
    ((ERRORS++))
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "Checking Webhook Handler..."
echo "═══════════════════════════════════════════════════════════════════"

if [ -f "app/api/billing/webhook/route.ts" ]; then
    echo -e "${GREEN}✓${NC} app/api/billing/webhook/route.ts exists"
else
    echo -e "${RED}✗${NC} Webhook handler not found"
    ((ERRORS++))
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "Summary"
echo "═══════════════════════════════════════════════════════════════════"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo ""
    echo "Stripe configuration is ready for production deployment."
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ $WARNINGS warning(s) found${NC}"
    echo ""
    echo "Configuration is functional but review warnings above."
    exit 0
else
    echo -e "${RED}✗ $ERRORS error(s) and $WARNINGS warning(s) found${NC}"
    echo ""
    echo "Fix the errors above before deploying to production."
    exit 1
fi
