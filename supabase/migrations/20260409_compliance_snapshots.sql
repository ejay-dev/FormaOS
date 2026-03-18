-- =====================================================
-- COMPLIANCE SCORE SNAPSHOTS
-- Daily compliance score tracking for historical analysis
-- =====================================================

BEGIN;

-- Compliance score snapshots table (append-only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'compliance_score_snapshots'
  ) THEN
    CREATE TABLE public.compliance_score_snapshots (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
      framework_slug text NOT NULL,
      snapshot_date date NOT NULL DEFAULT CURRENT_DATE,
      compliance_score integer NOT NULL,
      total_controls integer NOT NULL DEFAULT 0,
      satisfied_controls integer NOT NULL DEFAULT 0,
      partial_controls integer NOT NULL DEFAULT 0,
      missing_controls integer NOT NULL DEFAULT 0,
      evidence_count integer NOT NULL DEFAULT 0,
      task_completion_rate numeric(5,2) DEFAULT 0,
      metadata jsonb DEFAULT '{}'::jsonb,
      captured_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (organization_id, framework_slug, snapshot_date)
    );
  END IF;
END
$$;

-- Enable RLS
ALTER TABLE IF EXISTS public.compliance_score_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "snapshots_select" ON public.compliance_score_snapshots;
CREATE POLICY "snapshots_select"
  ON public.compliance_score_snapshots
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "snapshots_service_role" ON public.compliance_score_snapshots;
CREATE POLICY "snapshots_service_role"
  ON public.compliance_score_snapshots
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS snapshots_org_framework_date_idx
  ON public.compliance_score_snapshots (organization_id, framework_slug, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS snapshots_date_idx
  ON public.compliance_score_snapshots (snapshot_date DESC);

-- Export jobs table (for async evidence pack exports)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'compliance_export_jobs'
  ) THEN
    CREATE TABLE public.compliance_export_jobs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
      framework_slug text NOT NULL,
      requested_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
      status text NOT NULL DEFAULT 'pending',
      progress integer DEFAULT 0,
      file_url text,
      file_size bigint,
      password_protected boolean DEFAULT false,
      error_message text,
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      started_at timestamptz,
      completed_at timestamptz,
      expires_at timestamptz,
      CONSTRAINT export_jobs_status_check CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'expired'))
    );
  END IF;
END
$$;

-- Enable RLS
ALTER TABLE IF EXISTS public.compliance_export_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies
DROP POLICY IF EXISTS "export_jobs_select" ON public.compliance_export_jobs;
CREATE POLICY "export_jobs_select"
  ON public.compliance_export_jobs
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "export_jobs_insert" ON public.compliance_export_jobs;
CREATE POLICY "export_jobs_insert"
  ON public.compliance_export_jobs
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

DROP POLICY IF EXISTS "export_jobs_service_role" ON public.compliance_export_jobs;
CREATE POLICY "export_jobs_service_role"
  ON public.compliance_export_jobs
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS export_jobs_org_idx
  ON public.compliance_export_jobs (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS export_jobs_status_idx
  ON public.compliance_export_jobs (status, created_at);

COMMIT;
