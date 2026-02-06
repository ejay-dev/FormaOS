-- =====================================================
-- CROSS-FRAMEWORK CONTROL DEDUPLICATION
-- Unified master controls with framework mappings
-- =====================================================

BEGIN;

-- Master unified controls table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'master_controls'
  ) THEN
    CREATE TABLE public.master_controls (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      control_code text NOT NULL UNIQUE,
      title text NOT NULL,
      description text,
      risk_level text DEFAULT 'medium',
      review_frequency_days integer DEFAULT 90,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  END IF;
END
$$;

-- Framework control mappings (links framework controls to master controls)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'framework_control_mappings'
  ) THEN
    CREATE TABLE public.framework_control_mappings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      master_control_id uuid NOT NULL REFERENCES public.master_controls (id) ON DELETE CASCADE,
      framework_control_id uuid NOT NULL REFERENCES public.framework_controls (id) ON DELETE CASCADE,
      mapping_confidence numeric(3,2) DEFAULT 1.0,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE (master_control_id, framework_control_id)
    );
  END IF;
END
$$;

-- Enable RLS
ALTER TABLE IF EXISTS public.master_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.framework_control_mappings ENABLE ROW LEVEL SECURITY;

-- Service role policies (public read, service write)
DROP POLICY IF EXISTS "master_controls_select" ON public.master_controls;
CREATE POLICY "master_controls_select"
  ON public.master_controls
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "master_controls_service_role" ON public.master_controls;
CREATE POLICY "master_controls_service_role"
  ON public.master_controls
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "mappings_select" ON public.framework_control_mappings;
CREATE POLICY "mappings_select"
  ON public.framework_control_mappings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "mappings_service_role" ON public.framework_control_mappings;
CREATE POLICY "mappings_service_role"
  ON public.framework_control_mappings
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Indexes
CREATE INDEX IF NOT EXISTS master_controls_code_idx
  ON public.master_controls (control_code);

CREATE INDEX IF NOT EXISTS framework_mappings_master_idx
  ON public.framework_control_mappings (master_control_id);

CREATE INDEX IF NOT EXISTS framework_mappings_framework_idx
  ON public.framework_control_mappings (framework_control_id);

-- Function to find or create master control from framework control
CREATE OR REPLACE FUNCTION find_or_create_master_control(
  p_title text,
  p_description text,
  p_risk_level text
) RETURNS uuid AS $$
DECLARE
  v_master_id uuid;
  v_control_code text;
BEGIN
  -- Generate normalized control code from title
  v_control_code := 'MC-' || substring(md5(lower(trim(p_title))), 1, 8);

  -- Try to find existing master control by code or similar title
  SELECT id INTO v_master_id
  FROM master_controls
  WHERE control_code = v_control_code
     OR lower(title) = lower(trim(p_title))
  LIMIT 1;

  IF v_master_id IS NULL THEN
    -- Create new master control
    INSERT INTO master_controls (control_code, title, description, risk_level)
    VALUES (v_control_code, trim(p_title), p_description, p_risk_level)
    RETURNING id INTO v_master_id;
  END IF;

  RETURN v_master_id;
END;
$$ LANGUAGE plpgsql;

COMMIT;
