-- v4-023: four more SQL-layer security holes the audit flagged.
--
-- 1. update_session_heartbeat — SECURITY DEFINER, granted to
--    authenticated, but only checks `WHERE user_id = p_user_id` in
--    the UPDATE/INSERT. The caller controls p_user_id, so any
--    logged-in user can extend or revive another user's session.
--    Add an explicit auth.uid() = p_user_id gate.
--
-- 2. reset_automation_flags — SECURITY DEFINER, granted to
--    authenticated, no membership check. Any logged-in user can
--    flip review_task_created / renewal_task_created / etc on any
--    org's evidence/policies/tasks/certifications by id. Add an
--    org_members membership gate that resolves the row's org_id
--    and verifies the caller belongs to it.
--
-- 3. org_form_submissions_insert — public-form branch only
--    requires `form.status='published' AND requires_auth IS NOT
--    true`. It does NOT verify that the submission's org_id
--    matches the form's org_id. A public form for org A could be
--    used to write submission rows attributed to org B (poisoning
--    metrics + audit + scorecard). Add `org_id = f.org_id` to
--    the WITH CHECK.
--
-- 4. api_key_usage_log_service_insert — re-applied in
--    20260624004_schema_drift_resolution.sql as `FOR INSERT WITH
--    CHECK (true)` without role scoping. That regressed the
--    role-scoped policy from 20260430005. Restore the
--    `auth.role() = 'service_role'` gate so only the backend can
--    write usage rows.

-- ------------------------------------------------------------------
-- 1. update_session_heartbeat — auth.uid() gate
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_session_heartbeat(
  p_session_id TEXT,
  p_user_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Caller must be the user whose heartbeat is being updated.
  -- service_role bypasses (auth.uid() is null for it).
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'update_session_heartbeat: caller % may not heartbeat another user', auth.uid()
      USING ERRCODE = '42501';
  END IF;

  UPDATE public.active_sessions
  SET last_seen_at = now()
  WHERE session_id = p_session_id
    AND user_id = p_user_id
    AND revoked_at IS NULL;

  IF NOT FOUND THEN
    INSERT INTO public.active_sessions (session_id, user_id)
    VALUES (p_session_id, p_user_id)
    ON CONFLICT (session_id) DO UPDATE
    SET last_seen_at = now();
  END IF;
END;
$$;

-- ------------------------------------------------------------------
-- 2. reset_automation_flags — membership gate per entity_type
-- ------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reset_automation_flags(
  entity_type TEXT,
  entity_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Resolve the row's organization_id so we can require the
  -- caller to be a member. service_role bypasses (no auth.uid()).
  CASE entity_type
    WHEN 'evidence' THEN
      SELECT organization_id INTO v_org_id FROM public.org_evidence WHERE id = entity_id;
    WHEN 'policy' THEN
      SELECT organization_id INTO v_org_id FROM public.org_policies WHERE id = entity_id;
    WHEN 'task' THEN
      SELECT organization_id INTO v_org_id FROM public.org_tasks WHERE id = entity_id;
    WHEN 'certification' THEN
      SELECT organization_id INTO v_org_id FROM public.org_certifications WHERE id = entity_id;
    ELSE
      RAISE EXCEPTION 'Invalid entity type: %', entity_type;
  END CASE;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'reset_automation_flags: % % not found', entity_type, entity_id
      USING ERRCODE = 'P0002';
  END IF;

  IF auth.uid() IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.org_members
       WHERE organization_id = v_org_id AND user_id = auth.uid()
     )
  THEN
    RAISE EXCEPTION 'reset_automation_flags: caller is not a member of org %', v_org_id
      USING ERRCODE = '42501';
  END IF;

  CASE entity_type
    WHEN 'evidence' THEN
      UPDATE public.org_evidence SET renewal_task_created = FALSE WHERE id = entity_id;
    WHEN 'policy' THEN
      UPDATE public.org_policies SET review_task_created = FALSE WHERE id = entity_id;
    WHEN 'task' THEN
      UPDATE public.org_tasks SET escalation_sent = FALSE WHERE id = entity_id;
    WHEN 'certification' THEN
      UPDATE public.org_certifications SET renewal_task_created = FALSE WHERE id = entity_id;
  END CASE;
END;
$$;

-- ------------------------------------------------------------------
-- 3. org_form_submissions_insert — require submission org_id to
--    match the parent form's org_id (closes cross-tenant
--    submission poisoning).
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS "org_form_submissions_insert" ON public.org_form_submissions;
CREATE POLICY "org_form_submissions_insert" ON public.org_form_submissions
  FOR INSERT
  WITH CHECK (
    -- Authenticated-org-member path: caller is a member of the
    -- submission's org AND the form belongs to that same org.
    (
      org_id IN (
        SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM public.org_forms f
        WHERE f.id = form_id AND f.org_id = org_form_submissions.org_id
      )
    )
    -- Public-form path: anyone can submit, BUT the submission's
    -- org_id must equal the form's org_id (no cross-tenant write).
    OR EXISTS (
      SELECT 1 FROM public.org_forms f
      WHERE f.id = form_id
        AND f.org_id = org_form_submissions.org_id
        AND f.status = 'published'
        AND (f.settings->>'requires_auth')::boolean IS NOT TRUE
    )
  );

-- ------------------------------------------------------------------
-- 4. api_key_usage_log_service_insert — restore role gate.
-- ------------------------------------------------------------------
DROP POLICY IF EXISTS api_key_usage_log_service_insert ON public.api_key_usage_log;
CREATE POLICY api_key_usage_log_service_insert
  ON public.api_key_usage_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);
