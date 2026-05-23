-- Sprint 6a — make the Scale tier sellable.
--
-- The 2026-05-23 audit deep-dive caught that `scale` was advertised in
-- marketing for $1,800/mo but unsellable at the DB level: the
-- org_subscriptions_plan_key_check CHECK constraint rejected any row
-- with plan_key='scale'. End-to-end:
--
--   1. STRIPE_PRICE_SCALE was already in productionRequiredKeys
--      (scripts/check-env.js:65) — env scaffolding ready.
--   2. STRIPE_PRICE_ENV['scale'] = 'STRIPE_PRICE_FOUNDATION'... wait
--      no, that's basic. Scale maps to STRIPE_PRICE_SCALE (lib/plans.ts
--      already correct).
--   3. PLAN_CATALOG.scale exists with $1,800 monthly (lib/plans.ts).
--   4. The DB CHECK rejected it. THIS migration fixes that.
--
-- Also tightens documentation: the existing comment on the constraint
-- (added by 20260616_org_subscriptions_plan_key_check.sql) implied the
-- catalog was basic|pro|enterprise. After this migration that's wrong.

ALTER TABLE public.org_subscriptions
  DROP CONSTRAINT IF EXISTS org_subscriptions_plan_key_check;

ALTER TABLE public.org_subscriptions
  ADD CONSTRAINT org_subscriptions_plan_key_check
  CHECK (plan_key = ANY (ARRAY['basic'::text, 'pro'::text, 'scale'::text, 'enterprise'::text]));

COMMENT ON CONSTRAINT org_subscriptions_plan_key_check ON public.org_subscriptions IS
  'Audit Sprint 6a (2026-05-23): scale tier added so the marketed '
  '$1,800/mo Scale plan is actually writable. Requires '
  'STRIPE_PRICE_SCALE env var set in production — see scripts/check-env.js '
  'productionRequiredKeys.';
