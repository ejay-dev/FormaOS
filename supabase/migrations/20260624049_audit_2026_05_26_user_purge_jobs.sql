-- Audit 2026-05-26 — P0-8: GDPR Right-to-Erasure ledger.
--
-- One row per purge request. The /api/admin/users/[userId]/gdpr-purge
-- endpoint inserts a 'pending' row; a cron processor picks it up,
-- runs the table-by-table delete/anonymize cascade defined in
-- docs/audit/2026-05-26-gdpr-purge-user-decision-matrix.md, and
-- updates the row with the per-table outcome.
--
-- Service-role-only at the RLS layer — end-users have no business
-- inspecting purge ledger rows for themselves or anyone else.

CREATE TABLE IF NOT EXISTS public.user_purge_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL,
  status          text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','running','completed','partial','failed','refused')),
  requested_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason          text NOT NULL,
  request_source  text NOT NULL DEFAULT 'admin',
  requested_at    timestamptz NOT NULL DEFAULT now(),
  started_at      timestamptz,
  completed_at    timestamptz,
  -- table_counts is { "<table>": { "action": "delete"|"anonymize"|"skipped", "rows": <int>, "error": "<msg>"? } }
  table_counts    jsonb NOT NULL DEFAULT '{}'::jsonb,
  failed_step     text,
  error_message   text,
  refuse_reason   text,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_purge_jobs_status
  ON public.user_purge_jobs (status, requested_at)
  WHERE status IN ('pending','running');

CREATE INDEX IF NOT EXISTS idx_user_purge_jobs_user_id
  ON public.user_purge_jobs (user_id);

ALTER TABLE public.user_purge_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purge_jobs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_purge_jobs_service_only ON public.user_purge_jobs;
CREATE POLICY user_purge_jobs_service_only
  ON public.user_purge_jobs
  AS PERMISSIVE
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE public.user_purge_jobs IS
  'P0-8: GDPR Right-to-Erasure ledger. Each row tracks one purge from request to completion. table_counts JSON holds per-table action + row counts so partial failures surface in the admin UI rather than silently going lost.';
