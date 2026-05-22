-- =========================================================
-- Enterprise Identity, Governance, Residency, and Audit
-- =========================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'retention_action'
  ) THEN
    CREATE TYPE public.retention_action AS ENUM ('archive', 'delete', 'anonymize');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'data_classification_level'
  ) THEN
    CREATE TYPE public.data_classification_level AS ENUM ('public', 'internal', 'confidential', 'restricted');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'identity_audit_result'
  ) THEN
    CREATE TYPE public.identity_audit_result AS ENUM ('success', 'failure');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'directory_sync_provider'
  ) THEN
    CREATE TYPE public.directory_sync_provider AS ENUM ('azure-ad', 'okta', 'google-workspace');
  END IF;
END $$;

ALTER TABLE public.scim_tokens
  ADD COLUMN IF NOT EXISTS token_prefix text,
  ADD COLUMN IF NOT EXISTS rotated_at timestamptz,
  ADD COLUMN IF NOT EXISTS max_requests_per_minute integer NOT NULL DEFAULT 120;

ALTER TABLE public.scim_groups
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS role_mapping text,
  ADD COLUMN IF NOT EXISTS team_slug text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS idx_scim_groups_org_display_name
  ON public.scim_groups (organization_id, display_name);

CREATE TABLE IF NOT EXISTS public.scim_group_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_group_id uuid NOT NULL REFERENCES public.scim_groups(id) ON DELETE CASCADE,
  child_group_id uuid NOT NULL REFERENCES public.scim_groups(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_group_id, child_group_id)
);

ALTER TABLE public.scim_group_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS scim_group_links_service ON public.scim_group_links;
CREATE POLICY scim_group_links_service
  ON public.scim_group_links
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

ALTER TABLE public.organization_sso
  ADD COLUMN IF NOT EXISTS logout_url text,
  ADD COLUMN IF NOT EXISTS jit_provisioning_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS jit_default_role text NOT NULL DEFAULT 'member',
  ADD COLUMN IF NOT EXISTS directory_sync_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS directory_sync_provider public.directory_sync_provider,
  ADD COLUMN IF NOT EXISTS directory_sync_interval_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS directory_sync_config jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.directory_sync_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider public.directory_sync_provider NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  interval_minutes integer NOT NULL DEFAULT 60,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at timestamptz,
  last_sync_status text,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, provider)
);

CREATE TABLE IF NOT EXISTS public.directory_sync_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider public.directory_sync_provider NOT NULL,
  status text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  summary jsonb,
  error_message text
);

CREATE TABLE IF NOT EXISTS public.retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  retention_days integer NOT NULL,
  action public.retention_action NOT NULL,
  exceptions text[] NOT NULL DEFAULT '{}'::text[],
  framework text NOT NULL DEFAULT 'custom',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, resource_type)
);

CREATE TABLE IF NOT EXISTS public.retention_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  action public.retention_action NOT NULL,
  dry_run boolean NOT NULL DEFAULT true,
  affected_records text[] NOT NULL DEFAULT '{}'::text[],
  affected_count integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  executed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data_classifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  resource_type text NOT NULL,
  field_name text NOT NULL,
  level public.data_classification_level NOT NULL,
  source text NOT NULL DEFAULT 'manual',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, resource_type, field_name)
);

CREATE TABLE IF NOT EXISTS public.pii_scan_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  table_name text NOT NULL,
  sample_size integer NOT NULL DEFAULT 0,
  findings jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.isolation_verification_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  checks jsonb NOT NULL DEFAULT '[]'::jsonb,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.data_residency_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  operation text NOT NULL,
  source_region text,
  destination_region text,
  resource_type text,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.identity_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  actor_type text NOT NULL,
  actor_id uuid,
  actor_label text,
  target_user_id uuid,
  target_user_email text,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  result public.identity_audit_result NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_directory_sync_runs_org_started
  ON public.directory_sync_runs (organization_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_retention_policies_org_resource
  ON public.retention_policies (org_id, resource_type);
CREATE INDEX IF NOT EXISTS idx_retention_executions_org_executed
  ON public.retention_executions (org_id, executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_classifications_org_resource
  ON public.data_classifications (org_id, resource_type, field_name);
CREATE INDEX IF NOT EXISTS idx_pii_scan_results_org_created
  ON public.pii_scan_results (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_isolation_verification_org_created
  ON public.isolation_verification_results (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_data_residency_violations_org_created
  ON public.data_residency_violations (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_identity_audit_events_org_created
  ON public.identity_audit_events (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_identity_audit_events_target_email
  ON public.identity_audit_events (org_id, target_user_email);

ALTER TABLE public.directory_sync_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.directory_sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pii_scan_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.isolation_verification_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_residency_violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS directory_sync_configs_access ON public.directory_sync_configs;
CREATE POLICY directory_sync_configs_access
  ON public.directory_sync_configs
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = directory_sync_configs.organization_id
        AND m.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = directory_sync_configs.organization_id
        AND m.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS directory_sync_runs_access ON public.directory_sync_runs;
CREATE POLICY directory_sync_runs_access
  ON public.directory_sync_runs
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = directory_sync_runs.organization_id
    )
  )
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS retention_policies_access ON public.retention_policies;
CREATE POLICY retention_policies_access
  ON public.retention_policies
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = retention_policies.org_id
    )
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = retention_policies.org_id
        AND m.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS retention_executions_access ON public.retention_executions;
CREATE POLICY retention_executions_access
  ON public.retention_executions
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = retention_executions.org_id
    )
  )
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS data_classifications_access ON public.data_classifications;
CREATE POLICY data_classifications_access
  ON public.data_classifications
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = data_classifications.org_id
    )
  )
  WITH CHECK (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = data_classifications.org_id
        AND m.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS pii_scan_results_access ON public.pii_scan_results;
CREATE POLICY pii_scan_results_access
  ON public.pii_scan_results
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = pii_scan_results.org_id
    )
  )
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS isolation_verification_access ON public.isolation_verification_results;
CREATE POLICY isolation_verification_access
  ON public.isolation_verification_results
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = isolation_verification_results.org_id
    )
  )
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS data_residency_violations_access ON public.data_residency_violations;
CREATE POLICY data_residency_violations_access
  ON public.data_residency_violations
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = data_residency_violations.org_id
    )
  )
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS identity_audit_events_access ON public.identity_audit_events;
CREATE POLICY identity_audit_events_access
  ON public.identity_audit_events
  FOR ALL
  USING (
    auth.role() = 'service_role'
    OR EXISTS (
      SELECT 1 FROM public.org_members m
      WHERE m.user_id = auth.uid()
        AND m.organization_id = identity_audit_events.org_id
    )
  )
  WITH CHECK (auth.role() = 'service_role');
