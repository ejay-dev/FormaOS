#!/bin/bash

# ============================================================================
# Sync Vercel Environment Variables to GitHub Actions
# ============================================================================
# 
# This script syncs environment variables from Vercel to GitHub Actions
# secrets and variables to resolve "Context access might be invalid" warnings.
#
# Prerequisites:
# 1. GitHub CLI (gh) installed and authenticated
# 2. Vercel CLI (vercel) installed and authenticated (optional, for auto-fetch)
# 3. Repository write access (to set secrets/variables)
#
# Usage:
#   ./scripts/sync-env-to-github-actions.sh
#
# ============================================================================

set -e

REPO="ejay-dev/FormaOS"
VERCEL_PROJECT_ID="${VERCEL_PROJECT_ID:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================================================${NC}"
echo -e "${BLUE}Sync Vercel Environment Variables to GitHub Actions${NC}"
echo -e "${BLUE}============================================================================${NC}"
echo ""

# ============================================================================
# Step 1: Check Prerequisites
# ============================================================================

echo -e "${YELLOW}Step 1: Checking prerequisites...${NC}"

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "   Install: https://cli.github.com/"
    exit 1
fi

# Check if gh is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI is not authenticated${NC}"
    echo "   Run: gh auth login"
    exit 1
fi

echo -e "${GREEN}✅ GitHub CLI is ready${NC}"

# Check if vercel CLI is available (optional)
VERCEL_AVAILABLE=false
if command -v vercel &> /dev/null; then
    VERCEL_AVAILABLE=true
    echo -e "${GREEN}✅ Vercel CLI is available${NC}"
else
    echo -e "${YELLOW}⚠️  Vercel CLI not found - will need manual input${NC}"
fi

echo ""

# ============================================================================
# Step 2: Retrieve Vercel Environment Variables
# ============================================================================

echo -e "${YELLOW}Step 2: Retrieving Vercel environment variables...${NC}"
echo ""

# Function to fetch from Vercel (if available)
fetch_from_vercel() {
    if [ "$VERCEL_AVAILABLE" = true ]; then
        echo -e "${BLUE}Attempting to fetch from Vercel...${NC}"
        
        # Try to pull production env vars (this won't show secret values, just names)
        if vercel env ls production 2>/dev/null; then
            echo -e "${GREEN}✅ Vercel environment variables retrieved${NC}"
            echo -e "${YELLOW}⚠️  Note: Vercel CLI doesn't expose secret values via 'env ls'${NC}"
            echo -e "${YELLOW}   You'll need to retrieve actual values from Vercel Dashboard${NC}"
        else
            echo -e "${YELLOW}⚠️  Could not fetch from Vercel CLI${NC}"
        fi
    fi
}

fetch_from_vercel
echo ""

# ============================================================================
# Step 3: Required Variables and Secrets Mapping
# ============================================================================

echo -e "${YELLOW}Step 3: Environment variables mapping${NC}"
echo ""
echo "The following variables/secrets need to be synced:"
echo ""
echo -e "${BLUE}GitHub Actions VARIABLES (public):${NC}"
echo "  • NEXT_PUBLIC_SUPABASE_URL"
echo "  • NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo ""
echo -e "${BLUE}GitHub Actions SECRETS (private):${NC}"
echo "  • SUPABASE_URL (same as NEXT_PUBLIC_SUPABASE_URL)"
echo "  • SUPABASE_ANON_KEY (same as NEXT_PUBLIC_SUPABASE_ANON_KEY)"
echo "  • SUPABASE_SERVICE_KEY (from Vercel: SUPABASE_SERVICE_ROLE_KEY)"
echo "  • SNYK_TOKEN (optional - for security scanning)"
echo "  • CODECOV_TOKEN (optional - for code coverage)"
echo "  • LHCI_GITHUB_APP_TOKEN (optional - for Lighthouse CI)"
echo ""

# ============================================================================
# Step 4: Get Values from User or Vercel
# ============================================================================

echo -e "${YELLOW}Step 4: Getting environment variable values...${NC}"
echo ""
echo "Please retrieve these values from:"
echo "  1. Vercel Dashboard: https://vercel.com/dashboard → Your Project → Settings → Environment Variables"
echo "  2. OR from your local .env file (if you have one)"
echo "  3. OR from Supabase Dashboard: https://supabase.com/dashboard → Your Project → Settings → API"
echo ""

