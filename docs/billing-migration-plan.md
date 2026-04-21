# Billing Migration Plan

This checklist prepares FormaOS for the public pricing shift from casual SaaS access to compliance-infrastructure buying.

The safe production path is intentionally backward-compatible: keep database plan keys as `basic`, `pro`, and `enterprise` for now, while displaying and selling them publicly as Foundation, Growth, and Enterprise.

## 1. Current Stripe Products And Prices In Code

Product IDs are not hardcoded in the repository. Only Stripe price IDs are present.

| Public plan | Internal plan key | Current fallback price ID | Preferred env var | Backward-compatible env var |
| --- | --- | --- | --- | --- |
| Foundation | `basic` | `price_1So1UsAHrAKKo3OlrgiqfEcc` | `STRIPE_PRICE_FOUNDATION` | `STRIPE_PRICE_BASIC` |
| Growth | `pro` | `price_1So1VmAHrAKKo3OlP6k9TMn4` | `STRIPE_PRICE_GROWTH` | `STRIPE_PRICE_PRO` |
| Enterprise | `enterprise` | `price_1T9cPKAHrAKKo3OliQN78Q83` | `STRIPE_PRICE_ENTERPRISE` | none |

Legacy catalog references remain for compatibility:

| Legacy catalog key | Preferred env var now supported | Legacy env var |
| --- | --- | --- |
| `starter` | `STRIPE_PRICE_FOUNDATION` | `STRIPE_STARTER_PRICE_ID` |
| `pro` | `STRIPE_PRICE_GROWTH` | `STRIPE_PRO_PRICE_ID` |
| `enterprise` | `STRIPE_PRICE_ENTERPRISE` | `STRIPE_ENTERPRISE_PRICE_ID` |

## 2. Code Paths Depending On Stripe Price IDs

- `lib/billing/stripe.ts` maps internal keys to price IDs and reverse-maps webhook price IDs back to internal keys.
- `app/app/actions/billing.ts` creates server-action Checkout sessions via `getStripePriceId(planKey)`.
- `app/api/billing/checkout/route.ts` creates API Checkout sessions via `getStripePriceId(planId)`.
- `app/api/billing/webhook/route.ts` stores `plan_key`, `price_id`, Stripe customer ID, and Stripe subscription ID from checkout/subscription events.
- `lib/billing/nightly-reconciliation.ts` compares local subscription records against Stripe subscription status and price ID.
- `app/api/admin/subscriptions/[orgId]/resync-stripe/route.ts` rehydrates local state from Stripe price IDs.
- `lib/billing/plans.ts` exposes a legacy catalog used by `lib/billing.ts` and `/api/billing`.

## 3. New Stripe Products And Prices To Create

Create or confirm these production Stripe Prices:

| Public plan | Stripe product recommendation | Price behavior | Internal mapping |
| --- | --- | --- | --- |
| Foundation | `FormaOS Foundation` | AUD `$297/month` recurring | maps to `basic` |
| Growth | `FormaOS Growth` | AUD `$1,800/month` recurring | maps to `pro` |
| Enterprise | `FormaOS Enterprise` | Sales-led/custom by default | maps to `enterprise` only if direct checkout remains enabled |

Enterprise recommendation: keep Enterprise sales-led/invoiced unless the owner explicitly wants direct checkout. Public CTAs currently route Enterprise buyers to demo/sales/procurement flows, not checkout.

## 4. Expected Plan Behavior After Migration

- Foundation: controlled entry path. Public site routes to `Start Assessment`; direct checkout should only be exposed inside the authenticated billing area if the owner intentionally allows direct purchase.
- Growth: primary commercial plan. Public site routes to `Get Compliance Plan`; direct checkout may remain available in-app for already-qualified users.
- Enterprise: procurement-led plan. Public site routes to `Book Demo`, `Talk to Sales`, or security/procurement review.

New Checkout sessions from `app/app/actions/billing.ts` no longer set `trial_period_days`.

## 5. Legacy Subscriptions And Grandfathering

Existing customers may have:

