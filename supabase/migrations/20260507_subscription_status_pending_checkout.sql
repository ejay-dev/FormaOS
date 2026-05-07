-- Add `pending_checkout` and `incomplete` to the subscription_status enum.
--
-- Background: the enum was created out-of-band before any in-repo migration
-- (it's present on every environment but no `CREATE TYPE` exists in the
-- migration history). We need both values to support the self-serve Stripe
-- checkout gate:
--
--   * `pending_checkout` — new self-serve user has signed up + completed
--     onboarding, but hasn't paid via Stripe yet. The /app billing gate
--     redirects these orgs to /app/billing?autoCheckout=<plan>.
--   * `incomplete` — Stripe's canonical status for "subscription created but
--     no successful payment". Reserved for parity with Stripe webhooks.
--
-- ALTER TYPE ... ADD VALUE IF NOT EXISTS is idempotent (PG 12+) and cannot
-- run inside a transaction block, so each statement runs on its own.

ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'pending_checkout';
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'incomplete';
