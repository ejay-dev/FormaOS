#!/bin/bash

# FormaOS Mobile - Functionality Validation Script
echo "🧪 FormaOS Mobile - Functionality Validation"
echo "============================================"

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_test() {
    echo -e "${BLUE}🔍 Testing: $1${NC}"
}

print_pass() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
}

print_fail() {
    echo -e "${RED}❌ FAIL: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

# Validation Results
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    print_test "$test_name"
    
    if eval "$test_command"; then
        if [ "$expected_result" = "pass" ]; then
            print_pass "$test_name"
            ((TESTS_PASSED++))
        else
            print_fail "$test_name"
            ((TESTS_FAILED++))
        fi
    else
        if [ "$expected_result" = "pass" ]; then
            print_fail "$test_name"
            ((TESTS_FAILED++))
        else
            print_pass "$test_name"
            ((TESTS_PASSED++))
        fi
    fi
}

echo "🏁 Starting Validation Tests..."
echo ""

# Test 1: Check mobile directory structure
print_test "Mobile directory structure"
if [ -d "$(dirname "$0")" ] && 
   [ -f "$(dirname "$0")/package.json" ] && 
   [ -f "$(dirname "$0")/capacitor.config.json" ]; then
    print_pass "Mobile directory structure is correct"
    ((TESTS_PASSED++))
else
    print_fail "Mobile directory structure is incomplete"
    ((TESTS_FAILED++))
fi

# Test 2: Check web build output or server URL
print_test "Web build output or server URL"
if [ -d "../out" ] && [ -f "../out/index.html" ]; then
    print_pass "Web build output exists"
    ((TESTS_PASSED++))
elif grep -q "https://app.formaos.com.au" capacitor.config.* 2>/dev/null; then
    print_pass "Server URL configured for web app"
    ((TESTS_PASSED++))
else
    print_fail "Neither web build output nor server URL found"
    ((TESTS_FAILED++))
fi

# Test 3: Check mobile dependencies
print_test "Mobile dependencies installed"
if [ -d "node_modules" ] && [ -f "node_modules/@capacitor/core/package.json" ]; then
    print_pass "Mobile dependencies are installed"
    ((TESTS_PASSED++))
else
    print_fail "Mobile dependencies missing - run npm install"
    ((TESTS_FAILED++))
fi

# Test 4: Check Capacitor configuration
print_test "Capacitor configuration"
if [ -f "capacitor.config.json" ] || [ -f "capacitor.config.ts" ]; then
    # Check if config contains required fields
    if grep -q "com.formaos.mobile" capacitor.config.* 2>/dev/null; then
        print_pass "Capacitor configuration is valid"
        ((TESTS_PASSED++))
    else
        print_fail "Capacitor configuration missing app ID"
        ((TESTS_FAILED++))
    fi
else
    print_fail "Capacitor configuration missing"
    ((TESTS_FAILED++))
fi

# Test 5: Check iOS platform
print_test "iOS platform configuration"
if [ -d "ios" ]; then
    if [ -f "ios/App/App.xcodeproj/project.pbxproj" ]; then
        print_pass "iOS platform is configured"
        ((TESTS_PASSED++))
    else
        print_warning "iOS platform exists but project file missing"
        ((TESTS_WARNING++))
    fi
else
    print_warning "iOS platform not added - run: npx cap add ios"
    ((TESTS_WARNING++))
fi

# Test 6: Check Android platform  
print_test "Android platform configuration"
if [ -d "android" ]; then
    if [ -f "android/build.gradle" ] || [ -f "android/app/build.gradle" ]; then
        print_pass "Android platform is configured"
        ((TESTS_PASSED++))
    else
        print_warning "Android platform exists but build files missing"
        ((TESTS_WARNING++))
    fi
else
    print_warning "Android platform not added - run: npx cap add android"
    ((TESTS_WARNING++))
fi

