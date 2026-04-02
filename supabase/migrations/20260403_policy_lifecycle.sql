-- Policy Lifecycle: Versioning, Approvals, Acknowledgments, Review Schedules
-- Migration: 20260403_policy_lifecycle.sql

-- Policy versions (tracks every revision)
CREATE TABLE IF NOT EXISTS policy_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  change_summary TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'published', 'archived')),
  created_by UUID NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_policy_versions_org ON policy_versions(org_id);
CREATE INDEX IF NOT EXISTS idx_policy_versions_policy ON policy_versions(policy_id);

-- Approval workflows for policy changes
CREATE TABLE IF NOT EXISTS policy_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  policy_version_id UUID NOT NULL REFERENCES policy_versions(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL,
  decision TEXT CHECK (decision IN ('approved', 'rejected', 'pending')),
  comment TEXT,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_policy_approvals_version ON policy_approvals(policy_version_id);

-- Staff acknowledgments of published policies
CREATE TABLE IF NOT EXISTS policy_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL,
  policy_version_id UUID NOT NULL REFERENCES policy_versions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(policy_version_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_policy_acks_policy ON policy_acknowledgments(policy_id);

-- Scheduled review cycles
CREATE TABLE IF NOT EXISTS policy_review_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  policy_id UUID NOT NULL,
  review_frequency TEXT NOT NULL DEFAULT 'annual' CHECK (review_frequency IN ('quarterly', 'semi_annual', 'annual', 'biennial')),
  next_review_date DATE NOT NULL,
  last_reviewed_at TIMESTAMPTZ,
  reviewer_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_policy_review_org ON policy_review_schedules(org_id);

-- RLS
ALTER TABLE policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy_review_schedules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
DROP POLICY IF EXISTS "policy_versions_org" ON policy_versions;
CREATE POLICY "policy_versions_org" ON policy_versions FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "policy_approvals_org" ON policy_approvals;
CREATE POLICY "policy_approvals_org" ON policy_approvals FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "policy_acks_org" ON policy_acknowledgments;
CREATE POLICY "policy_acks_org" ON policy_acknowledgments FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "policy_review_org" ON policy_review_schedules;
CREATE POLICY "policy_review_org" ON policy_review_schedules FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
END $$;
