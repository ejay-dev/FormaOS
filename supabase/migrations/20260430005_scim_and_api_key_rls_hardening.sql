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
-- The fix is to scope the policy TO service_role so only requests made via
-- the service-role JWT match.
--
-- 20260315_api_keys.sql:86-90 likewise allowed any caller to INSERT into
-- api_key_usage_log via WITH CHECK (true). That permits anyone with a
-- valid auth.uid() to poison the API key audit log; we restrict it to the
-- service role here.
--
-- Audit P1 findings #16 and #17 in docs/deep-codebase-audit.md.
--
-- Idempotency: each table block is guarded by an IF EXISTS check on the
-- table itself, so this migration is safe to apply against environments
-- where the upstream provisioning/api-key migrations were never applied
-- (the corresponding fix is a no-op there until those tables exist).

BEGIN;

-- ---- SCIM tokens ----
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'scim_tokens' AND c.relkind = 'r'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS scim_tokens_service ON public.scim_tokens';
    EXECUTE $POLICY$
      CREATE POLICY scim_tokens_service
        ON public.scim_tokens
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
    $POLICY$;
  END IF;
END$$;

-- ---- SCIM groups ----
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'scim_groups' AND c.relkind = 'r'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS scim_groups_service ON public.scim_groups';
    EXECUTE $POLICY$
      CREATE POLICY scim_groups_service
        ON public.scim_groups
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
    $POLICY$;
  END IF;
END$$;

-- ---- SCIM group members ----
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'scim_group_members' AND c.relkind = 'r'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS scim_group_members_service ON public.scim_group_members';
    EXECUTE $POLICY$
      CREATE POLICY scim_group_members_service
        ON public.scim_group_members
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true)
    $POLICY$;
  END IF;
END$$;

-- ---- API key usage log ----
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'api_key_usage_log' AND c.relkind = 'r'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS api_key_usage_log_service_insert ON public.api_key_usage_log';
    EXECUTE $POLICY$
      CREATE POLICY api_key_usage_log_service_insert
        ON public.api_key_usage_log
        FOR INSERT
        TO service_role
        WITH CHECK (true)
    $POLICY$;
  END IF;
END$$;

COMMIT;
