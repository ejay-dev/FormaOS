-- Audit 2026-05-26 — FORCE ROW LEVEL SECURITY on tenant tables.
--
-- Background: 819 call sites use the service-role admin client. Every
-- one bypasses RLS, so tenant isolation depends entirely on each call
-- adding `.eq('org_id', X)` manually. The Database audit flagged this
-- as the #2 systemic risk: a single missed filter (or a buggy migration
-- writer that uses the owner role directly) reads or writes across
-- tenants.
--
-- FORCE ROW LEVEL SECURITY changes this so even the table OWNER role
-- (the `postgres` user used by migrations + some direct ops) is bound
-- by the policies. The `service_role` role still bypasses via its
-- BYPASSRLS attribute (BYPASSRLS is independent of FORCE) — so the
-- application's admin-client paths continue to work. What changes:
--
--   * Owner-role direct writes (e.g. a Supabase SQL editor session
--     run with postgres credentials) now go through the policies.
--   * Trigger functions declared without SECURITY DEFINER no longer
--     escape RLS by virtue of running "as the table owner."
--
-- We FORCE on every table that already has RLS enabled AND whose
-- name starts with `org_` (the project's convention for tenant-
-- scoped tables) OR is in a known-tenant allowlist. Non-tenant
-- tables (frameworks, framework_controls, control_mappings, etc.)
-- are deliberately skipped — they're shared catalogues, not
-- per-org data.

DO $$
DECLARE
  rec record;
  forced_count integer := 0;
BEGIN
  FOR rec IN
    SELECT
      c.oid::regclass::text AS qualified_name,
      n.nspname AS schemaname,
      c.relname AS tablename
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relrowsecurity = TRUE       -- RLS enabled
      AND c.relforcerowsecurity = FALSE -- not yet forced
      AND (
        c.relname LIKE 'org\_%' ESCAPE '\'
        OR c.relname IN (
          'audit_log',
          'audit_logs',
          'api_keys',
          'api_key_usage_log',
          'billing_events_audit',
          'billing_reconciliation_log',
          'team_invitations',
          'memberships',
          'control_attestations',
          'security_audit_log',
          'data_residency_settings',
          'directory_sync_configs',
          'directory_sync_runs',
          'directory_sync_events',
          'user_preferences'
        )
      )
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY',
      rec.schemaname,
      rec.tablename
    );
    forced_count := forced_count + 1;
  END LOOP;

  RAISE NOTICE '[force-rls] FORCED RLS on % tenant tables', forced_count;
END $$;

-- Belt-and-braces: post-condition check. Every table whose name starts
-- with `org_` and has RLS enabled MUST now also have FORCE on. If not,
-- the migration above missed a table — fail rather than ship a partial
-- fix.
DO $$
DECLARE
  missing_count integer;
  example text;
BEGIN
  SELECT COUNT(*), MIN(c.relname)
    INTO missing_count, example
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relkind = 'r'
     AND c.relrowsecurity = TRUE
     AND c.relforcerowsecurity = FALSE
     AND c.relname LIKE 'org\_%' ESCAPE '\';

  IF missing_count > 0 THEN
    RAISE EXCEPTION
      'force-rls: % org_* tables still have RLS enabled but not forced (e.g. %)',
      missing_count, example;
  END IF;
END $$;
