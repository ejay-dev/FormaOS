-- Audit 2026-05-27 — R1: subject-identifier ledger for export-time redaction.
--
-- Background: P0-8 ships a GDPR purge that hard-deletes user_id from
-- auth.users + cascades through every user-owned table. But the
-- hash-chained audit_log + org_audit_logs rows are RETAINED at-rest
-- (Q4 of the decision matrix) because mutating them breaks
-- verifyChainIntegrity — which is a customer-facing product feature.
--
-- That creates a follow-on problem: when a customer later exports
-- their audit data for an external auditor, a purged subject's name +
-- email still appear inside the audit rows (the row content was
-- recorded BEFORE the purge). GDPR Art. 17 covers every copy that
-- leaves the system, not just at-rest data, so the export pipeline
-- has to redact.
--
-- This table captures the subject identifiers BEFORE
-- auth.admin.deleteUser runs. The redactor (lib/audit/redact-purged-
-- subjects.ts) loads every active row once per export job, walks
-- each row's text + jsonb fields, and replaces matches with a
-- constant `[redacted-by-erasure-request]` marker. At-rest data is
-- never mutated; the chain stays whole; the export is GDPR-clean.

CREATE TABLE IF NOT EXISTS public.purged_subject_redactions (
  user_id            uuid PRIMARY KEY,
  email              text,
  full_name          text,
  -- Phone, ABN/TFN, employee id, etc. — JSONB so future PII fields
  -- don't need a schema migration. Each value is a string the
  -- redactor will match word-bounded against export rows.
  extra_identifiers  jsonb NOT NULL DEFAULT '[]'::jsonb,
  purge_job_id       uuid REFERENCES public.user_purge_jobs(id) ON DELETE SET NULL,
  purged_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purged_subject_redactions_purged_at
  ON public.purged_subject_redactions (purged_at DESC);

-- Email lookups happen on every export tick; lowercase index keeps
-- the redactor's loader cheap.
CREATE INDEX IF NOT EXISTS idx_purged_subject_redactions_email_lower
  ON public.purged_subject_redactions ((lower(email)))
  WHERE email IS NOT NULL;

ALTER TABLE public.purged_subject_redactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purged_subject_redactions FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS purged_subject_redactions_service_only
  ON public.purged_subject_redactions;
CREATE POLICY purged_subject_redactions_service_only
  ON public.purged_subject_redactions
  AS PERMISSIVE
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Per the immutability invariant established in P0-1, redactions
-- themselves must not be silently mutated. UPDATE and DELETE are
-- blocked at the policy layer — the only legitimate paths are
-- (a) INSERT by processUserPurge, and (b) authorised ops-side
-- restoration via an explicit migration if a purge is ever reversed.
CREATE POLICY purged_subject_redactions_no_update
  ON public.purged_subject_redactions
  AS RESTRICTIVE
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY purged_subject_redactions_no_delete
  ON public.purged_subject_redactions
  AS RESTRICTIVE
  FOR DELETE
  USING (false);

COMMENT ON TABLE public.purged_subject_redactions IS
  'R1 (Audit 2026-05-27): subject identifiers captured immediately before auth.admin.deleteUser runs, so the export pipeline can redact PII out of audit rows that are retained at-rest for chain integrity. RESTRICTIVE no-UPDATE/no-DELETE policies enforce append-only.';
