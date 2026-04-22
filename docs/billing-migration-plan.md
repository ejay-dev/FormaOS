# Billing Migration Plan

This checklist prepares FormaOS for the public pricing shift from casual SaaS access to compliance-infrastructure buying.

The safe production path is intentionally backward-compatible: keep database plan keys as `basic`, `pro`, and `enterprise` for now, while displaying and selling them publicly as Foundation, Growth, and Enterprise.

## 1. Current Stripe Products And Prices In Code

Product IDs are not hardcoded in the repository. Only Stripe price IDs are present.

| Public plan | Internal plan key | Current fallback price ID | Preferred env var | Deprecated legacy env var |
| --- | --- | --- | --- | --- |
| Foundation | `basic` | `price_1TOdz1AHrAKKo3OlfYxjk9WL` | `STRIPE_PRICE_FOUNDATION` | `STRIPE_PRICE_BASIC` |
| Growth | `pro` | `price_1TOe05AHrAKKo3OliCrZNnkx` | `STRIPE_PRICE_GROWTH` | `STRIPE_PRICE_PRO` |
| Enterprise | `enterprise` | `price_1T9cPKAHrAKKo3OliQN78Q83` | `STRIPE_PRICE_ENTERPRISE` | none |

Legacy catalog env names remain documented only so operators can remove or mirror them safely:

| Legacy catalog key | Preferred env var | Deprecated legacy env var |
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

Foundation is publicly self-serve via an authenticated signup handshake. Growth is sales-led. Enterprise is procurement-led via Stripe Invoicing. No anonymous Payment Link is exposed on the marketing site, because the webhook requires `organization_id` in session metadata to provision.

| Public plan | Buying motion | Public CTA | Destination | Payment instrument |
| --- | --- | --- | --- | --- |
| Foundation | Public self-serve | `Start Assessment` | `/auth/signup?plan=basic&intent=checkout&source=pricing` → signup → auto-redirect into Stripe Checkout after org bootstrap | Stripe Checkout Session via `startCheckout` |
| Growth | Sales-led | `Get Compliance Plan` | `/contact?type=compliance-plan` → demo | Stripe Payment Link sent by sales post-demo |
| Enterprise | Procurement-led | `Book Demo` | `/contact?type=enterprise` → demo + review | Stripe Invoicing (custom contract) |

Foundation self-serve handshake:

1. Visitor clicks the Foundation CTA on `/pricing`.
2. Browser lands on [app/auth/signup/page.tsx](../app/auth/signup/page.tsx) with `?plan=basic&intent=checkout`. The page stashes a short-lived `formaos_checkout_intent` cookie (30 minute TTL) keyed by the plan, gated by [lib/billing/checkout-intent.ts](../lib/billing/checkout-intent.ts) — only `basic` is in `SELF_SERVE_PLANS`.
3. The user completes email verification + organization bootstrap.
4. On first authenticated hit to `/app`, the cookie is read, cleared, and `startCheckout` from [app/app/actions/billing.ts](../app/app/actions/billing.ts) is invoked server-side. That call attaches `session.metadata.organization_id` so the webhook at [app/api/billing/webhook/route.ts](../app/api/billing/webhook/route.ts) provisions correctly.
5. The button in [components/billing/BillingActionButtons.tsx](../components/billing/BillingActionButtons.tsx) clears the cookie after checkout is kicked off to prevent re-entry loops.

Implementation notes:

- Only `basic` (Foundation) is in the `SELF_SERVE_PLANS` set. Adding Growth or Enterprise requires a separate product decision and would need their own commercial gating.
- Growth Payment Links are stored server-side as `STRIPE_PAYMENT_LINK_GROWTH`. It is **never** exposed to the browser (no `NEXT_PUBLIC_*` variant). The sales team references it from internal tooling only. Foundation does not need a Payment Link — its flow uses an authenticated Checkout Session instead.
- Authenticated in-app upgrades (`/app/billing`) continue to use Stripe Checkout Sessions via `startCheckout`, which sets `session.metadata.organization_id` so the webhook provisions correctly. Foundation self-serve reuses this same server action.
- Enterprise has no Payment Link. Stripe Invoicing is driven from the Stripe dashboard after contract close.
- New Checkout sessions from `app/app/actions/billing.ts` no longer set `trial_period_days`. Stripe Payment Links must also be configured with no trial.
- **Do not** introduce `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_FOUNDATION`: anonymous Payment Link buyers have no `organization_id` in session metadata, so the webhook silently skips provisioning. The authenticated signup → checkout handshake exists precisely to avoid that failure mode.

