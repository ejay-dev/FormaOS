-- Audit 2026-05-27 (R6) — expose supabase_migrations.schema_migrations to
-- service_role via a SECURITY DEFINER RPC so scripts/snapshot-migration-ledger.mjs
-- can snapshot the ledger into supabase/.migration-ledger-snapshot.json without
-- needing direct Postgres connection credentials.
--
-- The ledger is otherwise invisible to PostgREST because the schema isn't in
-- the exposed schemas list. service_role bypasses RLS but PostgREST still
-- rejects "schema not in api.schemas" at the protocol level.
--
-- Read-only. Returns the two columns the alignment check cares about.

CREATE OR REPLACE FUNCTION public.list_migration_ledger()
RETURNS TABLE(version text, name text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = supabase_migrations, public, pg_temp
STABLE
AS $$
  SELECT version, name
  FROM supabase_migrations.schema_migrations
  ORDER BY version;
$$;

REVOKE EXECUTE ON FUNCTION public.list_migration_ledger() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_migration_ledger() FROM anon;
REVOKE EXECUTE ON FUNCTION public.list_migration_ledger() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.list_migration_ledger() TO service_role;

COMMENT ON FUNCTION public.list_migration_ledger() IS
  'R6 (2026-05-27): exposes supabase_migrations.schema_migrations to service_role for the ledger-alignment diagnostic. Read-only; no parameters; service-role-only.';
