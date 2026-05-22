-- =====================================================
-- SOC 2 SELF-CERTIFICATION READINESS TABLES
-- =====================================================
-- Migration Date: 2026-03-15
-- Feature: Enterprise SOC 2 self-certification backend
--
-- Creates three tables:
--   1. soc2_readiness_assessments — point-in-time readiness snapshots
--   2. soc2_milestones            — certification timeline milestones
--   3. soc2_remediation_actions   — gap remediation action items
-- =====================================================

BEGIN;

-- =====================================================
-- 1. SOC 2 Readiness Assessments (point-in-time snapshots)
-- =====================================================
CREATE TABLE IF NOT EXISTS soc2_readiness_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  overall_score numeric(5,2) NOT NULL DEFAULT 0,
  domain_scores jsonb NOT NULL DEFAULT '{}',
  control_results jsonb NOT NULL DEFAULT '[]',
  evidence_summary jsonb NOT NULL DEFAULT '{}',
  assessed_at timestamptz NOT NULL DEFAULT now(),
  assessed_by uuid NULL
);

CREATE INDEX IF NOT EXISTS idx_soc2_readiness_assessments_org_id
  ON soc2_readiness_assessments(organization_id);

CREATE INDEX IF NOT EXISTS idx_soc2_readiness_assessments_assessed_at
  ON soc2_readiness_assessments(organization_id, assessed_at DESC);

-- =====================================================
-- 2. SOC 2 Milestones Timeline
-- =====================================================
CREATE TABLE IF NOT EXISTS soc2_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  milestone_key text NOT NULL,
  title text NOT NULL,
  description text,
  target_date date,
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','blocked')),
  sort_order int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, milestone_key)
);

CREATE INDEX IF NOT EXISTS idx_soc2_milestones_org_id
  ON soc2_milestones(organization_id);

-- =====================================================
-- 3. SOC 2 Remediation Actions
-- =====================================================
CREATE TABLE IF NOT EXISTS soc2_remediation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  control_code text NOT NULL,
  action_type text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','skipped')),
  linked_task_id uuid,
  linked_evidence_id uuid,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_soc2_remediation_actions_org_id
  ON soc2_remediation_actions(organization_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS on all three tables
ALTER TABLE soc2_readiness_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc2_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE soc2_remediation_actions ENABLE ROW LEVEL SECURITY;

-- soc2_readiness_assessments: org member isolation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'soc2_readiness_assessments'
      AND policyname = 'soc2_readiness_assessments_org_isolation'
  ) THEN
    CREATE POLICY "soc2_readiness_assessments_org_isolation"
      ON public.soc2_readiness_assessments
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- soc2_milestones: org member isolation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'soc2_milestones'
      AND policyname = 'soc2_milestones_org_isolation'
  ) THEN
    CREATE POLICY "soc2_milestones_org_isolation"
      ON public.soc2_milestones
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- soc2_remediation_actions: org member isolation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'soc2_remediation_actions'
      AND policyname = 'soc2_remediation_actions_org_isolation'
  ) THEN
    CREATE POLICY "soc2_remediation_actions_org_isolation"
      ON public.soc2_remediation_actions
      FOR ALL
      USING (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        organization_id IN (
          SELECT organization_id
          FROM public.org_members
          WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

COMMIT;
