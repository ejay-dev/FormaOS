# Production Deployment Runbook

## 🎯 Objective

Deploy FormaOS to production with live Stripe integration.

## ✅ Prerequisites

- [ ] Vercel account with project created
- [ ] Stripe account with live API keys
- [ ] FormaOS Starter product created in Stripe (`prod_TlYcT9NzUiYJvD`)
- [ ] FormaOS Pro product created in Stripe (`prod_TlYdsbaz7QsjA7`)
- [ ] Domain configured (if using custom domain)
- [ ] Database (Supabase) set up and migrated

## 📋 Deployment Checklist

### Phase 1: Pre-Deployment Validation

**1. Verify Local Configuration**

```bash
# Run Stripe configuration validator
./scripts/validate-stripe-config.sh
```

Expected output: All checks pass ✅

**2. Verify Code is Ready**

```bash
# Check for uncommitted changes
git status

# Ensure you're on the correct branch
git branch

# Run linter
npm run lint

# Run type check
npm run type-check

# Run tests
npm test
```

**3. Review Stripe Configuration**

Review the documentation:
- `STRIPE_CONFIGURATION_VERIFICATION.md` - Verification report
- `STRIPE_DEPLOYMENT_GUIDE.md` - Deployment guide
- `STRIPE_QUICK_REFERENCE.md` - Quick reference

Verify price IDs in code match your Stripe products:
- Basic: `price_1So1UsAHrAKKo3OlrgiqfEcc`
- Pro: `price_1So1VmAHrAKKo3OlP6k9TMn4`

### Phase 2: Configure Stripe Webhook

**1. Access Stripe Dashboard**

Go to: https://dashboard.stripe.com/test/webhooks

**2. Create Webhook Endpoint**

- Click **"Add endpoint"**
- Endpoint URL: `https://your-production-domain.com/api/billing/webhook`
- Description: `FormaOS Production Billing Webhook`
- Version: Latest API version

**3. Select Events**

Listen to these events:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.paid`
- ✅ `invoice.payment_failed`

**4. Save and Copy Secret**

- Click **"Add endpoint"**
- Copy the **Webhook signing secret** (starts with `whsec_`)
- Save it securely - you'll need it in Phase 3

### Phase 3: Configure Vercel Environment Variables

**Option A: Using Vercel Dashboard**

1. Go to: https://vercel.com/your-team/your-project/settings/environment-variables
2. Add the following variables for **Production** environment:

| Name | Value |
|------|-------|
| `STRIPE_SECRET_KEY` | `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` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from Phase 2, step 4) |

Optional overrides (code has defaults):
| Name | Value |
|------|-------|
| `STRIPE_PRICE_BASIC` | `price_1So1UsAHrAKKo3OlrgiqfEcc` |
| `STRIPE_PRICE_PRO` | `price_1So1VmAHrAKKo3OlP6k9TMn4` |

**Option B: Using Vercel CLI**

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Set environment variables
vercel env add STRIPE_SECRET_KEY production
# Paste: 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

vercel env add STRIPE_WEBHOOK_SECRET production
# Paste: whsec_... (from Phase 2)
```

Or run the helper script:
```bash
./scripts/setup-vercel-env.sh
```

**3. Verify Variables Are Set**

```bash
# List environment variables
vercel env ls
```

You should see:
- ✅ STRIPE_SECRET_KEY (Production)
- ✅ STRIPE_WEBHOOK_SECRET (Production)

### Phase 4: Deploy to Production

**1. Trigger Deployment**

```bash
# Deploy to production
vercel --prod
```

Or push to your production branch (if auto-deploy is configured):
```bash
git push origin main
```

**2. Monitor Deployment**

- Watch the Vercel deployment logs
- Wait for deployment to complete
- Note the production URL

**3. Check Deployment Status**

Go to Vercel Dashboard and verify:
- ✅ Deployment succeeded
- ✅ No build errors
- ✅ Functions deployed successfully

### Phase 5: Post-Deployment Verification

**1. Run Automated Verification**

```bash
# Replace with your actual production URL
./scripts/verify-production-deployment.sh https://your-production-domain.com
```

**2. Manual Verification Steps**

**A. Verify Stripe Mode Badge**

