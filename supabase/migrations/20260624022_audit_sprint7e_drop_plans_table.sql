-- Sprint 7e (2026-05-24) — drop the `plans` table.
--
-- Background: the 2026-05-23 audit deep-dive found the codebase had FIVE
-- plan catalogs:
--   1. lib/plans.ts PLAN_CATALOG (canonical post-Sprint 4b)
--   2. lib/billing/plans.ts SUBSCRIPTION_PLANS (deleted in Sprint 4b)
--   3. lib/system-state/types.ts PlanTier (re-aliased in Sprint 4b)
--   4. components/motion/NodeWireSystem.tsx (re-aliased in Sprint 4b)
--   5. PUBLIC.PLANS — this DB table.
--
-- The DB row had stale prices that disagreed with PLAN_CATALOG:
--   basic     = $159 AUD  (catalog: $297 USD)
--   pro       = $239 AUD  (catalog: $797 USD)
--   starter   = $399 USD  (catalog: doesn't exist — Sprint 4b dropped 'starter')
--   enterprise= NULL      (catalog: 0 / contact-sales)
--
-- Sole consumer: lib/admin/metrics-service.ts used `plans.price_cents` to
-- compute MRR. The codebase change in this PR switches that to read from
-- PLAN_CATALOG so MRR is finally correct. After that switch the table
-- has zero readers and zero FKs (verified via the pg_constraint check
-- below), making this drop safe.
--
-- Idempotent (IF EXISTS).

DO $$
DECLARE
  fk_count integer;
BEGIN
  SELECT COUNT(*) INTO fk_count
  FROM pg_constraint c
  JOIN pg_class t ON t.oid = c.conrelid
  WHERE c.contype = 'f'
    AND pg_get_constraintdef(c.oid) ILIKE '%REFERENCES plans%';

  IF fk_count > 0 THEN
    RAISE EXCEPTION 'Cannot drop public.plans — % FK reference(s) still exist', fk_count;
  END IF;
END $$;

DROP TABLE IF EXISTS public.plans;
