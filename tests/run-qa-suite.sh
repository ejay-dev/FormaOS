#!/bin/bash

# FormaOS Quality Assurance Testing Suite
# Comprehensive testing script for Phase 5 implementation
#
# Audit 2026-08-03 — this file had been written to disk with every newline
# escaped as a literal backslash-n. `wc -l` reported 0 newlines, so bash saw
# the entire 14KB script as one line starting with `#!` — a comment. Nothing
# in it ever ran, including `set -euo pipefail`, and the shell exited 0. The
# body below is the recovered source (verified as the exact inverse of the
# escaping), plus fixes for the paths that reported success without running:
#   * A failed dev-server start marked four phases "skipped" and skipped
#     statuses were never counted, so the suite exited 0 having run neither
#     visual, load, accessibility nor E2E. Environment is now a counted
#     phase, so that outcome exits 1.
#   * Phase 6 invoked tests/accessibility/accessibility-audit.js, which does
#     not exist (the file is a11y-audit.js) — the phase could only ever fail.
#   * Phase 5 invoked tests/load/quick-test.yml, which does not exist; the
#     repo's smoke profile is tests/load/artillery-smoke-config.yml.
#   * Phase 4's "generate new visual references" step re-ran the identical
#     command (test:visual:reference is an alias of test:visual) — there is
#     no baseline store in this repo, so it approved nothing.
#   * The summary's `A && B || C && D || E` chains printed both "PASSED" and
#     "SKIPPED" for the same phase.
#   * Success rate divided by zero when every phase was skipped.

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOGS_DIR="tests/logs"
RESULTS_DIR="tests/results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
TEST_REPORT="qa_test_report_${TIMESTAMP}.json"
SUITE_START=$(date +%s)

# Ensure directories exist
mkdir -p "$LOGS_DIR" "$RESULTS_DIR"

# Function to print colored output
print_status() {
    local status="$1"
    local message="$2"
    case $status in
        "INFO")  echo -e "${BLUE}[INFO]${NC} $message" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $message" ;;
        "WARNING") echo -e "${YELLOW}[WARNING]${NC} $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" ;;
    esac
}

# Render one phase status for the summary report. Replaces the old
# `[ x = success ] && echo PASSED || [ x = skipped ] && echo SKIPPED || echo
# FAILED` chains, which are left-associative and printed two labels for a
# passing phase.
status_label() {
    case "$1" in
        "success") echo "✅ PASSED" ;;
        "skipped") echo "⏭️ SKIPPED" ;;
        *) echo "❌ FAILED" ;;
    esac
}

# Function to log test results
log_result() {
    local test_name="$1"
    local status="$2"
    local duration="$3"
    local details="$4"

    echo "{
  \"test\": \"$test_name\",
  \"status\": \"$status\",
  \"duration\": $duration,
  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
  \"details\": \"$details\"
}," >> "$RESULTS_DIR/$TEST_REPORT"
}

# Start test report
echo "[" > "$RESULTS_DIR/$TEST_REPORT"

print_status "INFO" "🧪 Starting FormaOS Quality Assurance Testing Suite"
print_status "INFO" "📊 Test Report: $TEST_REPORT"
print_status "INFO" "⏰ Started at: $(date)"

# Phase 1: Environment Setup
print_status "INFO" "🔧 Phase 1: Environment Setup"
start_time=$(date +%s)

# Check Node.js and npm
if command -v node > /dev/null && command -v npm > /dev/null; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    print_status "SUCCESS" "Node.js $NODE_VERSION and npm $NPM_VERSION detected"
else
    print_status "ERROR" "Node.js or npm not found"
    exit 1
fi

# Check if development server is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_status "SUCCESS" "Development server is running on localhost:3000"
    SERVER_RUNNING=true
else
    print_status "WARNING" "Development server not detected, starting..."
    npm run dev > "$LOGS_DIR/dev_server.log" 2>&1 &
    DEV_SERVER_PID=$!
    sleep 10
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        print_status "SUCCESS" "Development server started successfully"
        SERVER_RUNNING=true
    else
        print_status "ERROR" "Failed to start development server"
        SERVER_RUNNING=false
    fi
fi

# ENV_STATUS is counted in the final tally. Without it, "server never came
# up" silently downgraded phases 4/5/6/9 to "skipped" and the suite still
# exited 0 — the exact failure the QA suite exists to catch.
if [ "$SERVER_RUNNING" = true ]; then
    ENV_STATUS="success"
else
    ENV_STATUS="failed"
fi