- old Stripe price IDs
- local `plan_key` values of `basic`, `pro`, or `enterprise`
- local subscription rows with `status = 'trialing'`
- old plan labels cached in external Stripe invoices/customer portal history

Recommended grandfathering:

- Do not rename database plan keys during the pricing cutover.
- Leave webhook support for `trialing` status in place until all legacy trialing rows have ended or been manually migrated.
- Keep old fallback price IDs in code until the new env vars are set and verified.
- Do not bulk-change existing Stripe subscriptions unless a customer-specific commercial decision has been made.

## 6. Webhook Behavior That Must Remain

Keep these webhook behaviors intact:

- `checkout.session.completed` must upsert `org_subscriptions` with `organization_id`, `plan_key`, `status`, `stripe_customer_id`, `stripe_subscription_id`, `price_id`, and `current_period_end`.
- `customer.subscription.updated` must keep local status and plan aligned with Stripe.
- `customer.subscription.deleted` must mark subscriptions canceled.
- `invoice.payment_succeeded` must clear billing failure/grace state.
- `invoice.payment_failed` must preserve dunning/grace behavior.
- Existing `customer.subscription.trial_will_end` handling can remain for historical trialing subscriptions, but new checkout should not create new Stripe trials.

## 7. Production Deployment Order

1. Create the new Foundation and Growth prices in production Stripe.
2. Decide whether Enterprise remains sales-only. If sales-only, do not advertise direct Enterprise checkout.
3. Add production Vercel env vars:
   - `STRIPE_PRICE_FOUNDATION=<new_foundation_price_id>`
   - `STRIPE_PRICE_GROWTH=<new_growth_price_id>`
   - `STRIPE_PRICE_ENTERPRISE=<enterprise_price_id>` only if direct Enterprise checkout is intentionally retained.
4. Keep `STRIPE_PRICE_BASIC` and `STRIPE_PRICE_PRO` temporarily as fallback during the first deployment.
5. Deploy the code.
6. Confirm `/pricing`, `/contact`, `/security`, `/compare/vanta`, and `/ndis-providers` route CTAs to guided contact flows.
7. In staging or a controlled production test org, run a Checkout session for Foundation and Growth if direct in-app checkout remains enabled.
8. Confirm Stripe webhook delivery updates `org_subscriptions.price_id` to the new price ID.
9. Confirm customer portal displays the intended new Stripe product/price names.
10. After 24-48 hours with no billing incidents, remove old env vars only if logs confirm the new vars are being used.

## 8. Rollback Plan

If pricing migration fails:

1. Revert `STRIPE_PRICE_FOUNDATION` and `STRIPE_PRICE_GROWTH` in Vercel.
2. Restore `STRIPE_PRICE_BASIC` and `STRIPE_PRICE_PRO` to the known old price IDs.
3. Redeploy or trigger a Vercel env refresh.
4. Disable any public or in-app direct checkout entry points if checkout errors continue.
5. Keep public CTAs routed to contact/sales flows while Stripe is corrected.
6. Reconcile any partially-created subscriptions by checking Stripe customer, subscription, and local `org_subscriptions.price_id`.
7. Use `app/api/admin/subscriptions/[orgId]/resync-stripe/route.ts` only after confirming the Stripe subscription is correct.

## 9. Deferred Naming Cleanup

Deferred intentionally:

- Renaming internal `basic` to `foundation`.
- Renaming internal `pro` to `growth`.
- Renaming legacy `starter` catalog keys.
- Migrating historical `trialing` terminology across admin analytics and customer-health internals.

Reason: those keys are referenced by webhooks, reconciliation, admin tools, tests, entitlements, onboarding, and database rows. A safe rename requires a dedicated migration with compatibility aliases, backfill SQL, test updates, and a rollback script.

TODO for a later dedicated migration:

1. Add compatibility aliases for `foundation` and `growth`.
2. Backfill `organizations.plan_key` and `org_subscriptions.plan_key`.
3. Update webhook price resolution and reconciliation tests.
4. Update admin filters and customer-health labels.
5. Remove old `basic`/`pro` assumptions after one release cycle.
