-- ==========================================================================
-- FormaOS Base Schema
-- ==========================================================================
-- This migration documents the pre-existing core tables that were created
-- outside the migration system (via Supabase Dashboard or initial setup).
-- All statements use IF NOT EXISTS to be safely idempotent.
--
-- Tables documented:
--   organizations, org_members, org_tasks, org_evidence,
--   org_policies, org_assets, org_risks, org_compliance_blocks,
--   org_audit_logs
-- ==========================================================================

-- ----- organizations -----
CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_by uuid,
  industry text,
  industry_code text,
  frameworks text[],
  plan_key text,
  plan_selected_at timestamptz,
  team_size text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  onboarding_completed_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----- org_members -----
CREATE TABLE IF NOT EXISTS public.org_members (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  department text,
  compliance_status text DEFAULT 'active',
  mfa_required boolean DEFAULT false,
  start_date date,
  created_at timestamptz DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

-- ----- org_tasks -----
CREATE TABLE IF NOT EXISTS public.org_tasks (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium',
  assigned_to text,
  due_date timestamptz,
  patient_id uuid,
  entity_id uuid,
  created_at timestamptz DEFAULT now()
);

-- ----- org_evidence -----
CREATE TABLE IF NOT EXISTS public.org_evidence (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  task_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  uploaded_by text,
  policy_id uuid,
  linked_policy_id uuid,
  patient_id uuid,
  entity_id uuid,
  quality_score integer,
  risk_flag text,
  ai_summary text,
  last_scored_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ----- org_policies -----
CREATE TABLE IF NOT EXISTS public.org_policies (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text,
  status text DEFAULT 'draft',
  version text DEFAULT 'v0.1',
  author text,
  entity_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ----- org_assets -----
CREATE TABLE IF NOT EXISTS public.org_assets (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  criticality text DEFAULT 'low',
  status text DEFAULT 'active',
  owner text,
  entity_id uuid,
  contains_phi boolean NOT NULL DEFAULT false,
  encrypted_at_rest boolean NOT NULL DEFAULT false,
  encrypted_in_transit boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- ----- org_risks -----
CREATE TABLE IF NOT EXISTS public.org_risks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  likelihood integer NOT NULL,
  impact integer NOT NULL,
  risk_score integer,
  status text NOT NULL DEFAULT 'open',
  mitigation_strategy text,
  owner_id uuid,
  entity_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ----- org_compliance_blocks -----
CREATE TABLE IF NOT EXISTS public.org_compliance_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  gate_key text NOT NULL,
  reason text NOT NULL,
  metadata jsonb NOT NULL,
  entity_id uuid,
  created_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ----- org_audit_logs -----
CREATE TABLE IF NOT EXISTS public.org_audit_logs (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  action text NOT NULL,
  target text NOT NULL,
  actor_email text NOT NULL,
  entity_id uuid,
  created_at timestamptz DEFAULT now()
);

-- ==========================================================================
-- Indexes for base tables
-- ==========================================================================

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON public.org_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON public.org_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_tasks_org_id ON public.org_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_tasks_status ON public.org_tasks(status);
CREATE INDEX IF NOT EXISTS idx_org_evidence_org_id ON public.org_evidence(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_evidence_task_id ON public.org_evidence(task_id);
CREATE INDEX IF NOT EXISTS idx_org_policies_org_id ON public.org_policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_assets_org_id ON public.org_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_risks_org_id ON public.org_risks(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_compliance_blocks_org_id ON public.org_compliance_blocks(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_audit_logs_org_id ON public.org_audit_logs(organization_id);

-- ==========================================================================
-- RLS policies for base tables
-- ==========================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_compliance_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_audit_logs ENABLE ROW LEVEL SECURITY;
