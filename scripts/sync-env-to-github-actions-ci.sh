#!/bin/bash

# ============================================================================
# Sync Environment Variables to GitHub Actions (Non-Interactive)
# ============================================================================
# 
# This script sets GitHub Actions secrets and variables from environment
# variables. Useful for automation or when values are already available.
#
# Prerequisites:
# 1. GitHub CLI (gh) authenticated
# 2. Environment variables set with required values
#
# Usage:
#   export NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
#   export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
#   export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."
#   # ... set other variables as needed
#   ./scripts/sync-env-to-github-actions-ci.sh
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
echo -e "${BLUE}Sync Environment Variables to GitHub Actions (Non-Interactive)${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# Check gh CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI found${NC}"
echo ""

# Function to set a variable
set_gh_variable() {
    local name=$1
    local env_var=$2
    local value="${!env_var}"
    
    if [ -n "$value" ]; then
        echo -e "${BLUE}Setting variable: ${name}${NC}"
        if gh variable set "$name" --repo "$REPO" --body "$value" 2>/dev/null; then
            echo -e "${GREEN}✅ Set variable: $name${NC}"
        else
            echo -e "${RED}❌ Failed to set variable: $name${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipped variable: $name (not set in environment)${NC}"
    fi
}

# Function to set a secret
set_gh_secret() {
    local name=$1
    local env_var=$2
    local value="${!env_var}"
    
    if [ -n "$value" ]; then
        echo -e "${BLUE}Setting secret: ${name}${NC}"
        if echo "$value" | gh secret set "$name" --repo "$REPO" 2>/dev/null; then
            echo -e "${GREEN}✅ Set secret: $name${NC}"
        else
            echo -e "${RED}❌ Failed to set secret: $name${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Skipped secret: $name (not set in environment)${NC}"
    fi
}

# Set Variables (public)
echo -e "${YELLOW}Setting GitHub Actions Variables...${NC}"
echo ""
set_gh_variable "NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_URL"
set_gh_variable "NEXT_PUBLIC_SUPABASE_ANON_KEY" "NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo ""

# Set Secrets (private)
echo -e "${YELLOW}Setting GitHub Actions Secrets...${NC}"
echo ""

# Required secrets
set_gh_secret "SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_URL"
set_gh_secret "SUPABASE_ANON_KEY" "NEXT_PUBLIC_SUPABASE_ANON_KEY"
set_gh_secret "SUPABASE_SERVICE_KEY" "SUPABASE_SERVICE_ROLE_KEY"

# Optional secrets
set_gh_secret "SNYK_TOKEN" "SNYK_TOKEN"
set_gh_secret "CODECOV_TOKEN" "CODECOV_TOKEN"
set_gh_secret "LHCI_GITHUB_APP_TOKEN" "LHCI_GITHUB_APP_TOKEN"

echo ""
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}✅ Sync Complete${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""

# Verify
echo -e "${YELLOW}Current configuration:${NC}"
echo ""
echo "Variables:"
gh variable list --repo "$REPO" 2>/dev/null || echo "  (could not list)"
echo ""
echo "Secrets:"
gh secret list --repo "$REPO" 2>/dev/null || echo "  (could not list)"
echo ""
