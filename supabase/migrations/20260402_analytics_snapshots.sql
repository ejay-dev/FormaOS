-- Analytics Snapshots & Custom Reports
-- Migration: 20260402_analytics_snapshots.sql

-- Daily analytics snapshots for trend analysis
CREATE TABLE IF NOT EXISTS org_analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, snapshot_date)
);

-- Saved custom reports
CREATE TABLE IF NOT EXISTS org_saved_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'custom' CHECK (type IN ('custom', 'scheduled')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  schedule JSONB,
  created_by UUID,
  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Report generation history
CREATE TABLE IF NOT EXISTS org_report_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES org_saved_reports(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  file_url TEXT,
  format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf', 'csv', 'xlsx', 'json')),
  generated_at TIMESTAMPTZ DEFAULT now(),
  file_size_bytes INTEGER,
  expires_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_snapshots_org_date ON org_analytics_snapshots(org_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_saved_reports_org ON org_saved_reports(org_id, type);
CREATE INDEX IF NOT EXISTS idx_report_generations_org ON org_report_generations(org_id, generated_at);

-- RLS
ALTER TABLE org_analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_report_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "snapshots_org_isolation" ON org_analytics_snapshots
  FOR ALL USING (org_id = (current_setting('app.current_org_id', true))::uuid);

CREATE POLICY "saved_reports_org_isolation" ON org_saved_reports
  FOR ALL USING (org_id = (current_setting('app.current_org_id', true))::uuid);

CREATE POLICY "report_generations_org_isolation" ON org_report_generations
  FOR ALL USING (org_id = (current_setting('app.current_org_id', true))::uuid);

-- Auto-update timestamps
CREATE TRIGGER saved_reports_updated_at
  BEFORE UPDATE ON org_saved_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