end_time=$(date +%s)
log_result "Environment Setup" "$ENV_STATUS" $((end_time - start_time)) "Node.js $NODE_VERSION, npm $NPM_VERSION"

# Phase 2: Static Analysis
print_status "INFO" "🔍 Phase 2: Static Analysis & Linting"
start_time=$(date +%s)

# TypeScript compilation check
print_status "INFO" "Checking TypeScript compilation..."
if npm run type-check > "$LOGS_DIR/typescript.log" 2>&1; then
    print_status "SUCCESS" "TypeScript compilation passed"
    TS_STATUS="success"
else
    print_status "ERROR" "TypeScript compilation failed"
    TS_STATUS="failed"
fi

# ESLint check
print_status "INFO" "Running ESLint analysis..."
if npm run lint > "$LOGS_DIR/eslint.log" 2>&1; then
    print_status "SUCCESS" "ESLint analysis passed"
    ESLINT_STATUS="success"
else
    print_status "WARNING" "ESLint found issues (check logs)"
    ESLINT_STATUS="warning"
fi

end_time=$(date +%s)
if [ "$TS_STATUS" = success ] && [ "$ESLINT_STATUS" != failed ]; then
    STATIC_STATUS="success"
else
    STATIC_STATUS="failed"
fi
log_result "Static Analysis" "$STATIC_STATUS" $((end_time - start_time)) "TypeScript: $TS_STATUS, ESLint: $ESLINT_STATUS"

# Phase 3: Unit Testing
print_status "INFO" "🧪 Phase 3: Unit Testing"
start_time=$(date +%s)

if npm run test:coverage > "$LOGS_DIR/unit_tests.log" 2>&1; then
    print_status "SUCCESS" "Unit tests passed"
    # Extract coverage information
    if grep -q "All files" "$LOGS_DIR/unit_tests.log"; then
        COVERAGE=$(grep "All files" "$LOGS_DIR/unit_tests.log" | awk '{print $10}')
        print_status "INFO" "Code coverage: $COVERAGE"
    fi
    UNIT_STATUS="success"
else
    print_status "ERROR" "Unit tests failed"
    UNIT_STATUS="failed"
fi

end_time=$(date +%s)
log_result "Unit Testing" "$UNIT_STATUS" $((end_time - start_time)) "Coverage: ${COVERAGE:-unknown}"

# Phase 4: Visual Capture
# NOTE: this repo has no visual baseline store and no image diffing —
# playwright.capture.config.ts states the capture specs "exist to produce
# artefacts, not to assert pass/fail". The phase therefore verifies that the
# capture run completes and that every marketing route returned < 400; it is
# not a pixel-regression gate, and the old "generate new references" step
# (an alias of the same command) has been removed rather than left implying
# an approval workflow that does not exist.
if [ "$SERVER_RUNNING" = true ]; then
    print_status "INFO" "👁️ Phase 4: Visual Capture"
    start_time=$(date +%s)

    if npm run test:visual > "$LOGS_DIR/visual_tests.log" 2>&1; then
        print_status "SUCCESS" "Visual capture completed for all marketing routes"
        VISUAL_STATUS="success"
    else
        print_status "ERROR" "Visual capture failed - a route errored or returned >= 400"
        VISUAL_STATUS="failed"
    fi

    end_time=$(date +%s)
    log_result "Visual Capture" "$VISUAL_STATUS" $((end_time - start_time)) "Playwright screenshot capture (no baseline diff)"
else
    print_status "WARNING" "Skipping visual capture - server not running"
    VISUAL_STATUS="skipped"
fi

# Phase 5: Load Testing
if [ "$SERVER_RUNNING" = true ]; then
    print_status "INFO" "⚡ Phase 5: Load Testing"
    start_time=$(date +%s)

    # Run quick load test. tests/load/quick-test.yml never existed; the smoke
    # profile in this repo is artillery-smoke-config.yml.
    LOAD_CONFIG="tests/load/artillery-smoke-config.yml"
    if [ ! -f "$LOAD_CONFIG" ]; then
        print_status "ERROR" "Load test config missing: $LOAD_CONFIG"
        LOAD_STATUS="failed"
    elif npx --yes artillery@2.0.27 run "$LOAD_CONFIG" --output "$RESULTS_DIR/load_test_$TIMESTAMP.json" > "$LOGS_DIR/load_tests.log" 2>&1; then
        print_status "SUCCESS" "Load testing completed"

        # Extract key metrics
        if command -v jq > /dev/null && [ -f "$RESULTS_DIR/load_test_$TIMESTAMP.json" ]; then
            AVG_RESPONSE=$(jq -r '.aggregate.latency.mean' "$RESULTS_DIR/load_test_$TIMESTAMP.json" 2>/dev/null || echo "unknown")
            RPS=$(jq -r '.aggregate.rps.mean' "$RESULTS_DIR/load_test_$TIMESTAMP.json" 2>/dev/null || echo "unknown")
            print_status "INFO" "Average response time: ${AVG_RESPONSE}ms, RPS: $RPS"
        fi
        LOAD_STATUS="success"
    else
        print_status "ERROR" "Load testing failed"
        LOAD_STATUS="failed"
    fi

    end_time=$(date +%s)
    log_result "Load Testing" "$LOAD_STATUS" $((end_time - start_time)) "Artillery.js performance testing"
