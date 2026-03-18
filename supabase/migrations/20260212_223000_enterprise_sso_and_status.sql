-- Enterprise SSO + Public Status Checks
-- Adds organization-level SAML SSO configuration and a public uptime table.

-- ---------------------------------------------------------------------
-- 1) Organization SSO (SAML)
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.organization_sso (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations (id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'saml',
  enabled boolean NOT NULL DEFAULT false,
  enforce_sso boolean NOT NULL DEFAULT false,
  -- IdP configuration (prefer metadata XML as the source of truth)
  idp_metadata_xml text,
  idp_entity_id text,
  sso_url text,
  certificate text,
  allowed_domains text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.organization_sso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS organization_sso_select ON public.organization_sso;
CREATE POLICY organization_sso_select
  ON public.organization_sso
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS organization_sso_upsert ON public.organization_sso;
CREATE POLICY organization_sso_upsert
  ON public.organization_sso
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS organization_sso_update ON public.organization_sso;
CREATE POLICY organization_sso_update
  ON public.organization_sso
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS organization_sso_service_role ON public.organization_sso;
CREATE POLICY organization_sso_service_role
  ON public.organization_sso
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organization_sso_updated_at ON public.organization_sso;
CREATE TRIGGER organization_sso_updated_at
  BEFORE UPDATE ON public.organization_sso
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS organization_sso_enabled_idx
  ON public.organization_sso (enabled);

-- ---------------------------------------------------------------------
-- 2) Public Uptime Checks
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.public_uptime_checks (
  id bigserial PRIMARY KEY,
  checked_at timestamptz NOT NULL DEFAULT now(),
  ok boolean NOT NULL,
  latency_ms integer,
  source text NOT NULL DEFAULT 'vercel-cron',
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.public_uptime_checks ENABLE ROW LEVEL SECURITY;

-- Public read access (anon + authenticated) for status page rendering
DROP POLICY IF EXISTS public_uptime_checks_select ON public.public_uptime_checks;
CREATE POLICY public_uptime_checks_select
  ON public.public_uptime_checks
  FOR SELECT
  USING (true);

-- Only service role can insert/update/delete
DROP POLICY IF EXISTS public_uptime_checks_service_role ON public.public_uptime_checks;
CREATE POLICY public_uptime_checks_service_role
  ON public.public_uptime_checks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS public_uptime_checks_checked_at_idx
  ON public.public_uptime_checks (checked_at DESC);

