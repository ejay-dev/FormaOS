-- =====================================================
-- Fix org_care_plans RLS: explicit USING + WITH CHECK
-- =====================================================
-- Root cause:
--   The 20260214_fix_all_supabase_warnings.sql migration rebuilds each
--   RLS policy programmatically by reading pg_policies.qual (USING) and
--   pg_policies.with_check (WITH CHECK). For policies declared as
--   `FOR ALL USING (x)` without an explicit WITH CHECK, Postgres stores
--   with_check as NULL — the rebuilder then emits the new policy with
--   only USING, losing the implicit WITH CHECK.
--
--   This affected org_care_plans: SELECTs passed (USING matched) but
--   UPDATEs failed with 42501 because no WITH CHECK was in effect once
--   the policy was recreated.
--
-- Fix:
--   DROP and CREATE the policy with both USING and WITH CHECK set
--   explicitly to the same tenancy predicate. Same auth.uid() wrapping
--   style as the rest of the codebase ((select auth.uid())) so it stays
--   initplan-safe and does not trigger the auth_rls_initplan warning.

BEGIN;

DROP POLICY IF EXISTS "care_plans_org_isolation" ON public.org_care_plans;

CREATE POLICY "care_plans_org_isolation" ON public.org_care_plans
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
