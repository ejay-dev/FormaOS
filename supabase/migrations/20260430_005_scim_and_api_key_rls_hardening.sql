-- SCIM and api_key_usage_log RLS hardening.
--
-- 20260311_scim_provisioning.sql:44-46 created blanket policies on
-- scim_tokens, scim_groups, scim_group_members of the form
--
--     CREATE POLICY <table>_service ON public.<table>
--       FOR ALL USING (true) WITH CHECK (true);
--
-- The intent was "service-role only", but USING (true) is a no-op predicate;
-- once any role can reach the table, every row is readable and writable.
-- The fix is to gate the policy on the request being made via the service
-- role (`current_setting('role') = 'service_role'`) rather than blanket-
-- allowing every authenticated context.
--
-- 20260315_api_keys.sql:86-90 likewise allowed any caller to INSERT into
-- api_key_usage_log via WITH CHECK (true). That permits anyone with a
-- valid auth.uid() to poison the API key audit log; we restrict it to the
-- service role here.
--
-- Audit P1 findings #16 and #17 in docs/deep-codebase-audit.md.

BEGIN;

-- ---- SCIM ----

DROP POLICY IF EXISTS scim_tokens_service        ON public.scim_tokens;
DROP POLICY IF EXISTS scim_groups_service        ON public.scim_groups;
DROP POLICY IF EXISTS scim_group_members_service ON public.scim_group_members;

CREATE POLICY scim_tokens_service
  ON public.scim_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY scim_groups_service
  ON public.scim_groups
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY scim_group_members_service
  ON public.scim_group_members
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ---- API key usage log ----

DROP POLICY IF EXISTS api_key_usage_log_service_insert ON public.api_key_usage_log;

CREATE POLICY api_key_usage_log_service_insert
  ON public.api_key_usage_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

COMMIT;
