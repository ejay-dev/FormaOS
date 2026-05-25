-- Audit 2026-05-26 — covering index on audit_log(org_id, created_at).
--
-- Background (Database M3): the chain table only has a left-prefix
-- index via UNIQUE(org_id, sequence_number). Queries that filter by
-- `org_id` + `created_at` (the most common pattern for the audit-
-- trail UI, security event timeline, GDPR export, and the new
-- audit-chain-verify cron) cannot use it efficiently because
-- created_at is not in the index.
--
-- The `idx_audit_log_org` and `idx_audit_log_created` indexes from
-- 20260403000 cover each column separately but force a sort step
-- after the bitmap scan when both are needed. A combined index
-- short-circuits both.
--
-- DESC on created_at because every reader sorts most-recent-first.

CREATE INDEX IF NOT EXISTS audit_log_org_created_at_idx
  ON public.audit_log (org_id, created_at DESC);
