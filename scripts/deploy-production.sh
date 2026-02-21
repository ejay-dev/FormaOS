#!/bin/bash
#
# Quick Deploy to Production
# Automated deployment workflow with safety checks
#

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║              FormaOS Production Deployment                       ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "app" ]; then
    echo -e "${RED}Error: This script must be run from the FormaOS root directory${NC}"
    exit 1
fi

echo -e "${BLUE}Step 1: Pre-deployment Validation${NC}"
echo "═══════════════════════════════════════════════════════════════════"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}⚠ Warning: You have uncommitted changes${NC}"
    echo ""
    git status --short
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}Deployment cancelled${NC}"
        exit 1
    fi
fi

# Check current branch
CURRENT_BRANCH=$(git branch --show-current)
echo -e "Current branch: ${GREEN}$CURRENT_BRANCH${NC}"

# Validate Stripe configuration
echo ""
echo -e "${BLUE}Step 2: Validating Stripe Configuration${NC}"
echo "═══════════════════════════════════════════════════════════════════"

if [ -f "scripts/validate-stripe-config.sh" ]; then
    ./scripts/validate-stripe-config.sh
    if [ $? -ne 0 ]; then
        echo ""
        echo -e "${RED}Stripe configuration validation failed${NC}"
        echo -e "${YELLOW}Fix the errors above or skip validation to continue${NC}"
        read -p "Skip validation and continue? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo -e "${YELLOW}⚠ Stripe validation script not found, skipping...${NC}"
fi

echo ""
echo -e "${BLUE}Step 3: Environment Variable Check${NC}"
echo "═══════════════════════════════════════════════════════════════════"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠ Vercel CLI not found${NC}"
    echo ""
    echo "To deploy, you need Vercel CLI installed:"
    echo "  npm install -g vercel"
    echo ""
    echo "Or deploy via Vercel Dashboard or GitHub integration."
    echo ""
    read -p "Continue without Vercel CLI? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    SKIP_VERCEL=true
else
    echo -e "${GREEN}✓${NC} Vercel CLI found"
    
    # Check if logged in
    if vercel whoami &> /dev/null; then
        VERCEL_USER=$(vercel whoami)
        echo -e "${GREEN}✓${NC} Logged in as: $VERCEL_USER"
    else
        echo -e "${YELLOW}⚠ Not logged in to Vercel${NC}"
        echo ""
        read -p "Login now? (Y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
            vercel login
        else
            SKIP_VERCEL=true
        fi
    fi
fi

if [ "$SKIP_VERCEL" != "true" ]; then
    echo ""
    echo "Checking environment variables..."
    
    # Check if STRIPE_SECRET_KEY is set
    if vercel env ls production 2>/dev/null | grep -q "STRIPE_SECRET_KEY"; then
        echo -e "${GREEN}✓${NC} STRIPE_SECRET_KEY is set in production"
    else
        echo -e "${RED}✗${NC} STRIPE_SECRET_KEY not found in production environment"
        echo ""
        echo "Set it now using:"
        echo "  vercel env add STRIPE_SECRET_KEY production"
        echo ""
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Check if STRIPE_WEBHOOK_SECRET is set
    if vercel env ls production 2>/dev/null | grep -q "STRIPE_WEBHOOK_SECRET"; then
        echo -e "${GREEN}✓${NC} STRIPE_WEBHOOK_SECRET is set in production"
    else
        echo -e "${YELLOW}⚠${NC} STRIPE_WEBHOOK_SECRET not found in production environment"
        echo ""
        echo "You should set this after configuring the webhook in Stripe Dashboard"
    fi
fi

echo ""
echo -e "${BLUE}Step 4: Build Verification${NC}"
echo "═══════════════════════════════════════════════════════════════════"

echo "Running production build test..."
if npm run build; then
    echo -e "${GREEN}✓${NC} Build successful"
else
    echo -e "${RED}✗${NC} Build failed"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}Step 5: Deployment${NC}"
echo "═══════════════════════════════════════════════════════════════════"

if [ "$SKIP_VERCEL" = "true" ]; then
    echo -e "${YELLOW}Vercel CLI not available${NC}"
    echo ""
    echo "Deploy using one of these methods:"
    echo ""
    echo "1. Vercel Dashboard:"
    echo "   - Go to: https://vercel.com"
    echo "   - Find your project"
    echo "   - Click 'Deployments'"
    echo "   - Click 'Deploy' → 'main' branch"
    echo ""
    echo "2. GitHub Integration:"
    echo "   - Push to main branch:"
    echo "     git push origin main"
    echo "   - Vercel will auto-deploy"
    echo ""
    echo "3. Install Vercel CLI:"
    echo "   npm install -g vercel"
    echo "   vercel --prod"
    echo ""
else
    echo "Ready to deploy to production!"
    echo ""
    read -p "Deploy now? (Y/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
        echo ""
        echo "Deploying to production..."
        echo ""
        
        vercel --prod
        
        if [ $? -eq 0 ]; then
            echo ""
            echo -e "${GREEN}✓ Deployment successful!${NC}"
            DEPLOYED=true
        else
            echo ""
            echo -e "${RED}✗ Deployment failed${NC}"
            exit 1
        fi
    else
        echo ""
        echo "Deployment skipped"
    fi
fi

if [ "$DEPLOYED" = "true" ]; then
    echo ""
    echo -e "${BLUE}Step 6: Post-Deployment Verification${NC}"
    echo "═══════════════════════════════════════════════════════════════════"
    echo ""
    echo "Complete these verification steps:"
    echo ""
    echo "1. ${CYAN}Verify Stripe Mode${NC}"
    echo "   - Go to: https://your-domain.com/admin/revenue"
    echo "   - Check for: ${GREEN}🟢 Live Mode${NC} badge"
    echo ""
    echo "2. ${CYAN}Test Webhook${NC}"
    echo "   - Stripe Dashboard → Developers → Webhooks"
    echo "   - Send test webhook"
    echo ""
    echo "3. ${CYAN}Check Reconciliation${NC}"
    echo "   - Go to: https://your-domain.com/admin/revenue/reconciliation"
    echo "   - Verify sync status"
    echo ""
    echo "4. ${CYAN}Run Verification Script${NC}"
    echo "   ./scripts/verify-production-deployment.sh https://your-domain.com"
    echo ""
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo -e "${GREEN}Deployment process complete!${NC}"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Complete post-deployment verification"
echo "2. Monitor Vercel function logs"
echo "3. Check Stripe webhook deliveries"
echo ""
echo "Documentation:"
echo "- PRODUCTION_DEPLOYMENT_RUNBOOK.md"
echo "- STRIPE_DEPLOYMENT_GUIDE.md"
echo ""
