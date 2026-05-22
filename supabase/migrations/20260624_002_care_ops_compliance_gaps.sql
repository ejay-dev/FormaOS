-- Care-ops compliance gaps from the 2026-05-22 deep audit.
--
-- Fixes two P1 findings that are RLS / schema-level (the third — NDIS
-- service date fix — is a code change in lib/care/ndis-claiming.ts):
--
--   * care-ops-002: org_progress_notes UPDATE policy does not enforce
--     lock-after-sign. Any owner/admin/manager/compliance_officer
--     could rewrite a signed clinical note via REST/PostgREST or a
--     future server action. NDIS Practice Standards + Aged Care
--     Quality Standards + AHPRA require signed notes to be immutable
--     (with a separate correction note workflow).
--
--   * care-ops-003: care plans had no version table. UPDATEs to
--     org_care_plans (status, dates, goals jsonb, supports jsonb)
--     overwrote in place with no shadow of the prior content. NDIS
--     Practice Standards Outcome 1.2 / 1.3 require plan content
--     history.
--
-- Both are P1 in the audit report.

BEGIN;

-- =========================================================================
-- 1. org_progress_notes — block UPDATE once the note is signed off
-- =========================================================================
DROP POLICY IF EXISTS "org_progress_notes_update" ON public.org_progress_notes;
CREATE POLICY "org_progress_notes_update"
  ON public.org_progress_notes
  FOR UPDATE
  USING (
    signed_off_by IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = org_progress_notes.organization_id
        AND m.role IN ('owner', 'admin', 'manager', 'compliance_officer')
    )
  )
  WITH CHECK (
    signed_off_by IS NULL
    AND EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = org_progress_notes.organization_id
        AND m.role IN ('owner', 'admin', 'manager', 'compliance_officer')
    )
  );

-- Belt-and-suspenders trigger so a privilege escalation (or future
-- service-role write) can't quietly mutate signed content.
CREATE OR REPLACE FUNCTION public.org_progress_notes_block_signed_updates()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.signed_off_at IS NOT NULL THEN
    -- Allow updates that only touch operational columns (e.g. an admin
    -- attaching an attachment after sign-off). Reject any change to the
    -- clinical content / status / sign-off metadata.
    IF NEW.note_text IS DISTINCT FROM OLD.note_text
       OR NEW.status_tag IS DISTINCT FROM OLD.status_tag
       OR NEW.signed_off_by IS DISTINCT FROM OLD.signed_off_by
       OR NEW.signed_off_at IS DISTINCT FROM OLD.signed_off_at THEN
      RAISE EXCEPTION
        'Signed-off progress notes are immutable. Create a correction note instead. (note_id=%)',
        OLD.id
        USING ERRCODE = '42501'; -- insufficient_privilege
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS org_progress_notes_lock_signed
  ON public.org_progress_notes;
CREATE TRIGGER org_progress_notes_lock_signed
  BEFORE UPDATE ON public.org_progress_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.org_progress_notes_block_signed_updates();

-- =========================================================================
-- 2. org_care_plan_versions — snapshot table for care plan history
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.org_care_plan_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  care_plan_id uuid NOT NULL REFERENCES public.org_care_plans(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  snapshot_json jsonb NOT NULL,
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  change_reason text,
  UNIQUE (care_plan_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_org_care_plan_versions_plan
  ON public.org_care_plan_versions (care_plan_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_org_care_plan_versions_org
  ON public.org_care_plan_versions (organization_id, changed_at DESC);

ALTER TABLE public.org_care_plan_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS org_care_plan_versions_select ON public.org_care_plan_versions;
CREATE POLICY org_care_plan_versions_select
  ON public.org_care_plan_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = org_care_plan_versions.organization_id
    )
  );

-- Versions table is append-only via the trigger below; no INSERT/UPDATE/
-- DELETE policy for authenticated users. service_role bypasses RLS.

-- Trigger: on any UPDATE to org_care_plans, snapshot the OLD row into
-- org_care_plan_versions with a monotonic version_number per plan.
CREATE OR REPLACE FUNCTION public.org_care_plans_snapshot_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_next_version integer;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
    INTO v_next_version
    FROM public.org_care_plan_versions
   WHERE care_plan_id = OLD.id;

  INSERT INTO public.org_care_plan_versions (
    care_plan_id,
    organization_id,
    version_number,
    snapshot_json,
    changed_by,
    change_reason
  ) VALUES (
    OLD.id,
    OLD.organization_id,
    v_next_version,
    to_jsonb(OLD),
    auth.uid(),
    NULL
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS org_care_plans_version_on_update
  ON public.org_care_plans;
CREATE TRIGGER org_care_plans_version_on_update
  BEFORE UPDATE ON public.org_care_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.org_care_plans_snapshot_version();

COMMIT;
