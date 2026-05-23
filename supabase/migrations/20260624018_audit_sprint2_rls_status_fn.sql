-- Sprint 2 — install narrow SECURITY DEFINER function so the CI gate
-- `scripts/check-supabase-rls-contracts.mjs` can actually run its live
-- check.
--
-- Background: the script tried to call `public.exec_sql(sql)` to read
-- pg_class.relrowsecurity, but that RPC was never installed. The script
-- caught the missing-function error and `warn`'d instead of `fail`'d, so
-- every CI run silently passed the live half of the check. The agent
-- audit on 2026-05-23 confirmed this had been dark for the script's
-- entire lifetime.
--
-- A general-purpose `exec_sql(text)` SECURITY DEFINER function is a
-- meaningful privilege-escalation surface (it would let any caller with
-- EXECUTE run arbitrary SQL as the function owner). Instead we install
-- a narrow function that returns only the row we need: table name +
-- rls_enabled flag. Granted EXECUTE to service_role only.

CREATE OR REPLACE FUNCTION public._audit_rls_status()
RETURNS TABLE (table_name text, rls_enabled boolean)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT c.relname::text, c.relrowsecurity
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
  ORDER BY c.relname;
$$;

REVOKE ALL ON FUNCTION public._audit_rls_status() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._audit_rls_status() TO service_role;

COMMENT ON FUNCTION public._audit_rls_status() IS
  'Read-only RLS status reporter for the check-supabase-rls-contracts CI '
  'gate. SECURITY DEFINER + service_role-only EXECUTE so the gate works '
  'without granting broad pg_catalog access. Replaces the missing '
  'exec_sql() RPC the script previously depended on.';
