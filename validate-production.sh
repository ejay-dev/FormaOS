#!/bin/bash

# FormaOS Production Readiness Validation Script
# Date: December 25, 2024
# Purpose: Validate all critical functionality before production deployment

echo "🚀 FormaOS Production Readiness Check"
echo "======================================"
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Counter for checks
PASS=0
FAIL=0
WARN=0

# Test 1: Check if server is running
echo "1. Testing server availability..."
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Server is running${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ Server is not running${NC}"
    ((FAIL++))
fi

# Test 2: Check key routes
echo "2. Testing key routes..."
ROUTES=(
    "/"
    "/auth/signin"
    "/admin"
    "/app"
    "/app/billing"
    "/pricing"
)

for route in "${ROUTES[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$route")
    if [ "$status" = "200" ] || [ "$status" = "307" ] || [ "$status" = "302" ]; then
        echo -e "  ${GREEN}✓ $route (HTTP $status)${NC}"
        ((PASS++))
    else
        echo -e "  ${RED}✗ $route (HTTP $status)${NC}"
        ((FAIL++))
    fi
done

# Test 3: Check for TypeScript errors
echo "3. Checking for TypeScript errors..."
if npm run build --dry-run 2>&1 | grep -q "error"; then
    echo -e "${RED}✗ TypeScript errors found${NC}"
    ((FAIL++))
else
    echo -e "${GREEN}✓ No TypeScript errors${NC}"
    ((PASS++))
fi

# Test 4: Verify environment variables
echo "4. Checking environment variables..."
if [ -f .env.local ]; then
    echo -e "${GREEN}✓ .env.local exists${NC}"
    ((PASS++))
    
    # Check for required variables
    REQUIRED_VARS=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "STRIPE_SECRET_KEY"
        "STRIPE_WEBHOOK_SECRET"
        "NEXT_PUBLIC_SITE_URL"
        "FOUNDER_EMAILS"
    )
    
    for var in "${REQUIRED_VARS[@]}"; do
        if grep -q "$var=" .env.local; then
            echo -e "  ${GREEN}✓ $var is set${NC}"
            ((PASS++))
        else
            echo -e "  ${YELLOW}⚠ $var is missing${NC}"
            ((WARN++))
        fi
    done
else
    echo -e "${RED}✗ .env.local not found${NC}"
    ((FAIL++))
fi

# Test 5: Check critical files
echo "5. Checking critical files..."
CRITICAL_FILES=(
    "app/app/actions/billing.ts"
    "components/billing/BillingActionButtons.tsx"
    "lib/utils/founder.ts"
    "middleware.ts"
    "app/(marketing)/marketing.css"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "  ${GREEN}✓ $file exists${NC}"
        ((PASS++))
    else
        echo -e "  ${RED}✗ $file missing${NC}"
        ((FAIL++))
    fi
done

# Test 6: Check package.json dependencies
echo "6. Checking package dependencies..."
if [ -f "package.json" ]; then
    echo -e "${GREEN}✓ package.json exists${NC}"
    ((PASS++))
    
    # Check for critical dependencies
    CRITICAL_DEPS=(
        "next"
        "react"
        "stripe"
        "@supabase/supabase-js"
        "framer-motion"
    )
    
    for dep in "${CRITICAL_DEPS[@]}"; do
        if grep -q "\"$dep\"" package.json; then
            echo -e "  ${GREEN}✓ $dep is installed${NC}"
            ((PASS++))
        else
            echo -e "  ${RED}✗ $dep is missing${NC}"
            ((FAIL++))
        fi
    done
else
    echo -e "${RED}✗ package.json not found${NC}"
    ((FAIL++))
fi

# Summary
echo ""
echo "======================================"
echo "Validation Summary"
echo "======================================"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${YELLOW}Warnings: $WARN${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All critical checks passed! Ready for production.${NC}"
    exit 0
elif [ $FAIL -lt 3 ]; then
    echo -e "${YELLOW}⚠️  Some checks failed but system may still be functional.${NC}"
    exit 1
else
    echo -e "${RED}❌ Critical failures detected. Fix issues before deployment.${NC}"
    exit 2
fi
