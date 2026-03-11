-- =========================================================
-- SHA-256 Checksums on Evidence
-- =========================================================
-- Add checksum column to org_evidence for tamper-evident
-- chain-of-custody verification on all uploaded artifacts.

DO $$ BEGIN
  ALTER TABLE org_evidence ADD COLUMN IF NOT EXISTS checksum TEXT;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

COMMENT ON COLUMN org_evidence.checksum IS 'SHA-256 hex digest computed client-side before upload. Used for tamper-evidence verification.';
