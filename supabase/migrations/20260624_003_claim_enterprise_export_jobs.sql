-- claim_enterprise_export_jobs: atomic claim RPC for enterprise exports.
--
-- Audit cron-001 (P1, 2026-05-22): the /api/cron/enterprise-exports
-- handler did a plain SELECT WHERE status='pending' LIMIT N then a
-- sequential loop calling processEnterpriseExportJob(j.id). Between
-- SELECT and the first status UPDATE inside processEnterpriseExportJob,
-- the row stays 'pending', so a second cron tick (Vercel 5xx retry) —
-- or a parallel caller in /api/internal/trigger/enterprise-export,
-- /api/exports/enterprise/[jobId], lib/queue/processor.ts — could pick
-- up the same job and re-run the export. Result: duplicate Supabase
-- storage upload, duplicate URL, wasted Vercel function minutes.
--
-- Mirror the sibling RPC `claim_compliance_export_jobs`
-- (migration 20260209_compliance_export_queue.sql): UPDATE ... FROM
-- (SELECT ... FOR UPDATE SKIP LOCKED) so two concurrent callers see
-- disjoint candidate sets and never both claim the same row.

BEGIN;

-- Add the lock-tracking columns if they don't already exist (mirrors
-- 20260209's defensive ALTER on compliance_export_jobs).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'enterprise_export_jobs'
  ) THEN
    ALTER TABLE public.enterprise_export_jobs
      ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS next_run_at timestamptz DEFAULT now(),
      ADD COLUMN IF NOT EXISTS locked_at timestamptz,
      ADD COLUMN IF NOT EXISTS locked_by text,
      ADD COLUMN IF NOT EXISTS last_error text;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.claim_enterprise_export_jobs(
  p_limit integer,
  p_worker_id text
)
RETURNS SETOF public.enterprise_export_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT id
    FROM public.enterprise_export_jobs
    WHERE status = 'pending'
      AND (next_run_at IS NULL OR next_run_at <= now())
      AND (locked_at IS NULL OR locked_at < now() - interval '15 minutes')
    ORDER BY created_at ASC
    LIMIT GREATEST(p_limit, 0)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.enterprise_export_jobs AS jobs
  SET status = 'processing',
      locked_at = now(),
      locked_by = p_worker_id,
      started_at = COALESCE(jobs.started_at, now()),
      attempt_count = COALESCE(jobs.attempt_count, 0) + 1,
      last_error = NULL
  FROM candidates
  WHERE jobs.id = candidates.id
  RETURNING jobs.*;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_enterprise_export_jobs(integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_enterprise_export_jobs(integer, text) TO service_role;

COMMIT;
