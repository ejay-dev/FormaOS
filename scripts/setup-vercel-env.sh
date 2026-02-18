#!/bin/bash
#
# Vercel Environment Variable Setup Helper
# Generates commands to set environment variables in Vercel
#

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║        Vercel Environment Variable Setup Helper                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""
echo "This script generates Vercel CLI commands to set environment variables."
echo "You'll need to have the Vercel CLI installed and authenticated."
echo ""
echo "Install Vercel CLI:"
echo "  npm install -g vercel"
echo ""
echo "Login to Vercel:"
echo "  vercel login"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "Required Stripe Environment Variables"
echo "═══════════════════════════════════════════════════════════════════"
echo ""

# Stripe Secret Key
cat << 'EOF'
# Set Stripe Secret Key (PRODUCTION)
vercel env add STRIPE_SECRET_KEY production << ENVEOF
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
ENVEOF

EOF

# Stripe Webhook Secret
cat << 'EOF'
# Set Stripe Webhook Secret (get from Stripe Dashboard)
# Go to: Stripe Dashboard → Developers → Webhooks
# Copy the webhook signing secret after creating the endpoint
vercel env add STRIPE_WEBHOOK_SECRET production << ENVEOF
whsec_YOUR_WEBHOOK_SECRET_HERE
ENVEOF

EOF

echo "═══════════════════════════════════════════════════════════════════"
echo "Optional Stripe Environment Variables"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "# These are optional - code has defaults"
echo ""

cat << 'EOF'
# Override Basic/Starter Price ID (optional)
vercel env add STRIPE_PRICE_BASIC production << ENVEOF
price_1So1UsAHrAKKo3OlrgiqfEcc
ENVEOF

# Override Pro Price ID (optional)
vercel env add STRIPE_PRICE_PRO production << ENVEOF
price_1So1VmAHrAKKo3OlP6k9TMn4
ENVEOF

EOF

echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "Alternative: Using Vercel Dashboard"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "You can also set these via Vercel Dashboard:"
echo "1. Go to: https://vercel.com/your-team/your-project/settings/environment-variables"
echo "2. Click 'Add Variable'"
echo "3. Set Environment: 'Production'"
echo "4. Add each variable:"
echo ""
echo "   Name: STRIPE_SECRET_KEY"
echo "   Value: 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"
echo ""
echo "   Name: STRIPE_WEBHOOK_SECRET"
echo "   Value: whsec_... (from Stripe Dashboard)"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "Next Steps"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "1. Configure Stripe webhook endpoint in Stripe Dashboard"
echo "   URL: https://your-production-domain.com/api/billing/webhook"
echo "   Events: checkout.session.completed, customer.subscription.*, invoice.*"
echo ""
echo "2. Copy the webhook signing secret (starts with whsec_)"
echo ""
echo "3. Set environment variables using CLI or Dashboard"
echo ""
echo "4. Trigger a new deployment:"
echo "   vercel --prod"
echo ""
echo "5. Verify deployment:"
echo "   ./scripts/verify-production-deployment.sh"
echo ""
