#!/bin/bash

# ============================================================================
# Verify GitHub Actions Environment Variables
# ============================================================================
# 
# This script checks if all required GitHub Actions variables and secrets
# are properly configured.
#
# Usage:
#   ./scripts/verify-github-actions-env.sh
#
# ============================================================================

set -e

REPO="ejay-dev/FormaOS"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}GitHub Actions Environment Variables Verification${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Check gh CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) not found${NC}"
    echo "   Install: https://cli.github.com/"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI not authenticated${NC}"
    echo "   Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI authenticated${NC}"
echo ""

# Required variables
REQUIRED_VARS=(
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

# Required secrets
REQUIRED_SECRETS=(
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_KEY"
)

# Optional secrets
OPTIONAL_SECRETS=(
    "SNYK_TOKEN"
    "CODECOV_TOKEN"
    "LHCI_GITHUB_APP_TOKEN"
)

echo -e "${YELLOW}Checking Variables...${NC}"
echo ""

# Get list of variables
VARS_LIST=$(gh variable list --repo "$REPO" 2>&1)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if echo "$VARS_LIST" | grep -q "^$var"; then
        echo -e "${GREEN}✅ $var${NC}"
    else
        echo -e "${RED}❌ $var (missing)${NC}"
        MISSING_VARS+=("$var")
    fi
done

echo ""
echo -e "${YELLOW}Checking Required Secrets...${NC}"
echo ""

# Get list of secrets
SECRETS_LIST=$(gh secret list --repo "$REPO" 2>&1)

MISSING_SECRETS=()
for secret in "${REQUIRED_SECRETS[@]}"; do
    if echo "$SECRETS_LIST" | grep -q "^$secret"; then
        echo -e "${GREEN}✅ $secret${NC}"
    else
        echo -e "${RED}❌ $secret (missing)${NC}"
        MISSING_SECRETS+=("$secret")
    fi
done

echo ""
echo -e "${YELLOW}Checking Optional Secrets...${NC}"
echo ""

for secret in "${OPTIONAL_SECRETS[@]}"; do
    if echo "$SECRETS_LIST" | grep -q "^$secret"; then
        echo -e "${GREEN}✅ $secret (optional)${NC}"
    else
        echo -e "${BLUE}⊘  $secret (optional, not set)${NC}"
    fi
done

echo ""
echo -e "${BLUE}============================================================================${NC}"

# Summary
if [ ${#MISSING_VARS[@]} -eq 0 ] && [ ${#MISSING_SECRETS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All required variables and secrets are configured!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Trigger a workflow run: gh workflow run 'QA Pipeline' --repo $REPO"
    echo "  2. Check for warnings: https://github.com/$REPO/actions"
    echo "  3. Verify workflows pass successfully"
else
    echo -e "${RED}❌ Missing required configuration${NC}"
    echo ""
    
    if [ ${#MISSING_VARS[@]} -gt 0 ]; then
        echo -e "${YELLOW}Missing Variables:${NC}"
        for var in "${MISSING_VARS[@]}"; do
            echo "  - $var"
        done
        echo ""
    fi
    
    if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
        echo -e "${YELLOW}Missing Secrets:${NC}"
        for secret in "${MISSING_SECRETS[@]}"; do
            echo "  - $secret"
        done
        echo ""
    fi
    
    echo "Run the sync script to configure:"
    echo "  ./scripts/sync-env-to-github-actions.sh"
    echo ""
    echo "Or see the quick start guide:"
    echo "  cat QUICK_START_ENV_SYNC.md"
    
    exit 1
fi

echo -e "${BLUE}============================================================================${NC}"
