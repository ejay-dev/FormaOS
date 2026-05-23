-- v4-010: 3 tenant tables have RLS enabled with ZERO policies.
--
-- Audit-traced 2026-05-23:
--   org_certifications  — RLS=true, 0 policies, 0 rows
--   org_entities        — RLS=true, 0 policies, 0 rows
--   org_entity_members  — RLS=true, 0 policies, 0 rows
--
-- Today no data is leaking because all 3 tables are empty. But the
-- moment a feature ships that uses any of these tables from a session-
-- scoped Supabase client, reads return [] and writes silently fail —
-- only service_role bypasses RLS. This is the same shape that hit
-- control_evidence in v2-rls-001 (rows backfilled, dashboard saw 0).
--
-- Fix: mirror the v2-rls-001 policy pattern that landed for
-- control_evidence. SELECT for any org member; INSERT/UPDATE/DELETE
-- gated by role.
--
-- Role tiers (same as control_evidence):
--   write set  = owner, admin, manager, compliance_officer, staff, member
--   modify set = owner, admin, manager, compliance_officer
--
-- For all 3 target tables, every existing row is admin-written today
-- (the tables are empty), so retroactive visibility is moot.

BEGIN;

-- org_certifications -------------------------------------------------

DROP POLICY IF EXISTS org_certifications_org_member_select ON public.org_certifications;
CREATE POLICY org_certifications_org_member_select ON public.org_certifications
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.organization_id = org_certifications.organization_id
      AND om.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS org_certifications_org_writer_insert ON public.org_certifications;
CREATE POLICY org_certifications_org_writer_insert ON public.org_certifications
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.organization_id = org_certifications.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager', 'compliance_officer', 'staff', 'member')
  ));

DROP POLICY IF EXISTS org_certifications_org_writer_update ON public.org_certifications;
CREATE POLICY org_certifications_org_writer_update ON public.org_certifications
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.organization_id = org_certifications.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager', 'compliance_officer')
  ));

DROP POLICY IF EXISTS org_certifications_org_writer_delete ON public.org_certifications;
CREATE POLICY org_certifications_org_writer_delete ON public.org_certifications
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.organization_id = org_certifications.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager', 'compliance_officer')
  ));

-- org_entities -------------------------------------------------------

DROP POLICY IF EXISTS org_entities_org_member_select ON public.org_entities;
CREATE POLICY org_entities_org_member_select ON public.org_entities
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.organization_id = org_entities.organization_id
      AND om.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS org_entities_org_writer_insert ON public.org_entities;
CREATE POLICY org_entities_org_writer_insert ON public.org_entities
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.organization_id = org_entities.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager', 'compliance_officer', 'staff', 'member')
  ));

DROP POLICY IF EXISTS org_entities_org_writer_update ON public.org_entities;
CREATE POLICY org_entities_org_writer_update ON public.org_entities
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.organization_id = org_entities.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager', 'compliance_officer')
  ));

DROP POLICY IF EXISTS org_entities_org_writer_delete ON public.org_entities;
CREATE POLICY org_entities_org_writer_delete ON public.org_entities
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.organization_id = org_entities.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager', 'compliance_officer')
  ));

-- org_entity_members -------------------------------------------------

DROP POLICY IF EXISTS org_entity_members_org_member_select ON public.org_entity_members;
CREATE POLICY org_entity_members_org_member_select ON public.org_entity_members
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.organization_id = org_entity_members.organization_id
      AND om.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS org_entity_members_org_writer_insert ON public.org_entity_members;
CREATE POLICY org_entity_members_org_writer_insert ON public.org_entity_members
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.organization_id = org_entity_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager', 'compliance_officer', 'staff', 'member')
  ));

DROP POLICY IF EXISTS org_entity_members_org_writer_update ON public.org_entity_members;
CREATE POLICY org_entity_members_org_writer_update ON public.org_entity_members
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.organization_id = org_entity_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager', 'compliance_officer')
  ));

DROP POLICY IF EXISTS org_entity_members_org_writer_delete ON public.org_entity_members;
CREATE POLICY org_entity_members_org_writer_delete ON public.org_entity_members
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE om.organization_id = org_entity_members.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin', 'manager', 'compliance_officer')
  ));

COMMIT;
