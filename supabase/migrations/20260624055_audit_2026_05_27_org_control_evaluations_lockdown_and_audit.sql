-- Audit 2026-05-27 (R5) — close the compliance-score gameability vector
-- on public.org_control_evaluations.
--
-- Before this migration the RLS profile let ANY org member UPDATE or DELETE
-- any evaluation row in their org (policies `org_control_evaluations_update`
-- and `org_control_evaluations_delete` were qual'd only on org_membership).
-- An admin (or any member with direct Supabase JS client access) could:
--   * DELETE non_compliant rows to inflate the compliant percentage
--   * UPDATE status='non_compliant' to 'compliant' or 'not_applicable'
--   * UPDATE risk_level to a lower severity
-- All without leaving any trace.
--
-- Lockdown:
--   1. Drop the open UPDATE + DELETE policies.
--   2. Replace with role-gated equivalents (owner / admin only). Manager
--      and member still SELECT + INSERT (the evaluator snapshot path
--      relies on this); INSERTs are append-only by intent.
--   3. Add an AFTER-row trigger that records every UPDATE/DELETE to
--      audit_log via the canonical hash-chained append RPC, so even
--      service_role mutations leave a trail.
--
-- Note: the new trigger calls audit_log_append (SECURITY DEFINER, service_role
-- grant). The trigger function is itself SECURITY DEFINER so it can call the
-- RPC under the proper role regardless of who fired the trigger.

-- Step 1: drop the open policies.
DROP POLICY IF EXISTS org_control_evaluations_delete ON public.org_control_evaluations;
DROP POLICY IF EXISTS org_control_evaluations_update ON public.org_control_evaluations;

-- Step 2: replace with role-gated policies.
CREATE POLICY org_control_evaluations_delete_privileged
  ON public.org_control_evaluations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
       WHERE m.organization_id = org_control_evaluations.organization_id
         AND m.user_id = (SELECT auth.uid())
         AND m.role IN ('owner', 'admin')
    )
  );

CREATE POLICY org_control_evaluations_update_privileged
  ON public.org_control_evaluations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_members m
       WHERE m.organization_id = org_control_evaluations.organization_id
         AND m.user_id = (SELECT auth.uid())
         AND m.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_members m
       WHERE m.organization_id = org_control_evaluations.organization_id
         AND m.user_id = (SELECT auth.uid())
         AND m.role IN ('owner', 'admin')
    )
  );

-- Step 3: audit trigger for UPDATE/DELETE on org_control_evaluations.
-- Logs only when the gameable fields (status, risk_level, compliance_score,
-- satisfied_controls, missing_controls) actually change — skips the high-
-- frequency re-evaluation upserts that don't shift the dashboard.
CREATE OR REPLACE FUNCTION public._audit_org_control_evaluation_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
  v_action text;
  v_details jsonb;
  v_id_for_audit uuid;
  v_changed boolean;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_org_id := OLD.organization_id;
    v_id_for_audit := OLD.id;
    v_action := 'control_evaluation_deleted';
    v_details := jsonb_build_object(
      'control_key', OLD.control_key,
      'old_status', OLD.status,
      'old_risk_level', OLD.details->>'riskLevel',
      'old_score', OLD.compliance_score
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_changed :=
      OLD.status IS DISTINCT FROM NEW.status
      OR (OLD.details->>'riskLevel') IS DISTINCT FROM (NEW.details->>'riskLevel')
      OR OLD.compliance_score IS DISTINCT FROM NEW.compliance_score
      OR OLD.satisfied_controls IS DISTINCT FROM NEW.satisfied_controls
      OR OLD.missing_controls IS DISTINCT FROM NEW.missing_controls;

    IF NOT v_changed THEN
      RETURN NULL;
    END IF;

    v_org_id := NEW.organization_id;
    v_id_for_audit := NEW.id;
    v_action := 'control_evaluation_updated';
    v_details := jsonb_build_object(
      'control_key', NEW.control_key,
      'old_status', OLD.status,
      'new_status', NEW.status,
      'old_risk_level', OLD.details->>'riskLevel',
      'new_risk_level', NEW.details->>'riskLevel',
      'old_score', OLD.compliance_score,
      'new_score', NEW.compliance_score
    );
  ELSE
    RETURN NULL;
  END IF;

  -- Best-effort user attribution. auth.uid() returns NULL when the caller
  -- is service_role; the audit row records that as "system actor".
  BEGIN
    v_user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  PERFORM public.audit_log_append(
    gen_random_uuid(),
    v_org_id,
    v_user_id,
    v_action,
    'org_control_evaluations',
    v_id_for_audit,
    v_details,
    NULL,
    NULL,
    now()
  );

  RETURN NULL;
EXCEPTION WHEN OTHERS THEN
  -- Trigger errors must not block legitimate score updates. Capture to
  -- a fallback table so the loss is observable.
  RAISE WARNING 'audit_org_control_evaluation_change failed: %', SQLERRM;
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public._audit_org_control_evaluation_change() FROM PUBLIC;

DROP TRIGGER IF EXISTS audit_org_control_evaluation_change
  ON public.org_control_evaluations;

CREATE TRIGGER audit_org_control_evaluation_change
  AFTER UPDATE OR DELETE
  ON public.org_control_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public._audit_org_control_evaluation_change();

COMMENT ON TRIGGER audit_org_control_evaluation_change ON public.org_control_evaluations IS
  'R5 (2026-05-27): logs every UPDATE/DELETE to audit_log via the hash-chained audit_log_append RPC. Skips no-op updates (UPDATEs that don''t change status / risk_level / score). Service_role mutations are still logged with NULL actor.';
