-- Sprint 1 — data-integrity fixes from the 2026-05-23 full E2E audit.
--
-- Three things go together because they touch the same surfaces and
-- because shipping them as one migration keeps the deploy atomic:
--
--   1. `org_subscriptions.cancel_at_period_end` — column the Stripe
--      webhook already writes (app/api/billing/webhook/route.ts:410)
--      but which never existed in the schema. First production
--      downgrade after `customer.subscription.updated` throws and the
--      webhook is marked failed → Stripe retries forever.
--
--   2. `api_key_usage_log_service_insert` policy was `WITH CHECK true`
--      granted to PUBLIC — any authenticated user could forge usage
--      rows against any org. Replace with an org-scoped check.
--
--   3. `orgs` ↔ `organizations` consolidation backfill. The earlier
--      consolidate_orgs_organizations migration (20260522151444) did
--      not actually consolidate — 91 rows are present in
--      `organizations` but absent from `orgs`. Anything that reads
--      `orgs` (the canonical name post-consolidation) silently 404s
--      for those tenants. Insert the missing rows from `organizations`
--      using the smallest column intersection so any column drift in
--      either table doesn't break the backfill.

-- -----------------------------------------------------------------
-- 1. cancel_at_period_end column on org_subscriptions
-- -----------------------------------------------------------------
ALTER TABLE public.org_subscriptions
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.org_subscriptions.cancel_at_period_end IS
  'Mirrors Stripe Subscription.cancel_at_period_end. Set by the billing '
  'webhook on customer.subscription.updated. Used by the entitlement '
  'gate to flag "scheduled cancellation" in the UI without revoking '
  'access until period end.';

-- -----------------------------------------------------------------
-- 2. api_key_usage_log INSERT policy — was WITH CHECK true (PUBLIC)
-- -----------------------------------------------------------------
DROP POLICY IF EXISTS api_key_usage_log_service_insert ON public.api_key_usage_log;

-- Service-role bypasses RLS anyway, so the practical effect is: no
-- authenticated user role can INSERT (only the admin client / cron /
-- webhook paths that use the service key). If we later need a path
-- where an authenticated client writes its own org's usage row, add
-- a narrowly-scoped policy then — don't open it to PUBLIC.
CREATE POLICY api_key_usage_log_service_insert
  ON public.api_key_usage_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- -----------------------------------------------------------------
-- 3. Backfill orgs ⇐ organizations (91-row drift)
-- -----------------------------------------------------------------
-- Insert only the IDs present in `organizations` but missing from
-- `orgs`. Use the smallest column intersection (id + name + created_at)
-- so adding/removing columns on either table later doesn't break a
-- re-run. ON CONFLICT DO NOTHING makes this idempotent — re-running
-- against an already-backfilled DB is a no-op.
INSERT INTO public.orgs (id, name, created_at)
SELECT o.id, o.name, COALESCE(o.created_at, now())
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.orgs WHERE orgs.id = o.id
)
ON CONFLICT (id) DO NOTHING;
