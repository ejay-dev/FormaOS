-- Audit 2026-05-26 — P1-A: atomic backup-code consumption.
--
-- Background: verify2FAToken in lib/security.ts read user_security.backup_code_hashes,
-- scrypt-matched the user-supplied code against each stored hash in JS, then
-- ran a separate UPDATE setting backup_code_hashes to the filtered array.
-- Two concurrent verifies of the same backup code both pass the match in JS
-- before either UPDATE commits, and both UPDATEs end up with the same final
-- array — meaning the same backup code is consumed twice. That's a hard
-- single-use violation and effectively a 2FA bypass under contention.
--
-- Fix: a single SECURITY DEFINER RPC that removes the specific hash atomically
-- via `UPDATE ... SET = array_remove(..., $hash) WHERE $hash = ANY(...)`. The
-- WHERE filter guarantees only one concurrent caller will match and observe
-- the removal; the other(s) match no row and the function returns false.

CREATE OR REPLACE FUNCTION public.consume_backup_code_hash(
  p_user_id uuid,
  p_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_was_present boolean;
BEGIN
  UPDATE public.user_security
  SET backup_code_hashes = array_remove(backup_code_hashes, p_hash)
  WHERE user_id = p_user_id
    AND p_hash = ANY(backup_code_hashes)
  RETURNING true INTO v_was_present;

  RETURN COALESCE(v_was_present, false);
END;
$$;

-- Supabase grants EXECUTE on every public function to anon + authenticated
-- by default, and REVOKE FROM PUBLIC does NOT touch those explicit role
-- grants. Revoke them by name so this RPC is callable only by service_role.
REVOKE ALL ON FUNCTION public.consume_backup_code_hash(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consume_backup_code_hash(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.consume_backup_code_hash(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consume_backup_code_hash(uuid, text) TO service_role;

COMMENT ON FUNCTION public.consume_backup_code_hash(uuid, text) IS
  'Atomically consumes a single backup-code hash from user_security.backup_code_hashes. '
  'Returns true if the hash was present (and is now removed); false otherwise. '
  'Designed to be race-safe under concurrent 2FA verification — only one caller '
  'observes the removal even when both pass the JS-side scrypt match.';