read -p "Do you want to proceed with setting these values? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Aborted. No changes made.${NC}"
    exit 0
fi

echo ""

# ============================================================================
# Step 5: Set GitHub Actions Variables (Public)
# ============================================================================

echo -e "${YELLOW}Step 5: Setting GitHub Actions Variables...${NC}"
echo ""

set_variable() {
    local name=$1
    local prompt=$2
    
    echo -e "${BLUE}Setting variable: ${name}${NC}"
    read -p "$prompt: " value
    
    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠️  Skipped (empty value)${NC}"
        return
    fi
    
    if gh variable set "$name" --repo "$REPO" --body "$value" 2>&1; then
        echo -e "${GREEN}✅ Set: $name${NC}"
    else
        echo -e "${RED}❌ Failed to set: $name${NC}"
    fi
    echo ""
}

echo "Setting PUBLIC variables (these will be visible in workflow runs):"
echo ""

set_variable "NEXT_PUBLIC_SUPABASE_URL" "Enter NEXT_PUBLIC_SUPABASE_URL (e.g., https://xxx.supabase.co)"
set_variable "NEXT_PUBLIC_SUPABASE_ANON_KEY" "Enter NEXT_PUBLIC_SUPABASE_ANON_KEY (starts with eyJhbGciOi...)"

# ============================================================================
# Step 6: Set GitHub Actions Secrets (Private)
# ============================================================================

echo -e "${YELLOW}Step 6: Setting GitHub Actions Secrets...${NC}"
echo ""

set_secret() {
    local name=$1
    local prompt=$2
    
    echo -e "${BLUE}Setting secret: ${name}${NC}"
    read -s -p "$prompt: " value
    echo ""
    
    if [ -z "$value" ]; then
        echo -e "${YELLOW}⚠️  Skipped (empty value)${NC}"
        return
    fi
    
    if echo "$value" | gh secret set "$name" --repo "$REPO" 2>&1; then
        echo -e "${GREEN}✅ Set: $name${NC}"
    else
        echo -e "${RED}❌ Failed to set: $name${NC}"
    fi
    echo ""
}

echo "Setting SECRETS (these will be encrypted and not visible):"
echo ""

set_secret "SUPABASE_URL" "Enter SUPABASE_URL (same as NEXT_PUBLIC_SUPABASE_URL)"
set_secret "SUPABASE_ANON_KEY" "Enter SUPABASE_ANON_KEY (same as NEXT_PUBLIC_SUPABASE_ANON_KEY)"
set_secret "SUPABASE_SERVICE_KEY" "Enter SUPABASE_SERVICE_KEY (from Vercel: SUPABASE_SERVICE_ROLE_KEY)"

echo ""
echo -e "${YELLOW}Optional secrets (press Enter to skip):${NC}"
echo ""

set_secret "SNYK_TOKEN" "Enter SNYK_TOKEN (optional, for security scanning)"
set_secret "CODECOV_TOKEN" "Enter CODECOV_TOKEN (optional, for code coverage)"
set_secret "LHCI_GITHUB_APP_TOKEN" "Enter LHCI_GITHUB_APP_TOKEN (optional, for Lighthouse CI)"

# ============================================================================
# Step 7: Verify Configuration
# ============================================================================

echo ""
echo -e "${YELLOW}Step 7: Verifying configuration...${NC}"
echo ""

echo "Listing current GitHub Actions variables:"
gh variable list --repo "$REPO" 2>&1 || echo "Could not list variables"
echo ""

echo "Listing current GitHub Actions secrets:"
gh secret list --repo "$REPO" 2>&1 || echo "Could not list secrets"
echo ""

# ============================================================================
# Summary
# ============================================================================

echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}✅ Environment Variables Sync Complete!${NC}"
echo -e "${GREEN}============================================================================${NC}"
echo ""
echo "Next steps:"
echo "  1. Go to GitHub Actions: https://github.com/$REPO/actions"
echo "  2. Re-run any failed workflows or trigger a new workflow run"
echo "  3. Verify that 'Context access might be invalid' warnings are gone"
echo "  4. Check that workflows are passing"
echo ""
echo "If you still see warnings:"
echo "  1. Check workflow files use correct variable/secret names"
echo "  2. Verify values are correctly set in GitHub: https://github.com/$REPO/settings/secrets/actions"
echo "  3. Make sure variables are 'vars.NAME' and secrets are 'secrets.NAME'"
echo ""
