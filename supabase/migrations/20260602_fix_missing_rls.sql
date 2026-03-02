-- ============================================================
-- Fix: Enable RLS on compliance_frameworks and compliance_controls
-- These tables were created in 20250309_phase4_framework_intelligence.sql
-- without Row Level Security enabled.
-- ============================================================

-- compliance_frameworks (reference data — read-only for authenticated users)
ALTER TABLE IF EXISTS public.compliance_frameworks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compliance_frameworks_select" ON public.compliance_frameworks;
CREATE POLICY "compliance_frameworks_select"
  ON public.compliance_frameworks
  FOR SELECT
  TO authenticated
  USING (true);

-- compliance_controls (org-scoped via joins — read-only for authenticated users)
ALTER TABLE IF EXISTS public.compliance_controls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compliance_controls_select" ON public.compliance_controls;
CREATE POLICY "compliance_controls_select"
  ON public.compliance_controls
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: These tables contain shared reference data (frameworks and their controls).
-- They are NOT org-scoped directly, but are joined via org_frameworks/control_evidence.
-- Read-only access for all authenticated users is appropriate.
-- Write access is restricted to service role (admin operations).
