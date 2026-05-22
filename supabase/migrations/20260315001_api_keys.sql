CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL UNIQUE,
  prefix text NOT NULL,
  scopes text[] NOT NULL DEFAULT '{}',
  rate_limit integer NOT NULL DEFAULT 120,
  last_used timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.api_key_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  scope text,
  method text NOT NULL,
  path text NOT NULL,
  status_code integer NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_org_id ON public.api_keys(org_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_log_api_key_id ON public.api_key_usage_log(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_log_org_id ON public.api_key_usage_log(org_id, created_at DESC);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_key_usage_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "api_keys_org_members_select" ON public.api_keys;
CREATE POLICY "api_keys_org_members_select"
  ON public.api_keys
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.org_members om
      WHERE om.organization_id = api_keys.org_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "api_keys_org_admins_manage" ON public.api_keys;
CREATE POLICY "api_keys_org_admins_manage"
  ON public.api_keys
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.org_members om
      WHERE om.organization_id = api_keys.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.org_members om
      WHERE om.organization_id = api_keys.org_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "api_key_usage_log_org_members_select" ON public.api_key_usage_log;
CREATE POLICY "api_key_usage_log_org_members_select"
  ON public.api_key_usage_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.org_members om
      WHERE om.organization_id = api_key_usage_log.org_id
        AND om.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "api_key_usage_log_service_insert" ON public.api_key_usage_log;
CREATE POLICY "api_key_usage_log_service_insert"
  ON public.api_key_usage_log
  FOR INSERT
  WITH CHECK (true);
