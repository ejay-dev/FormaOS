-- Audit 2026-05-26 — REVOKE EXECUTE on consume_backup_code_hash from the
-- default-granted role pair (anon, authenticated). The RPC was introduced in
-- 20260624045 as SECURITY DEFINER with REVOKE FROM PUBLIC, but Supabase
-- auto-grants EXECUTE on every public function to anon + authenticated so the
-- REVOKE FROM PUBLIC alone leaves the RPC reachable from a client-side JWT.
-- Service role + postgres keep their grants because only the server-side
-- consume_backup_code path needs to call the RPC.
--
-- Originally applied directly via mcp__claude_ai_Supabase__apply_migration on
-- 2026-05-26 (recorded under synthetic ledger version 20260526144149 with no
-- corresponding filesystem file). Adding this file 2026-05-27 so the migration
-- is reproducible against fresh branches.

REVOKE EXECUTE ON FUNCTION public.consume_backup_code_hash(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.consume_backup_code_hash(uuid, text) FROM authenticated;
