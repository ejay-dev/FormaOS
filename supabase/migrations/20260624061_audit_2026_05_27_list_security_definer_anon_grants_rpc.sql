-- Audit 2026-05-27 — helper RPC for the SECURITY DEFINER grants
-- CI gate. Companion to scripts/check-security-definer-grants.mjs.
-- Returns the list of SECDEF functions in public that are still
-- callable by anon or authenticated. The CI gate fails the build
-- when this list contains functions not in
-- scripts/.security-definer-rpc-allowlist.json — i.e. new drift.

CREATE OR REPLACE FUNCTION public.list_security_definer_anon_grants()
RETURNS TABLE (
  function_name text,
  argument_signature text,
  anon_can_execute boolean,
  authenticated_can_execute boolean
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog, pg_temp
STABLE
AS $$
  SELECT
    p.proname::text AS function_name,
    pg_catalog.pg_get_function_identity_arguments(p.oid)::text AS argument_signature,
    pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
    pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute
  FROM pg_catalog.pg_proc p
  JOIN pg_catalog.pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
    AND p.prosecdef = true
    AND (
      pg_catalog.has_function_privilege('anon', p.oid, 'EXECUTE')
      OR pg_catalog.has_function_privilege('authenticated', p.oid, 'EXECUTE')
    )
  ORDER BY p.proname;
$$;

REVOKE EXECUTE ON FUNCTION public.list_security_definer_anon_grants() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_security_definer_anon_grants() TO service_role;

COMMENT ON FUNCTION public.list_security_definer_anon_grants() IS
  'Audit 2026-05-27 CI helper: lists SECURITY DEFINER functions in public callable by anon or authenticated. Read-only, service-role-only. Used by scripts/check-security-definer-grants.mjs.';
