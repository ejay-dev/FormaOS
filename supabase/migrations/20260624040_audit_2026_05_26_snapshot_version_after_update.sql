-- Audit 2026-05-26 — move org_care_plans_snapshot_version trigger
-- from BEFORE UPDATE to AFTER UPDATE.
--
-- Background (Database M6): the trigger from 20260624002 fires BEFORE
-- UPDATE on org_care_plans, which means it writes a version snapshot
-- row even when the UPDATE itself is rejected (e.g. by RLS or a
-- constraint). The result is phantom version rows for changes that
-- never actually happened to the source table.
--
-- AFTER UPDATE fires only after the row mutation succeeded — so
-- snapshots correspond 1:1 with real changes. The trigger body uses
-- OLD.* (the previous values), which both BEFORE and AFTER triggers
-- expose, so no body changes are required.

DROP TRIGGER IF EXISTS org_care_plans_version_on_update
  ON public.org_care_plans;

CREATE TRIGGER org_care_plans_version_on_update
  AFTER UPDATE ON public.org_care_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.org_care_plans_snapshot_version();
