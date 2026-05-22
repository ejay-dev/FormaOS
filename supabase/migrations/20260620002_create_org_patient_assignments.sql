-- Migration: Create org_patient_assignments table
-- Tracks which care worker (org_member) is assigned to which patient.
-- Used by the care scorecard to calculate active client counts per staff member.

CREATE TABLE IF NOT EXISTS public.org_patient_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.org_patients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, patient_id, user_id)
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_org_patient_assignments_org_status
  ON public.org_patient_assignments(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_org_patient_assignments_user
  ON public.org_patient_assignments(organization_id, user_id, status);

CREATE INDEX IF NOT EXISTS idx_org_patient_assignments_patient
  ON public.org_patient_assignments(patient_id);

-- Enable RLS
ALTER TABLE public.org_patient_assignments ENABLE ROW LEVEL SECURITY;

-- Org members can view assignments within their org
CREATE POLICY "org_patient_assignments_member_select"
  ON public.org_patient_assignments
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

-- Admins and owners can manage assignments
CREATE POLICY "org_patient_assignments_admin_all"
  ON public.org_patient_assignments
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
  );

-- Staff can see their own assignments
CREATE POLICY "org_patient_assignments_own_select"
  ON public.org_patient_assignments
  FOR SELECT
  USING (user_id = auth.uid());