## 5. Legacy Subscriptions And Grandfathering

Existing customers may have:

- old Stripe price IDs
- local `plan_key` values of `basic`, `pro`, or `enterprise`
- local subscription rows with `status = 'trialing'`
- old plan labels cached in external Stripe invoices/customer portal history

Recommended grandfathering:

- Do not rename database plan keys during the pricing cutover.
- Leave webhook support for `trialing` status in place until all legacy trialing rows have ended or been manually migrated.
- Remove stale compatibility env names during the cutover, or mirror them to the current Foundation and Growth price IDs for operator clarity. Active checkout no longer depends on them.
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

1. Confirm the active Foundation and Growth prices in production Stripe.
2. Create (or confirm) the three Stripe billing instruments:
   - Foundation: recurring **Price** for `$297/mo` with no trial (checkout is driven by `startCheckout`, not a Payment Link).
   - Growth: internal **Payment Link** for `$1,800/mo` (sent post-demo), no trial, metadata `plan_key=pro`.
   - Enterprise: **Stripe Invoicing** — no Payment Link, no direct checkout.
3. Add production Vercel env vars:
   - `STRIPE_PRICE_FOUNDATION=price_1TOdz1AHrAKKo3OlfYxjk9WL`
   - `STRIPE_PRICE_GROWTH=price_1TOe05AHrAKKo3OliCrZNnkx`
   - `STRIPE_PRICE_ENTERPRISE=<enterprise_price_id>` only if direct Enterprise checkout is intentionally retained.
   - `STRIPE_PAYMENT_LINK_GROWTH=<growth_payment_link_url>` (server-only, internal sales reference).
4. Remove or mirror `STRIPE_PRICE_BASIC` and `STRIPE_PRICE_PRO`; active checkout uses `STRIPE_PRICE_FOUNDATION`, `STRIPE_PRICE_GROWTH`, or the current code fallback IDs.
5. Deploy the code.
6. Smoke-test the public funnel on production:
   - `/pricing` — Foundation CTA opens `/auth/signup?plan=basic&intent=checkout&source=pricing`.
   - `/pricing` — Growth CTA opens `/contact?type=compliance-plan`.
   - `/pricing` — Enterprise CTA opens `/contact?type=enterprise`.
   - `/contact`, `/security`, `/compare/vanta`, `/ndis-providers` CTAs route to guided contact or signup flows.
7. Run an end-to-end Foundation self-serve purchase in production with a test card: sign up fresh, complete email verification + org bootstrap, confirm auto-redirect into Stripe Checkout, complete payment, and confirm webhook delivery updates `org_subscriptions.price_id` and `plan_key=basic`.
8. Confirm `customer.subscription.created` + `checkout.session.completed` correctly provision the org and email the welcome sequence.
9. Confirm customer portal displays the intended new Stripe product/price names.
10. After 24-48 hours with no billing incidents, remove old env vars only if logs confirm the new vars are being used.

## 8. Rollback Plan

If pricing migration fails:

1. Revert `STRIPE_PRICE_FOUNDATION` and `STRIPE_PRICE_GROWTH` in Vercel to the last known-good Stripe prices.
2. If Foundation self-serve checkout is failing repeatedly, temporarily point the Foundation CTA in [lib/marketing/pricing.ts](../lib/marketing/pricing.ts) at `/contact?type=assessment&plan=foundation&source=pricing` and redeploy. Growth and Enterprise are already sales-led so no public Payment Link env needs to be unset. Instruct sales to stop sending the Growth Payment Link until Stripe is corrected.
3. Mirror any remaining legacy `STRIPE_PRICE_BASIC` and `STRIPE_PRICE_PRO` values for operator clarity, but rollbacks should use the preferred env vars above.
4. Redeploy or trigger a Vercel env refresh.
5. Disable any public or in-app direct checkout entry points if checkout errors continue.
6. Keep public CTAs routed to contact/sales flows while Stripe is corrected.
7. Reconcile any partially-created subscriptions by checking Stripe customer, subscription, and local `org_subscriptions.price_id`.
8. Use `app/api/admin/subscriptions/[orgId]/resync-stripe/route.ts` only after confirming the Stripe subscription is correct.

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
