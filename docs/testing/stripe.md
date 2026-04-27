# Stripe CLI Billing Testing

Stripe testing must use Stripe test mode. Do not use live money or live price IDs for local/CI tests.

## Required Test Env

- `STRIPE_SECRET_KEY` with a test-mode key
- `STRIPE_WEBHOOK_SECRET` from the local Stripe CLI listener
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` with a test-mode key
- plan price IDs for the current FormaOS mapping

Keep live production keys out of local test commands.

## CLI Listener

```bash
stripe listen --forward-to localhost:3000/api/billing/webhook
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Events To Exercise

Use Stripe CLI fixtures or dashboard test mode to cover:

- Foundation checkout
- Growth payment link
- customer portal handoff
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `invoice.payment_failed`
- webhook signature validation failure
- `plan_key` mapping
- legacy `basic`/`pro` compatibility

Example trigger:

```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

## Expected Behavior

- checkout routes must require authentication and org membership
- webhook route must reject invalid signatures
- plan changes must be idempotent
- billing portal should fail safely when Stripe is not configured
- billing E2E must not create live charges

## Recommended Local Flow

1. Start the app with Stripe test env.
2. Run `stripe listen --forward-to localhost:3000/api/billing/webhook`.
3. Run `npm run test:e2e:billing`.
4. Trigger webhook lifecycle events with the Stripe CLI.
5. Verify org subscription state and audit/security logs.
