-- Repair migration for user-reachable action surfaces discovered by the full
-- app action crawler. These tables are referenced by visible custom report and
-- CAPA workflows, so they must exist with cookie-session friendly RLS.

CREATE TABLE IF NOT EXISTS public.org_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, snapshot_date)
);

CREATE TABLE IF NOT EXISTS public.org_saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'custom',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  schedule JSONB,
  created_by UUID,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.org_saved_reports
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS schedule JSONB,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS last_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'org_saved_reports_type_check'
  ) THEN
    ALTER TABLE public.org_saved_reports
      ADD CONSTRAINT org_saved_reports_type_check
      CHECK (type IN ('custom', 'scheduled'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.org_report_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.org_saved_reports(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  generated_by UUID,
  file_url TEXT,
  format TEXT NOT NULL DEFAULT 'pdf',
  generated_at TIMESTAMPTZ DEFAULT now(),
  file_size_bytes INTEGER,
  expires_at TIMESTAMPTZ
);

ALTER TABLE public.org_report_generations
  ADD COLUMN IF NOT EXISTS generated_by UUID,
  ADD COLUMN IF NOT EXISTS file_url TEXT,
  ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT 'pdf',
  ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS file_size_bytes INTEGER,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'org_report_generations_format_check'
  ) THEN
    ALTER TABLE public.org_report_generations
      ADD CONSTRAINT org_report_generations_format_check
      CHECK (format IN ('pdf', 'csv', 'xlsx', 'json'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.org_capa_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  incident_id UUID,
  investigation_id UUID,
  type TEXT NOT NULL DEFAULT 'corrective',
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open',
  verification_method TEXT,
  verified_by UUID,
  verified_at TIMESTAMPTZ,
  effectiveness_check_date DATE,
  effectiveness_status TEXT DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'medium',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.org_capa_items
  ADD COLUMN IF NOT EXISTS incident_id UUID,
  ADD COLUMN IF NOT EXISTS investigation_id UUID,
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'corrective',
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to UUID,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS verification_method TEXT,
  ADD COLUMN IF NOT EXISTS verified_by UUID,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS effectiveness_check_date DATE,
  ADD COLUMN IF NOT EXISTS effectiveness_status TEXT DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'org_capa_items_type_check'
  ) THEN
    ALTER TABLE public.org_capa_items
      ADD CONSTRAINT org_capa_items_type_check
      CHECK (type IN ('corrective', 'preventive'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'org_capa_items_status_check'
  ) THEN
    ALTER TABLE public.org_capa_items
      ADD CONSTRAINT org_capa_items_status_check
      CHECK (status IN ('open', 'in_progress', 'implemented', 'verified', 'closed'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'org_capa_items_effectiveness_status_check'
  ) THEN
    ALTER TABLE public.org_capa_items
      ADD CONSTRAINT org_capa_items_effectiveness_status_check
      CHECK (effectiveness_status IN ('pending', 'effective', 'ineffective', 'needs_revision'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'org_capa_items_priority_check'
  ) THEN
    ALTER TABLE public.org_capa_items
      ADD CONSTRAINT org_capa_items_priority_check
      CHECK (priority IN ('critical', 'high', 'medium', 'low'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_snapshots_org_date ON public.org_analytics_snapshots(org_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_saved_reports_org ON public.org_saved_reports(org_id, type);
CREATE INDEX IF NOT EXISTS idx_report_generations_org ON public.org_report_generations(org_id, generated_at);
CREATE INDEX IF NOT EXISTS idx_capa_org ON public.org_capa_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_capa_status ON public.org_capa_items(status);
CREATE INDEX IF NOT EXISTS idx_capa_incident ON public.org_capa_items(incident_id);
CREATE INDEX IF NOT EXISTS idx_capa_assigned ON public.org_capa_items(assigned_to);

ALTER TABLE public.org_analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_report_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_capa_items ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_analytics_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_saved_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_report_generations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_capa_items TO authenticated;

DROP POLICY IF EXISTS "snapshots_org_isolation" ON public.org_analytics_snapshots;
CREATE POLICY "snapshots_org_isolation" ON public.org_analytics_snapshots
  FOR ALL
  USING (
    org_id IN (
      SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "saved_reports_org_isolation" ON public.org_saved_reports;
CREATE POLICY "saved_reports_org_isolation" ON public.org_saved_reports
  FOR ALL
  USING (
    org_id IN (
      SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "report_generations_org_isolation" ON public.org_report_generations;
CREATE POLICY "report_generations_org_isolation" ON public.org_report_generations
  FOR ALL
  USING (
    org_id IN (
      SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "org_capa_items_org_isolation" ON public.org_capa_items;
DROP POLICY IF EXISTS "capa_items_org_isolation" ON public.org_capa_items;
CREATE POLICY "org_capa_items_org_isolation" ON public.org_capa_items
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS saved_reports_updated_at ON public.org_saved_reports;
CREATE TRIGGER saved_reports_updated_at
  BEFORE UPDATE ON public.org_saved_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_capa_items_updated_at ON public.org_capa_items;
CREATE TRIGGER update_capa_items_updated_at
  BEFORE UPDATE ON public.org_capa_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'retention_action') THEN
    CREATE TYPE public.retention_action AS ENUM ('archive', 'delete', 'anonymize');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  retention_days INTEGER NOT NULL,
  action public.retention_action NOT NULL,
  exceptions TEXT[] NOT NULL DEFAULT '{}'::text[],
  framework TEXT NOT NULL DEFAULT 'custom',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, resource_type)
);

CREATE TABLE IF NOT EXISTS public.retention_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL,
  action public.retention_action NOT NULL,
  dry_run BOOLEAN NOT NULL DEFAULT true,
  affected_records TEXT[] NOT NULL DEFAULT '{}'::text[],
  affected_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workflow_definitions (
  row_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id UUID NOT NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  definition JSONB NOT NULL DEFAULT '{}'::jsonb,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_workflow_definitions_id_version
  ON public.workflow_definitions(id, version);

CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trigger_event JSONB NOT NULL DEFAULT '{}'::jsonb,
  workflow_version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  error TEXT,
  current_step_id TEXT,
  execution_trace JSONB NOT NULL DEFAULT '{"steps":[],"logs":[]}'::jsonb,
  context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.workflow_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  approvers JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  timeout_at TIMESTAMPTZ,
  decision TEXT,
  comment TEXT
);

CREATE INDEX IF NOT EXISTS idx_retention_policies_org_resource
  ON public.retention_policies(org_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_retention_executions_org_executed
  ON public.retention_executions(org_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_definitions_org_id
  ON public.workflow_definitions(org_id, enabled, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_org_status
  ON public.workflow_executions(org_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_execution_status
  ON public.workflow_approvals(execution_id, status, timeout_at);

ALTER TABLE public.retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_approvals ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.retention_policies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.retention_executions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_definitions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_executions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workflow_approvals TO authenticated;
