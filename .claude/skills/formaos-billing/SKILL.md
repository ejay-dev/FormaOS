---
name: formaos-billing
description: Work with FormaOS billing, subscriptions, and payments via Stripe. Use when modifying pricing plans (Starter, Pro, Enterprise), checkout flows, subscription management, Stripe webhooks, trial enforcement, metered billing, or payment-related features. Also use when debugging billing issues or adding new plan tiers.
---

# FormaOS Billing & Subscription Engineering

## Architecture Overview

- **Stripe** integration with live production keys
- **Plans:** Starter/Basic, Pro, Enterprise
- **Trial periods** with enforcement logic
- **Stripe Webhooks** for subscription lifecycle events
- **Checkout sessions** for plan upgrades
- **Vercel function timeout:** 60s for billing routes

## Key Files & Directories

| Area | Path |
|------|------|
| Billing logic | `lib/billing.ts` |
| Billing UI | `app/app/billing/`, `components/billing/` |
| Checkout API | `app/api/billing/checkout/` |
| Stripe webhooks | `app/api/billing/webhook/` |
| Subscription management | `app/api/billing/subscription/` |
| Admin subscription oversight | `app/api/admin/subscriptions/` |
| Plan pricing migration | `supabase/migrations/20250321_update_plan_pricing.sql` |
| Billing E2E tests | `e2e/` (billing-related specs) |

## Workflow

### Modifying Plans or Pricing
1. Read `lib/billing.ts` for current plan definitions
2. Update plan metadata and pricing
3. Create a Supabase migration if plan data is stored in DB
4. Update Stripe product/price IDs in environment config
5. Update billing UI in `components/billing/`
6. Test checkout flow end-to-end
7. Verify webhook handling for plan changes

### Adding a New Billing Feature
1. Implement logic in `lib/billing.ts`
2. Add API route in `app/api/billing/`
3. Add UI in `app/app/billing/` or `components/billing/`
4. Verify Stripe webhook handling covers new events
5. Test trial → paid → cancelled lifecycle
6. Run billing-related tests

### Debugging Billing Issues
1. Check Stripe webhook logs (Stripe dashboard)
2. Verify webhook signature validation in `app/api/billing/webhook/`
3. Check `lib/billing.ts` subscription status logic
4. Verify Stripe API keys in environment
5. Check Vercel function logs for timeout issues (60s limit)
6. Verify trial period enforcement logic

## Stripe Webhook Events to Handle

- `checkout.session.completed` — new subscription created
- `customer.subscription.updated` — plan change, renewal
- `customer.subscription.deleted` — cancellation
- `invoice.payment_succeeded` — successful payment
- `invoice.payment_failed` — failed payment / dunning

## Rules

- **Stripe keys are live/production** — test changes carefully
- **Always verify webhook signatures** — never trust unverified webhook payloads
- **Billing routes get 60s timeout** — configured in `vercel.json`
- **Trial enforcement is server-side** — never rely on client-side checks
- **Plan changes must be idempotent** — webhooks can be delivered multiple times
- **Never log full Stripe objects** — they may contain PII/payment data
- **Subscription status is source of truth** from Stripe, not local DB
- **Always handle edge cases:** expired trials, failed payments, downgrade paths
- **Test the full lifecycle:** trial → checkout → active → cancel → resubscribe
