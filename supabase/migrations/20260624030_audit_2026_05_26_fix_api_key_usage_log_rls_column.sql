-- Audit 2026-05-26 — fix broken RLS policy on api_key_usage_log.
--
-- Migration 20260624016 (v4-024 DB schema fixes) introduced an
-- `api_key_usage_log_org_select` policy whose JOIN referenced
-- `k.organization_id`, but `public.api_keys` defines that column
-- as `org_id` (see 20260315001_api_keys.sql and the verbatim replay
-- in 20260624004_schema_drift_resolution.sql). Postgres raises
-- `column k.organization_id does not exist (42703)` at plan time
-- on every authenticated SELECT against api_key_usage_log; only
-- service_role works.
--
-- Fix strategy: replace with a simpler EXISTS over org_members keyed
-- off api_key_usage_log.org_id directly. That column is NOT NULL on
-- the table and is the same value the JOIN would have resolved, so
-- this is semantically equivalent — and avoids re-introducing the
-- column-rename bug. service_role continues to bypass via the
-- existing role-scoped policies on the table.

DROP POLICY IF EXISTS api_key_usage_log_org_select
  ON public.api_key_usage_log;

CREATE POLICY api_key_usage_log_org_select
  ON public.api_key_usage_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.org_members om
      WHERE om.organization_id = api_key_usage_log.org_id
        AND om.user_id = auth.uid()
    )
  );

-- Smoke check: re-emit the policy via pg_policies and verify it
-- references the correct column. This DO block fails the migration
-- if the rebuilt policy still mentions `organization_id` against
-- the api_keys alias (defensive — should be impossible given the
-- statement above, but cheap insurance).
DO $$
DECLARE
  policy_definition text;
BEGIN
  SELECT pg_get_expr(polqual, polrelid)
    INTO policy_definition
    FROM pg_policy
   WHERE polname = 'api_key_usage_log_org_select'
     AND polrelid = 'public.api_key_usage_log'::regclass;

  IF policy_definition IS NULL THEN
    RAISE EXCEPTION 'api_key_usage_log_org_select policy missing after rebuild';
  END IF;

  IF policy_definition LIKE '%api_keys%' THEN
    RAISE EXCEPTION
      'api_key_usage_log_org_select still joins api_keys after rebuild: %',
      policy_definition;
  END IF;
END $$;