else
    print_status "WARNING" "Skipping load tests - server not running"
    LOAD_STATUS="skipped"
fi

# Phase 6: Accessibility Testing
if [ "$SERVER_RUNNING" = true ]; then
    print_status "INFO" "♿ Phase 6: Accessibility Testing"
    start_time=$(date +%s)

    # npm run test:a11y (Playwright + axe) is used instead of
    # tests/accessibility/a11y-audit.js: the audit script ends in
    # `.catch(console.error)` and exits 0 even when the audit throws, so it
    # cannot gate anything.
    if PLAYWRIGHT_REUSE_SERVER=true npm run test:a11y > "$LOGS_DIR/accessibility.log" 2>&1; then
        print_status "SUCCESS" "Accessibility audit passed"
        A11Y_STATUS="success"
    else
        print_status "ERROR" "Accessibility testing failed"
        # Surface the violation count when axe reported one.
        if grep -q "violation" "$LOGS_DIR/accessibility.log"; then
            ISSUES=$(grep -c "violation" "$LOGS_DIR/accessibility.log")
            print_status "INFO" "Accessibility violations logged: $ISSUES"
        fi
        A11Y_STATUS="failed"
    fi

    end_time=$(date +%s)
    log_result "Accessibility" "$A11Y_STATUS" $((end_time - start_time)) "axe-core WCAG 2.1 AA validation"
else
    print_status "WARNING" "Skipping accessibility tests - server not running"
    A11Y_STATUS="skipped"
fi

# Phase 7: Compliance Testing
print_status "INFO" "📋 Phase 7: Compliance Testing"
start_time=$(date +%s)

# GDPR Compliance
print_status "INFO" "Running GDPR compliance checks..."
if node tests/compliance/gdpr-compliance.js > "$LOGS_DIR/gdpr_compliance.log" 2>&1; then
    print_status "SUCCESS" "GDPR compliance checks passed"
    GDPR_STATUS="success"
else
    print_status "ERROR" "GDPR compliance checks failed"
    GDPR_STATUS="failed"
fi

# SOC2 Compliance
print_status "INFO" "Running SOC2 compliance checks..."
if node tests/compliance/soc2-compliance.js > "$LOGS_DIR/soc2_compliance.log" 2>&1; then
    print_status "SUCCESS" "SOC2 compliance checks passed"
    SOC2_STATUS="success"
else
    print_status "ERROR" "SOC2 compliance checks failed"
    SOC2_STATUS="failed"
fi

end_time=$(date +%s)
if [ "$GDPR_STATUS" = success ] && [ "$SOC2_STATUS" = success ]; then
    COMPLIANCE_STATUS="success"
else
    COMPLIANCE_STATUS="failed"
fi
log_result "Compliance Testing" "$COMPLIANCE_STATUS" $((end_time - start_time)) "GDPR: $GDPR_STATUS, SOC2: $SOC2_STATUS"

# Phase 8: A/B Testing Framework
print_status "INFO" "🧪 Phase 8: A/B Testing Framework"
start_time=$(date +%s)

# Validate A/B test configurations
if npm run ab-test:validate > "$LOGS_DIR/ab_testing.log" 2>&1; then
    print_status "SUCCESS" "A/B test configurations validated"

    # List active tests
    TEST_COUNT=$(npm run ab-test:list 2>/dev/null | grep -c "✅" || echo 0)
    print_status "INFO" "Active A/B tests: $TEST_COUNT"
    AB_STATUS="success"
else
    print_status "ERROR" "A/B test validation failed"
    AB_STATUS="failed"
fi

end_time=$(date +%s)
log_result "A/B Testing" "$AB_STATUS" $((end_time - start_time)) "PostHog integration and test validation"