# Test 7: Check mobile JavaScript initialization
print_test "Mobile JavaScript initialization"
if [ -f "src/mobile.ts" ]; then
    if grep -q "FormaOSMobile" "src/mobile.ts"; then
        print_pass "Mobile JavaScript initialization exists"
        ((TESTS_PASSED++))
    else
        print_fail "Mobile JavaScript initialization incomplete"
        ((TESTS_FAILED++))
    fi
else
    print_fail "Mobile JavaScript initialization missing"
    ((TESTS_FAILED++))
fi

# Test 8: Check mobile CSS optimizations
print_test "Mobile CSS optimizations"
if [ -f "src/mobile.css" ]; then
    if grep -q "mobile-app" "src/mobile.css"; then
        print_pass "Mobile CSS optimizations exist"
        ((TESTS_PASSED++))
    else
        print_fail "Mobile CSS optimizations incomplete"
        ((TESTS_FAILED++))
    fi
else
    print_fail "Mobile CSS optimizations missing"
    ((TESTS_FAILED++))
fi

# Test 9: Check build scripts
print_test "Build scripts"
if [ -f "build-mobile.sh" ] && [ -x "build-mobile.sh" ]; then
    print_pass "Build scripts are executable"
    ((TESTS_PASSED++))
else
    print_fail "Build scripts missing or not executable"
    ((TESTS_FAILED++))
fi

# Test 10: Check asset generation
print_test "Asset generation scripts"
if [ -f "generate-assets.sh" ] && [ -x "generate-assets.sh" ]; then
    print_pass "Asset generation scripts are ready"
    ((TESTS_PASSED++))
else
    print_fail "Asset generation scripts missing or not executable"
    ((TESTS_FAILED++))
fi

# Test 11: Validate package.json scripts
print_test "Package.json scripts"
if grep -q "open:ios\|open:android\|dev" package.json; then
    print_pass "Required npm scripts are configured"
    ((TESTS_PASSED++))
else
    print_fail "Required npm scripts are missing"
    ((TESTS_FAILED++))
fi

# Test 12: Check web app compatibility
print_test "Web app Next.js compatibility"
if [ -f "../package.json" ]; then
    if grep -q "next" "../package.json"; then
        print_pass "Next.js web app detected"
        ((TESTS_PASSED++))
    else
        print_warning "Web app framework unknown"
        ((TESTS_WARNING++))
    fi
else
    print_fail "Web app package.json not found"
    ((TESTS_FAILED++))
fi

echo ""
echo "📊 Validation Results"
echo "===================="
echo -e "✅ Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "❌ Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo -e "⚠️  Warnings: ${YELLOW}$TESTS_WARNING${NC}"

TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED + TESTS_WARNING))
echo "📈 Total Tests: $TOTAL_TESTS"

# Calculate pass percentage
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_PERCENTAGE=$(( (TESTS_PASSED * 100) / TOTAL_TESTS ))
    echo "📈 Pass Rate: $PASS_PERCENTAGE%"
fi

echo ""

# Final recommendations
if [ $TESTS_FAILED -eq 0 ]; then
    if [ $TESTS_WARNING -eq 0 ]; then
        echo "🎉 All tests passed! Mobile app is ready for development."
        echo ""
        echo "Next steps:"
        echo "1. Run: npm run dev (iOS) or npm run dev:android"
        echo "2. Test on physical devices"
        echo "3. Verify all authentication flows"
        echo "4. Test plan upgrade functionality"
        echo "5. Generate final app assets"
    else
        echo "✅ Core functionality validated with some warnings."
        echo ""
        echo "Recommended actions:"
        echo "1. Review warnings above"
        echo "2. Add missing platforms if needed"
        echo "3. Test core functionality"
    fi
else
    echo "❌ Some critical tests failed. Please fix the issues above before proceeding."
    echo ""
    echo "Common fixes:"
    echo "1. Run: npm install (in mobile directory)"
    echo "2. Run: npm run build (in parent directory)"  
    echo "3. Run: npx cap add ios && npx cap add android"
    echo "4. Ensure all required files are present"
fi

echo ""
echo "📚 For detailed setup instructions, see: README.md"
echo "🏪 For store submission guidance, see: STORE_SUBMISSION_GUIDE.md"