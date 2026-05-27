-- Audit 2026-05-27 — R9: integrity hash on every uploaded evidence file.
--
-- Background: org_evidence rows record file_name, file_path, file_size and
-- file_type, but the file_path is a Supabase Storage object reference —
-- the bytes that live there can change without the evidence row knowing.
-- A storage-bucket compromise (service-role token leak, an admin tool
-- with write access, a misconfigured RLS policy on storage.objects)
-- replaces the file content; the customer's compliance report still
-- references the same evidence row at the same path; no automated check
-- catches the swap.
--
-- Fix: compute SHA-256 over the as-uploaded bytes at upload time, store
-- as a hex string. lib/evidence/verify-file-hash.ts re-downloads + re-
-- hashes on demand and compares. Future ops scan or per-export
-- verification can call the helper.
--
-- New rows: hash is populated by the upload route (R9 wiring).
-- Existing rows: file_hash starts NULL; a separate one-shot backfill
-- job (out of scope here) can stream every storage object once, hash
-- it, and populate the column.

ALTER TABLE public.org_evidence
  ADD COLUMN IF NOT EXISTS file_hash text;

-- Partial index on the rows that already have a hash recorded — the
-- backfill job + the verification scanner both look up by hash to
-- detect duplicate files across the same org.
CREATE INDEX IF NOT EXISTS idx_org_evidence_file_hash
  ON public.org_evidence (file_hash)
  WHERE file_hash IS NOT NULL;

COMMENT ON COLUMN public.org_evidence.file_hash IS
  'R9 (Audit 2026-05-27): SHA-256 hex of the as-uploaded file bytes. Captured by the /api/v1/evidence/upload route; verified on demand by lib/evidence/verify-file-hash.ts. NULL for rows created before the column was added — backfill via a one-shot job.';
