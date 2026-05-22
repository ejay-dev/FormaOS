-- =====================================================
-- Fix org_evidence RLS: explicit USING + WITH CHECK
-- =====================================================
-- Same root cause as 20260617_fix_care_plans_rls_update.sql:
--   The 20260214_fix_all_supabase_warnings.sql migration
--   programmatically rebuilds RLS policies and can lose the
--   implicit WITH CHECK clause on FOR ALL policies.
--
--   Result observed in production: SELECT works, INSERT
--   fails with `42501: new row violates row-level security
--   policy for table "org_evidence"`.
--
-- Fix: declare a single PERMISSIVE FOR ALL policy with both
--   USING and WITH CHECK set explicitly to the per-org
--   tenancy predicate.
--
-- Idempotent.

BEGIN;

-- Drop legacy command-specific policies (originals from
-- 20250312_phase7_core_rls.sql) and any consolidated variants
-- that may have been left over by the warnings-fix sweep.
DROP POLICY IF EXISTS "org_evidence_select" ON public.org_evidence;
DROP POLICY IF EXISTS "org_evidence_insert" ON public.org_evidence;
DROP POLICY IF EXISTS "org_evidence_update" ON public.org_evidence;
DROP POLICY IF EXISTS "org_evidence_delete" ON public.org_evidence;
DROP POLICY IF EXISTS "org_evidence_unified" ON public.org_evidence;
DROP POLICY IF EXISTS "View Evidence" ON public.org_evidence;
DROP POLICY IF EXISTS "Manage Evidence" ON public.org_evidence;
DROP POLICY IF EXISTS "Evidence Access" ON public.org_evidence;

CREATE POLICY "org_evidence_org_isolation" ON public.org_evidence
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = (select auth.uid())
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = (select auth.uid())
    )
  );

COMMIT;
