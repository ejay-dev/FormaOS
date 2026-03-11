-- =========================================================
-- Compliance Check Cron Tables
-- =========================================================
-- Supporting tables for the scheduled compliance posture check.

-- Compliance alerts (expiring creds, overdue tasks, etc.)
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  detail TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, entity_type, entity_id, alert_type)
);

-- Org compliance scores (updated by cron)
CREATE TABLE IF NOT EXISTS org_compliance_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  score INTEGER DEFAULT 0,
  total_controls INTEGER DEFAULT 0,
  covered_controls INTEGER DEFAULT 0,
  evidence_gaps INTEGER DEFAULT 0,
  overdue_tasks INTEGER DEFAULT 0,
  expiring_credentials INTEGER DEFAULT 0,
  checked_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_compliance_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY compliance_alerts_org ON compliance_alerts FOR ALL
  USING (organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid()));

CREATE POLICY org_compliance_scores_org ON org_compliance_scores FOR ALL
  USING (organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_org ON compliance_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_unresolved ON compliance_alerts(organization_id, resolved) WHERE resolved = false;
