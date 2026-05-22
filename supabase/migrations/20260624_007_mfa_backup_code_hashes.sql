-- Audit auth-001 (P0, 2026-05-22): MFA backup codes were stored as
-- plaintext in user_security.backup_codes (text[]) and verified with a
-- plaintext `.includes(token)` lookup. Any DB compromise, leaked dump,
-- support tooling, or backup gives an attacker permanent TOTP bypass
-- for every MFA-enrolled user.
--
-- Forward fix lands in lib/security.ts: codes are now hashed via Node's
-- crypto.scrypt with a per-code random salt, stored as
-- `scrypt$<base64-salt>$<base64-hash>` strings in a new
-- `backup_code_hashes text[]` column. verify2FAToken iterates hashes
-- and uses scrypt + timingSafeEqual.
--
-- This migration:
--   1. Adds backup_code_hashes column (NOT NULL DEFAULT '{}').
--   2. Clears existing plaintext rows — existing MFA-enrolled users
--      lose their pre-fix backup codes (intentional: those codes were
--      already at risk under the plaintext exposure). Users who try to
--      use an old backup code will be told to regenerate via the MFA
--      settings page.
--   3. Adds an index on user_id (already PK, no-op but documented).

BEGIN;

ALTER TABLE public.user_security
  ADD COLUMN IF NOT EXISTS backup_code_hashes text[] NOT NULL DEFAULT '{}';

-- Invalidate the pre-fix plaintext codes. Anyone who needs MFA backup
-- codes after this migration must regenerate. The application-side
-- verify2FAToken stops checking the plaintext column going forward.
UPDATE public.user_security
SET backup_codes = '{}'::text[]
WHERE cardinality(COALESCE(backup_codes, '{}'::text[])) > 0;

COMMENT ON COLUMN public.user_security.backup_code_hashes IS
  'scrypt-hashed MFA backup codes (audit auth-001, 2026-05-22). Format: scrypt$<base64-salt>$<base64-hash>';

COMMENT ON COLUMN public.user_security.backup_codes IS
  'DEPRECATED 2026-05-22 (audit auth-001). Plaintext column retained for schema-stability; new writes go to backup_code_hashes. Drop in a future migration once all clients have rotated.';

COMMIT;
