# Stripe Production Deployment Guide

## Quick Reference

**Your Stripe Credentials:**

| Item | Value | Where to Set |
|------|-------|--------------|
| Secret Key | `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` | Vercel Environment Variables |
| Publishable Key | `pk_live_51So0iKAHrAKKo3OlCSmRI4Lib1pOdTWYDFSy3mieSnd0apBKxaF0df8JBhAKqghdYCvm5kYAbekD1pOwE9T8cYp0001FGQAAyJ` | Not currently used* |
| Starter Product | `prod_TlYcT9NzUiYJvD` | Reference only |
| Starter Price | `price_1So1UsAHrAKKo3OlrgiqfEcc` | ✅ Already in code |
| Pro Product | `prod_TlYdsbaz7QsjA7` | Reference only |
| Pro Price | `price_1So1VmAHrAKKo3OlP6k9TMn4` | ✅ Already in code |

*The publishable key is available for future client-side integration if needed.

## ✅ Verification Status

**Price IDs:** ✅ **ALREADY CORRECT** in code (`lib/billing/stripe.ts`)

No code changes needed - the hardcoded price IDs exactly match your Stripe products.

## Deployment Steps

### 1. Set Vercel Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add the following:

```bash
# Required - Stripe Secret Key
STRIPE_SECRET_KEY=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

# Required - Stripe Webhook Secret (get from step 2)
STRIPE_WEBHOOK_SECRET=whsec_... (obtain in step 2 below)
```

**Optional overrides** (code has defaults):
```bash
STRIPE_PRICE_BASIC=price_1So1UsAHrAKKo3OlrgiqfEcc
STRIPE_PRICE_PRO=price_1So1VmAHrAKKo3OlP6k9TMn4
```

### 2. Configure Stripe Webhook

Go to: **Stripe Dashboard → Developers → Webhooks**

1. Click **"Add endpoint"**
2. Set **Endpoint URL** to: `https://your-production-domain.com/api/billing/webhook`
3. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Click **"Add endpoint"**
5. **Copy the webhook signing secret** (starts with `whsec_`)
6. Add it to Vercel as `STRIPE_WEBHOOK_SECRET`

### 3. Verify Products in Stripe Dashboard

Go to: **Stripe Dashboard → Products**

Confirm these products exist:

| Product Name | Product ID | Price ID | Plan in Code |
|--------------|------------|----------|--------------|
| FormaOS Starter | `prod_TlYcT9NzUiYJvD` | `price_1So1UsAHrAKKo3OlrgiqfEcc` | `basic` |
| FormaOS Pro | `prod_TlYdsbaz7QsjA7` | `price_1So1VmAHrAKKo3OlP6k9TMn4` | `pro` |

### 4. Test the Integration

After deployment:

1. **Test Checkout Flow:**
   - Navigate to billing/subscription page
   - Initiate checkout for Starter plan
   - Complete payment (use Stripe test card: `4242 4242 4242 4242`)
   - Verify subscription created in Stripe Dashboard
   - Verify subscription synced to database

2. **Test Webhook:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Click on your webhook endpoint
   - Click "Send test webhook"
   - Select `customer.subscription.updated`
   - Verify webhook received (check Vercel logs)

3. **Verify MRR Calculation:**
   - Navigate to `/admin/revenue`
   - Verify MRR shows correct amount from Stripe
   - Should show "🟢 Live Mode" badge

## Environment-Specific Configuration

### Production (Vercel)
```env
STRIPE_SECRET_KEY=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
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Dashboard)
```

### Development (.env.local)
```env
# Use TEST mode keys for development
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

## Troubleshooting

### Webhook Not Receiving Events

1. Check webhook URL is correct in Stripe Dashboard
2. Verify `STRIPE_WEBHOOK_SECRET` is set in Vercel
3. Check Vercel function logs for errors
4. Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/billing/webhook`

### Subscription Not Syncing

1. Check Vercel logs for webhook processing errors
2. Verify `STRIPE_SECRET_KEY` is correct
3. Check database for `billing_events` table entries
4. Review `/api/billing/webhook/route.ts` logs

### MRR Not Showing Correctly

1. Navigate to `/admin/revenue`
2. Check badge shows "🟢 Live Mode" (not Test Mode)
3. Verify `STRIPE_SECRET_KEY` starts with `sk_live_`
4. Check Stripe Dashboard for active subscriptions
5. Review `/api/admin/overview` response

## Security Checklist

- [ ] ✅ `STRIPE_SECRET_KEY` set in Vercel (not in code)
- [ ] ✅ `STRIPE_WEBHOOK_SECRET` set in Vercel
- [ ] ✅ Never commit `.env.local` to git
- [ ] ✅ Webhook endpoint uses HTTPS (not HTTP)
- [ ] ✅ Price IDs in code match Stripe Dashboard
- [ ] ✅ Test mode keys used for development
- [ ] ✅ Live mode keys only in production

## Additional Resources

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)

## Support

If you encounter issues:

1. Check Vercel function logs
2. Review Stripe Dashboard → Events for webhook deliveries
3. Verify all environment variables are set
4. Test with Stripe CLI for local development
5. Review code in `lib/billing/stripe.ts` and `app/api/billing/webhook/route.ts`
