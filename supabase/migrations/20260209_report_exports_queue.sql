-- Report export jobs queue
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'report_export_jobs'
  ) THEN
    CREATE TABLE public.report_export_jobs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
      requested_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
      report_type text NOT NULL,
      format text NOT NULL DEFAULT 'pdf',
      status text NOT NULL DEFAULT 'pending',
      progress integer DEFAULT 0,
      file_url text,
      file_size bigint,
      error_message text,
      last_error text,
      attempt_count integer NOT NULL DEFAULT 0,
      next_run_at timestamptz DEFAULT now(),
      locked_at timestamptz,
      locked_by text,
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      started_at timestamptz,
      completed_at timestamptz,
      CONSTRAINT report_export_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired'))
    );
  END IF;
END
$$;

ALTER TABLE IF EXISTS public.report_export_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "report_export_select" ON public.report_export_jobs;
CREATE POLICY "report_export_select"
  ON public.report_export_jobs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "report_export_insert" ON public.report_export_jobs;
CREATE POLICY "report_export_insert"
  ON public.report_export_jobs
  FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "report_export_service_role" ON public.report_export_jobs;
CREATE POLICY "report_export_service_role"
  ON public.report_export_jobs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS report_export_jobs_org_idx
  ON public.report_export_jobs (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS report_export_jobs_queue_idx
  ON public.report_export_jobs (status, next_run_at, created_at);

CREATE OR REPLACE FUNCTION public.claim_report_export_jobs(
  p_limit integer,
  p_worker_id text
)
RETURNS SETOF public.report_export_jobs
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
    FROM public.report_export_jobs
    WHERE status = 'pending'
      AND (next_run_at IS NULL OR next_run_at <= now())
      AND (locked_at IS NULL OR locked_at < now() - interval '15 minutes')
    ORDER BY created_at ASC
    LIMIT GREATEST(p_limit, 0)
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.report_export_jobs AS jobs
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

GRANT EXECUTE ON FUNCTION public.claim_report_export_jobs(integer, text) TO service_role;

