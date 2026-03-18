-- =====================================================
-- FRAMEWORK PACK ENGINE FOUNDATION
-- =====================================================
-- Migration Date: 2026-04-07
-- Phase: Framework Engine Foundation (Backend + DB)
-- =====================================================

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'frameworks'
  ) THEN
    CREATE TABLE public.frameworks (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      slug text NOT NULL UNIQUE,
      version text,
      description text,
      is_active boolean NOT NULL DEFAULT true
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'framework_domains'
  ) THEN
    CREATE TABLE public.framework_domains (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      framework_id uuid NOT NULL REFERENCES public.frameworks (id) ON DELETE CASCADE,
      name text NOT NULL,
      description text,
      sort_order integer NOT NULL DEFAULT 0,
      UNIQUE (framework_id, name)
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'framework_controls'
  ) THEN
    CREATE TABLE public.framework_controls (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      framework_id uuid NOT NULL REFERENCES public.frameworks (id) ON DELETE CASCADE,
      domain_id uuid NOT NULL REFERENCES public.framework_domains (id) ON DELETE CASCADE,
      control_code text NOT NULL,
      title text NOT NULL,
      summary_description text,
      implementation_guidance text,
      default_risk_level text,
      review_frequency_days integer,
      UNIQUE (framework_id, control_code)
    );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'control_mappings'
  ) THEN
    CREATE TABLE public.control_mappings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      internal_control_id uuid NOT NULL REFERENCES public.framework_controls (id) ON DELETE CASCADE,
      framework_slug text NOT NULL,
      external_control_reference text NOT NULL,
      mapping_strength text NOT NULL,
      UNIQUE (internal_control_id, framework_slug, external_control_reference),
      CONSTRAINT control_mappings_strength_check CHECK (mapping_strength IN ('primary', 'secondary'))
    );
  END IF;
END
$$;

ALTER TABLE IF EXISTS public.frameworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.framework_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.framework_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.control_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "frameworks_service_role" ON public.frameworks;
CREATE POLICY "frameworks_service_role" ON public.frameworks
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "framework_domains_service_role" ON public.framework_domains;
CREATE POLICY "framework_domains_service_role" ON public.framework_domains
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "framework_controls_service_role" ON public.framework_controls;
CREATE POLICY "framework_controls_service_role" ON public.framework_controls
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "control_mappings_service_role" ON public.control_mappings;
CREATE POLICY "control_mappings_service_role" ON public.control_mappings
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS framework_domains_framework_id_idx
  ON public.framework_domains (framework_id);

CREATE INDEX IF NOT EXISTS framework_controls_framework_id_idx
  ON public.framework_controls (framework_id);

CREATE INDEX IF NOT EXISTS framework_controls_domain_id_idx
  ON public.framework_controls (domain_id);

CREATE INDEX IF NOT EXISTS control_mappings_internal_control_idx
  ON public.control_mappings (internal_control_id);

CREATE INDEX IF NOT EXISTS control_mappings_framework_slug_idx
  ON public.control_mappings (framework_slug);

INSERT INTO public.frameworks (name, slug, version, description, is_active)
VALUES
  (
    'NIST Cybersecurity Framework',
    'nist-csf',
    '2.0',
    'Risk-based framework for managing cybersecurity outcomes across identify, protect, detect, respond, and recover.',
    true
  ),
  (
    'CIS Critical Security Controls',
    'cis-controls',
    '8',
    'Prioritized set of security safeguards to reduce common cyber risks.',
    true
  )
ON CONFLICT (slug) DO UPDATE
  SET name = EXCLUDED.name,
      version = EXCLUDED.version,
      description = EXCLUDED.description,
      is_active = EXCLUDED.is_active;

COMMIT;
