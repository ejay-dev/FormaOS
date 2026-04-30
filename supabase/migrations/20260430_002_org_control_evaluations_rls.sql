-- Org control evaluations: enable RLS and add tenant-isolation policies.
--
-- The original migration that created public.org_control_evaluations
-- (20250308_create_org_control_evaluations.sql) left RLS unset and added no
-- policies. None of the seven later migrations that touch the table fixed
-- this. The result was a cross-tenant read/write hole: any authenticated user
-- could SELECT, INSERT, UPDATE or DELETE evaluations for any organization
-- (audit P0 finding #2 in docs/deep-codebase-audit.md).
--
-- This migration is idempotent: re-running it is safe.

BEGIN;

-- Ensure RLS is on (no-op if already enabled).
ALTER TABLE public.org_control_evaluations ENABLE ROW LEVEL SECURITY;

-- Drop any pre-existing policies of the same names so we can re-create with
-- the canonical predicates.
DROP POLICY IF EXISTS org_control_evaluations_select
  ON public.org_control_evaluations;
DROP POLICY IF EXISTS org_control_evaluations_insert
  ON public.org_control_evaluations;
DROP POLICY IF EXISTS org_control_evaluations_update
  ON public.org_control_evaluations;
DROP POLICY IF EXISTS org_control_evaluations_delete
  ON public.org_control_evaluations;

-- SELECT: members of the same organization can read evaluations.
CREATE POLICY org_control_evaluations_select
  ON public.org_control_evaluations
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

-- INSERT: members can create evaluations for their own org.
CREATE POLICY org_control_evaluations_insert
  ON public.org_control_evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

-- UPDATE: members can update evaluations for their own org. Both USING
-- (existing-row predicate) and WITH CHECK (post-update predicate) are set
-- so a member cannot move an evaluation to a different org.
CREATE POLICY org_control_evaluations_update
  ON public.org_control_evaluations
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

-- DELETE: members can delete evaluations for their own org.
CREATE POLICY org_control_evaluations_delete
  ON public.org_control_evaluations
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

COMMIT;
