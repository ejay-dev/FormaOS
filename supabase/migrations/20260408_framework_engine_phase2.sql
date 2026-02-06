-- =====================================================
-- FRAMEWORK ENGINE PHASE 2
-- Adds org framework enablement + control suggestions
-- =====================================================

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'framework_controls'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'framework_controls'
        AND column_name = 'suggested_evidence_types'
    ) THEN
      ALTER TABLE public.framework_controls
        ADD COLUMN suggested_evidence_types text[];
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'framework_controls'
        AND column_name = 'suggested_automation_triggers'
    ) THEN
      ALTER TABLE public.framework_controls
        ADD COLUMN suggested_automation_triggers text[];
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'framework_controls'
        AND column_name = 'suggested_task_templates'
    ) THEN
      ALTER TABLE public.framework_controls
        ADD COLUMN suggested_task_templates jsonb DEFAULT '[]'::jsonb;
    END IF;
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'compliance_controls'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'compliance_controls'
        AND column_name = 'framework_control_id'
    ) THEN
      ALTER TABLE public.compliance_controls
        ADD COLUMN framework_control_id uuid REFERENCES public.framework_controls (id) ON DELETE SET NULL;
    END IF;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'org_frameworks'
  ) THEN
    CREATE TABLE public.org_frameworks (
      org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
      framework_slug text NOT NULL,
      enabled_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (org_id, framework_slug)
    );
  END IF;
END
$$;

ALTER TABLE IF EXISTS public.org_frameworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "org_frameworks_select" ON public.org_frameworks;
CREATE POLICY "org_frameworks_select"
  ON public.org_frameworks
  FOR SELECT
  USING (
    org_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "org_frameworks_manage" ON public.org_frameworks;
CREATE POLICY "org_frameworks_manage"
  ON public.org_frameworks
  FOR ALL
  USING (
    org_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT organization_id
      FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS org_frameworks_org_id_idx
  ON public.org_frameworks (org_id);

CREATE INDEX IF NOT EXISTS compliance_controls_framework_control_idx
  ON public.compliance_controls (framework_control_id);

COMMIT;
