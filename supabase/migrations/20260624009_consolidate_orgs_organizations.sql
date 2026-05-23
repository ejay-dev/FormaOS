-- v3-010 consolidation: orgs ↔ organizations drift.
--
-- ⚠️  ALREADY APPLIED IN PRODUCTION (2026-05-23). DO NOT RE-RUN.
--
-- v4-031 disposition note: an audit flagged the lack of a backup-table
-- path in front of the destructive DELETEs in steps 1 and 2. That gap
-- is moot for production (the rows are already gone — there is nothing
-- left to back up), but a fresh `supabase db reset` against a populated
-- environment would still wipe ~3,211 control_tasks + ~1,077 orgs rows
-- with no archive. The numeric pre-conditions in the comment below
-- were specific to the production snapshot at apply time — they will
-- almost certainly not match any other environment. Treat this file
-- as historical record; any future re-consolidation needs a fresh
-- audit + a `CREATE TABLE … AS SELECT …` archive step before the
-- DELETEs.
--
-- Audit-traced 2026-05-22 (re-verified 2026-05-23 in prod):
--   3017 orgs rows in BOTH tables (canonical)
--   1077 orgs-only rows: empty test fixtures, 0 FK refs across the 8
--         dependent tables (memberships, org_audit_log, org_files,
--         org_industries, org_memberships, org_module_entitlements,
--         org_notifications, org_subscriptions all have 0 rows)
--    395 organizations-only rows: real workspaces that lost their `orgs`
--         mirror due to silent dual-write failures in
--         bootstrapOrganizationAtomic / ensureOrgProvisioning
--   3211 control_tasks rows where organization_id resolves to nothing:
--          10 → 1 orgs-only fixture (Audit Ready Enterprise)
--        3201 → 250 org_ids missing from BOTH tables, AND task_id
--               missing from `tasks` (junction rows orphaned both ways)
--
-- Approach (single transaction):
--   1) Delete 3211 broken control_tasks junction rows
--   2) Delete 1077 orphan orgs rows
--   3) Backfill 395 missing orgs rows from organizations
--   4) Add the missing FK on control_tasks.organization_id so this drift
--      class cannot recur
--
-- The 8 dependent `orgs` FK tables already point at organization_ids that
-- exist in BOTH tables (verified 0 references to the 1077-row cohort);
-- migrating them to `organizations` is a separate Phase B PR.

BEGIN;

-- 1. Clear broken control_tasks junction rows.
DELETE FROM public.control_tasks ct
WHERE ct.organization_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.organizations org WHERE org.id = ct.organization_id
  );

-- 2. Delete orphan orgs rows (verified 0 FK refs).
DELETE FROM public.orgs o
WHERE NOT EXISTS (
  SELECT 1 FROM public.organizations org WHERE org.id = o.id
);

-- 3. Backfill missing orgs rows from organizations.
INSERT INTO public.orgs (id, name, created_by, created_at, updated_at)
SELECT
  org.id,
  COALESCE(NULLIF(org.name, ''), 'Organization'),
  org.created_by,
  org.created_at,
  now()
FROM public.organizations org
WHERE NOT EXISTS (SELECT 1 FROM public.orgs o WHERE o.id = org.id)
ON CONFLICT (id) DO NOTHING;

-- 4. Add the FK that should have existed from day one.
ALTER TABLE public.control_tasks
  ADD CONSTRAINT control_tasks_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES public.organizations(id)
  ON DELETE CASCADE;

COMMIT;
