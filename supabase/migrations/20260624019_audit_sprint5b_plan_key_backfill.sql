-- Sprint 5b — backfill organizations.plan_key for the 138 rows that
-- carried NULL despite production code paths assuming every org has a
-- plan. Audit 2026-05-23 deep-dive caught this when consolidating the
-- four plan catalogs.
--
-- Two-step backfill:
--   1. JOIN with org_subscriptions and copy the subscription's plan_key
--      where it exists and is non-null. ~43 rows expected.
--   2. Default the remainder to 'basic' (Foundation). Conservative
--      pick: it's the lowest paid tier, so an org that later turns
--      out to be a real account can upgrade; gives no feature access
--      they wouldn't have already had under the (broken) NULL state.
--      ~95 rows expected, most of which are leftover CI probe
--      organizations from check-db-test-verify.mjs that the script's
--      cleanup didn't catch (separate issue).
--
-- After this migration:
--   * Every public.organizations row has a non-null plan_key.
--   * The CHECK constraint added by 20260616_org_subscriptions_plan_key_check
--     applies to org_subscriptions, not organizations; if we ever add the
--     same CHECK to organizations.plan_key, this backfill must run first.

-- Step 1: borrow plan_key from org_subscriptions where it exists.
UPDATE public.organizations o
SET plan_key = s.plan_key
FROM public.org_subscriptions s
WHERE o.id = s.organization_id
  AND o.plan_key IS NULL
  AND s.plan_key IS NOT NULL;

-- Step 2: default the remainder to Foundation ('basic').
UPDATE public.organizations
SET plan_key = 'basic'
WHERE plan_key IS NULL;

-- Optional: assert no rows remain. Use a CASE expression that throws
-- by referencing 1/0 if any null survives — Postgres evaluates the
-- expression and raises division-by-zero, failing the migration.
DO $$
DECLARE
  null_count integer;
BEGIN
  SELECT COUNT(*) INTO null_count FROM public.organizations WHERE plan_key IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'plan_key backfill failed: % rows still NULL', null_count;
  END IF;
END $$;