# Phase 9: End-to-End Testing
if [ "$SERVER_RUNNING" = true ]; then
    print_status "INFO" "🔄 Phase 9: End-to-End Testing"
    start_time=$(date +%s)

    if npm run test:e2e > "$LOGS_DIR/e2e_tests.log" 2>&1; then
        print_status "SUCCESS" "End-to-end tests passed"
        E2E_STATUS="success"
    else
        print_status "ERROR" "End-to-end tests failed"
        E2E_STATUS="failed"
    fi

    end_time=$(date +%s)
    log_result "End-to-End Testing" "$E2E_STATUS" $((end_time - start_time)) "Playwright browser automation"
else
    print_status "WARNING" "Skipping E2E tests - server not running"
    E2E_STATUS="skipped"
fi

# Cleanup: Stop development server if we started it
if [ -n "${DEV_SERVER_PID:-}" ]; then
    print_status "INFO" "Stopping development server..."
    kill $DEV_SERVER_PID 2>/dev/null || true
fi

# Close test report JSON
sed -i '' '$ s/,$//' "$RESULTS_DIR/$TEST_REPORT" 2>/dev/null || sed -i '$ s/,$//' "$RESULTS_DIR/$TEST_REPORT"
echo "]" >> "$RESULTS_DIR/$TEST_REPORT"

# Final Summary
print_status "INFO" "📊 Testing Summary"
print_status "INFO" "================="

# Count results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

for status in "$ENV_STATUS" "$TS_STATUS" "$UNIT_STATUS" "$VISUAL_STATUS" "$LOAD_STATUS" "$A11Y_STATUS" "$GDPR_STATUS" "$SOC2_STATUS" "$AB_STATUS" "$E2E_STATUS"; do
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    case $status in
        "success") PASSED_TESTS=$((PASSED_TESTS + 1)) ;;
        "failed") FAILED_TESTS=$((FAILED_TESTS + 1)) ;;
        "skipped") SKIPPED_TESTS=$((SKIPPED_TESTS + 1)) ;;
    esac
done

print_status "INFO" "Total Tests: $TOTAL_TESTS"
print_status "SUCCESS" "Passed: $PASSED_TESTS"
if [ $FAILED_TESTS -gt 0 ]; then
    print_status "ERROR" "Failed: $FAILED_TESTS"
fi
if [ $SKIPPED_TESTS -gt 0 ]; then
    print_status "WARNING" "Skipped: $SKIPPED_TESTS"
fi

EXECUTED_TESTS=$((TOTAL_TESTS - SKIPPED_TESTS))
if [ $EXECUTED_TESTS -gt 0 ]; then
    SUCCESS_RATE=$((PASSED_TESTS * 100 / EXECUTED_TESTS))
else
    SUCCESS_RATE=0
fi
print_status "INFO" "Success Rate: $SUCCESS_RATE%"

# Generate summary report
SUMMARY_FILE="$RESULTS_DIR/qa_summary_$TIMESTAMP.txt"
cat > "$SUMMARY_FILE" << EOF
FormaOS Quality Assurance Testing Report
========================================
Timestamp: $(date)
Duration: $(($(date +%s) - SUITE_START)) seconds

Test Results:
- Environment Setup: $(status_label "$ENV_STATUS")
- TypeScript Check: $(status_label "$TS_STATUS")
- Unit Testing: $(status_label "$UNIT_STATUS")
- Visual Capture: $(status_label "$VISUAL_STATUS")
- Load Testing: $(status_label "$LOAD_STATUS")
- Accessibility: $(status_label "$A11Y_STATUS")
- GDPR Compliance: $(status_label "$GDPR_STATUS")
- SOC2 Compliance: $(status_label "$SOC2_STATUS")
- A/B Testing: $(status_label "$AB_STATUS")
- End-to-End: $(status_label "$E2E_STATUS")

Overall Success Rate: $SUCCESS_RATE%

Logs Location: $LOGS_DIR/
Results Location: $RESULTS_DIR/
Detailed Report: $TEST_REPORT
EOF

print_status "INFO" "📋 Summary report saved to: $SUMMARY_FILE"
print_status "INFO" "📁 Detailed logs available in: $LOGS_DIR/"
print_status "INFO" "🎯 Test completed at: $(date)"

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    print_status "SUCCESS" "🎉 All tests completed successfully!"
    exit 0
else
    print_status "ERROR" "❌ Some tests failed. Check logs for details."
    exit 1
fi