1. Sign in as founder user
2. Navigate to: `https://your-domain.com/admin/revenue`
3. **Expected:** See "🟢 Live Mode" badge (green, not blue)
4. **Expected:** MRR value matches Stripe Dashboard

**B. Test Webhook**

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select event: `customer.subscription.updated`
5. Click **"Send test webhook"**
6. **Expected:** Webhook returns `200 OK`
7. Check Vercel function logs for processing confirmation

**C. Verify Reconciliation**

1. Navigate to: `https://your-domain.com/admin/revenue/reconciliation`
2. **Expected:** "✓ Revenue Synced" (or minor acceptable delta)
3. Review any discrepancies in `stripe_only` or `db_only`

**D. Test Checkout Flow (Optional but Recommended)**

⚠️ **Warning:** This creates a real subscription with real money!

Consider:
- Use a test account
- Use lowest price tier
- Cancel immediately after verification

Steps:
1. Create a test user account
2. Navigate to billing/subscription page
3. Click "Upgrade to Starter" or "Upgrade to Pro"
4. Complete checkout with real payment method
5. Verify:
   - ✅ Checkout completes successfully
   - ✅ Subscription appears in Stripe Dashboard
   - ✅ Subscription synced to database
   - ✅ User has access to plan features
   - ✅ MRR updated in admin dashboard
6. Cancel the subscription in Stripe Dashboard
7. Verify cancellation syncs to database

### Phase 6: Monitoring

**1. Set Up Alerts**

Monitor these endpoints/events:
- `/api/billing/webhook` - webhook processing
- Stripe Dashboard - failed webhook deliveries
- Vercel logs - function errors
- Database - subscription sync status

**2. Check Daily**

For the first week after deployment:
- [ ] Check webhook delivery success rate in Stripe
- [ ] Review Vercel function logs for errors
- [ ] Verify MRR in admin dashboard
- [ ] Check reconciliation page for drift

**3. Weekly Checks**

After stabilization:
- [ ] Review `/admin/revenue/reconciliation`
- [ ] Verify webhook health
- [ ] Check for failed payments
- [ ] Review subscription churn

## 🚨 Rollback Procedure

If issues are detected:

**1. Immediate Rollback**

```bash
# Revert to previous deployment
vercel rollback
```

Or in Vercel Dashboard:
- Go to Deployments
- Find last working deployment
- Click "Promote to Production"

**2. Switch to Test Mode**

If you need to pause live billing:

```bash
# Temporarily switch to test mode
vercel env rm STRIPE_SECRET_KEY production
vercel env add STRIPE_SECRET_KEY production
# Paste test key: sk_test_...

# Redeploy
vercel --prod
```

**3. Investigate**

- Review Vercel function logs
- Check Stripe webhook delivery logs
- Review database for sync issues
- Check error tracking (Sentry if configured)

## 📞 Support Resources

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Vercel Dashboard:** https://vercel.com
- **Documentation:**
  - `STRIPE_CONFIGURATION_VERIFICATION.md`
  - `STRIPE_DEPLOYMENT_GUIDE.md`
  - `STRIPE_QUICK_REFERENCE.md`

## ✅ Post-Deployment Success Criteria

Your deployment is successful when:

- [x] Vercel deployment completed without errors
- [x] Environment variables set correctly
- [x] Stripe webhook endpoint responding
- [x] Admin dashboard shows "🟢 Live Mode"
- [x] MRR matches Stripe Dashboard
- [x] Reconciliation shows minimal/no drift
- [x] Test checkout flow works (if performed)
- [x] Webhook test successful in Stripe

## 📊 Monitoring Dashboard

After deployment, monitor these metrics:

| Metric | Location | Expected |
|--------|----------|----------|
| Stripe Mode | `/admin/revenue` | 🟢 Live Mode |
| MRR Accuracy | `/admin/revenue` | Matches Stripe |
| Sync Status | `/admin/revenue/reconciliation` | ✓ Synced |
| Webhook Health | Stripe Dashboard | >99% success |
| Active Subs | Stripe vs DB | Match |

---

**Last Updated:** 2026-02-18  
**Version:** 1.0  
**Prepared By:** Deployment Automation
