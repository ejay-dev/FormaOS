# Stripe Quick Reference Card

## Your Production Credentials

### API Keys
```
Secret Key (STRIPE_SECRET_KEY):
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

Publishable Key (for future use):
pk_live_51So0iKAHrAKKo3OlCSmRI4Lib1pOdTWYDFSy3mieSnd0apBKxaF0df8JBhAKqghdYCvm5kYAbekD1pOwE9T8cYp0001FGQAAyJ
```

### Products

| Product | Product ID | Price ID | Plan Key |
|---------|------------|----------|----------|
| **FormaOS Starter** | `prod_TlYcT9NzUiYJvD` | `price_1So1UsAHrAKKo3OlrgiqfEcc` | `basic` |
| **FormaOS Pro** | `prod_TlYdsbaz7QsjA7` | `price_1So1VmAHrAKKo3OlP6k9TMn4` | `pro` |

## Verification Status

✅ **Price IDs in code MATCH exactly**

File: `lib/billing/stripe.ts` lines 6-9
```typescript
const DEFAULT_PRICE_IDS = {
  basic: "price_1So1UsAHrAKKo3OlrgiqfEcc",  // ✅ Correct
  pro: "price_1So1VmAHrAKKo3OlP6k9TMn4",     // ✅ Correct
};
```

## Deployment Steps (Vercel)

1. **Set Environment Variables:**
   ```
   STRIPE_SECRET_KEY=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
   STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Dashboard)
   ```

2. **Configure Stripe Webhook:**
   - URL: `https://your-domain.com/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`
   - Copy signing secret to `STRIPE_WEBHOOK_SECRET`

3. **Verify:**
   - Test checkout flow
   - Check `/admin/revenue` shows "🟢 Live Mode"
   - Verify MRR calculation matches Stripe Dashboard

## Quick Links

- [Full Verification Report](./STRIPE_CONFIGURATION_VERIFICATION.md)
- [Deployment Guide](./STRIPE_DEPLOYMENT_GUIDE.md)
- [Stripe Dashboard](https://dashboard.stripe.com)

## Code Locations

| What | Where |
|------|-------|
| Price ID defaults | `lib/billing/stripe.ts` |
| Checkout creation | `app/app/actions/billing.ts` |
| Webhook handler | `app/api/billing/webhook/route.ts` |
| MRR dashboard | `app/admin/revenue/page.tsx` |

## Common Issues

**Webhook not working?**
- Check URL is correct in Stripe Dashboard
- Verify `STRIPE_WEBHOOK_SECRET` in Vercel
- Review Vercel function logs

**Wrong mode showing?**
- Check `STRIPE_SECRET_KEY` starts with `sk_live_`
- Restart Vercel deployment after setting env vars

**MRR showing $0?**
- Verify active subscriptions in Stripe Dashboard
- Check webhook events are being received
- Review `billing_events` table in database

## Security Reminders

⚠️ Never commit `.env.local` to git  
⚠️ Never expose `STRIPE_SECRET_KEY` client-side  
✅ Publishable key is safe for client-side use  
✅ Use test mode keys (`sk_test_*`) for development
