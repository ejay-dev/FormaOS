-- v3-010 consolidation: orgs ↔ organizations drift.
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
