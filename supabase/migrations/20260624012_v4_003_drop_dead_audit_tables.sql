-- v4-003: drop two dead audit tables that have been masquerading as live
-- for the v4 audit window. Both have 0 rows in prod, no FK references,
-- and (after this PR's e2e spec fix) no remaining writers anywhere in
-- the repo:
--
--   audit_logs       — 0 rows; was written-to by enterprise-government-audit
--                      .spec.ts with a wrong column set (resource_type,
--                      metadata columns never existed there). E2E spec
--                      updated to canonical `org_audit_logs` in same PR.
--   org_audit_log    — 0 rows; was read by lib/reports/widget-data.ts
--                      :149 (Member Activity widget) — also a typo,
--                      fixed in PR #132 (v4-004).
--
-- Canonical tables remain:
--   org_audit_logs   — general activity log (24,580+ rows in prod)
--   audit_log        — tamper-evident chain with entry_hash / prev_hash
--                      (sparse today, v4-005 handles the population gap)
--
-- Both legacy tables also had RLS enabled with non-trivial policies; the
-- DROP TABLE cascades those policies away cleanly.

BEGIN;

DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.org_audit_log;

COMMIT;
