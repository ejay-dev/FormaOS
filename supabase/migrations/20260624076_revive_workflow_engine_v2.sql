-- Revive workflow engine v2 (2026-06-02).
-- Applied to prod via MCP (migration: revive_workflow_engine_v2) and captured
-- in supabase/baseline/prod_schema_baseline.sql. Idempotent.
--
-- Fixes vs the never-applied 20260315006: workflow_executions.workflow_id has
-- NO FK (definitions.id is not unique alone — id+version is), adds
-- delay_resume_at (cron-based delayed resume), and adds org_id to
-- workflow_approvals (closes the cross-tenant approval IDOR + enables RLS).

CREATE TABLE IF NOT EXISTS public.workflow_definitions (
  row_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id uuid NOT NULL,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  version integer NOT NULL DEFAULT 1,
  definition jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, version)
);

CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  trigger_event jsonb NOT NULL DEFAULT '{}'::jsonb,
  workflow_version integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running','completed','failed','cancelled','waiting_approval','waiting_delay','paused')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  error text,
  current_step_id text,
  delay_resume_at timestamptz,
  execution_trace jsonb NOT NULL DEFAULT '{"steps":[],"logs":[]}'::jsonb,
  context_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.workflow_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  step_id text NOT NULL,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  approvers jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','timed_out','escalated')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  timeout_at timestamptz,
  decision text CHECK (decision IN ('approve','reject')),
  comment text
);

CREATE INDEX IF NOT EXISTS idx_workflow_definitions_org ON public.workflow_definitions(org_id, enabled, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_org_status ON public.workflow_executions(org_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_delay_resume ON public.workflow_executions(delay_resume_at) WHERE status = 'waiting_delay';
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_pending_timeout ON public.workflow_approvals(timeout_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_execution ON public.workflow_approvals(execution_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_org ON public.workflow_approvals(org_id, status);

ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workflow_definitions_select_org ON public.workflow_definitions;
CREATE POLICY workflow_definitions_select_org ON public.workflow_definitions FOR SELECT
  USING (org_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS workflow_definitions_manage_org ON public.workflow_definitions;
CREATE POLICY workflow_definitions_manage_org ON public.workflow_definitions FOR ALL
  USING (org_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner','admin','compliance_officer')))
  WITH CHECK (org_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner','admin','compliance_officer')));

DROP POLICY IF EXISTS workflow_executions_select_org ON public.workflow_executions;
CREATE POLICY workflow_executions_select_org ON public.workflow_executions FOR SELECT
  USING (org_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS workflow_executions_manage_org ON public.workflow_executions;
CREATE POLICY workflow_executions_manage_org ON public.workflow_executions FOR ALL
  USING (org_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner','admin','compliance_officer')))
  WITH CHECK (org_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner','admin','compliance_officer')));

DROP POLICY IF EXISTS workflow_approvals_select_org ON public.workflow_approvals;
CREATE POLICY workflow_approvals_select_org ON public.workflow_approvals FOR SELECT
  USING (org_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS workflow_approvals_manage_org ON public.workflow_approvals;
CREATE POLICY workflow_approvals_manage_org ON public.workflow_approvals FOR ALL
  USING (org_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner','admin','compliance_officer')))
  WITH CHECK (org_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner','admin','compliance_officer')));
