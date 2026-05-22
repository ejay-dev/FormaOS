-- Queue fields + claim function for compliance export jobs
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'compliance_export_jobs'
  ) THEN
    ALTER TABLE public.compliance_export_jobs
      ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS next_run_at timestamptz DEFAULT now(),
      ADD COLUMN IF NOT EXISTS locked_at timestamptz,
      ADD COLUMN IF NOT EXISTS locked_by text,
      ADD COLUMN IF NOT EXISTS last_error text;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS compliance_export_jobs_queue_idx
  ON public.compliance_export_jobs (status, next_run_at, created_at);

-- Claim jobs atomically for worker processing
CREATE OR REPLACE FUNCTION public.claim_compliance_export_jobs(
  p_limit integer,
  p_worker_id text
)
RETURNS SETOF public.compliance_export_jobs
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
    FROM public.compliance_export_jobs
    WHERE status = 'pending'
      AND (next_run_at IS NULL OR next_run_at <= now())
      AND (locked_at IS NULL OR locked_at < now() - interval '15 minutes')
    ORDER BY created_at ASC
    LIMIT GREATEST(p_limit, 0)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.compliance_export_jobs AS jobs
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

GRANT EXECUTE ON FUNCTION public.claim_compliance_export_jobs(integer, text) TO service_role;

