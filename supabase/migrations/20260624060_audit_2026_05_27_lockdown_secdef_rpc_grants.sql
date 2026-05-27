-- Audit 2026-05-27 — close PostgREST exposure of three audit-cycle
-- SECURITY DEFINER functions. Supabase auto-grants EXECUTE on every
-- public function to `anon` + `authenticated` via default privileges
-- at CREATE FUNCTION time; `REVOKE ALL ... FROM PUBLIC` in the source
-- migrations doesn't touch the explicit grants, so the functions
-- remained callable over /rest/v1/rpc/* — flagged by the Supabase
-- security advisor as anon_security_definer_function_executable +
-- authenticated_security_definer_function_executable.
--
-- Same pattern previously broke `consume_backup_code_hash` (fixed in
-- 20260624053). This migration is the same shape for the three
-- functions added later in the cycle.
--
-- Functions covered:
--   1. audit_log_append          (v2 hash-chain RPC, migration 057)
--   2. audit_log_append_v3       (v3-hmac chain RPC, migration 058)
--   3. _audit_org_control_evaluation_change  (R5 trigger handler, 055)
--      — trigger functions don't NEED to be RPC-callable at all, and
--      the previous REVOKE ALL FROM PUBLIC wasn't enough; explicit
--      revoke from anon + authenticated is required.
--
-- Service role retains EXECUTE because the backend (writeAuditLog,
-- the trigger machinery itself) calls these via service_role.

REVOKE EXECUTE ON FUNCTION public.audit_log_append(
  uuid, uuid, uuid, text, text, uuid, jsonb, text, text, timestamptz
) FROM anon, authenticated, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.audit_log_append_v3(
  uuid, uuid, uuid, text, text, uuid, jsonb, text, text, timestamptz, bytea
) FROM anon, authenticated, PUBLIC;

REVOKE EXECUTE ON FUNCTION public._audit_org_control_evaluation_change()
  FROM anon, authenticated, PUBLIC;
