-- =========================================================
-- Phase 6 Upgrade Migrations
-- =========================================================
-- Database schema for AI analytics, integrations, and monitoring

-- =========================================================
-- 1. Risk Analysis Tables
-- =========================================================

CREATE TABLE IF NOT EXISTS risk_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  overall_risk_score INTEGER NOT NULL CHECK (overall_risk_score >= 0 AND overall_risk_score <= 100),
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  total_risks INTEGER DEFAULT 0,
  risks_by_category JSONB DEFAULT '{}'::jsonb,
  risks_by_severity JSONB DEFAULT '{}'::jsonb,
  top_risks JSONB DEFAULT '[]'::jsonb,
  trends JSONB DEFAULT '{}'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_analysis_id UUID NOT NULL REFERENCES risk_analyses(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('prediction', 'anomaly', 'recommendation', 'optimization')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  impact VARCHAR(20) NOT NULL CHECK (impact IN ('low', 'medium', 'high', 'critical')),
  actionable BOOLEAN DEFAULT false,
  suggested_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_risk_analyses_org ON risk_analyses(organization_id);
CREATE INDEX idx_risk_analyses_created ON risk_analyses(created_at DESC);
CREATE INDEX idx_risk_analyses_level ON risk_analyses(risk_level);
CREATE INDEX idx_ai_insights_risk ON ai_insights(risk_analysis_id);
CREATE INDEX idx_ai_insights_org ON ai_insights(organization_id);
CREATE INDEX idx_ai_insights_type ON ai_insights(type);

-- =========================================================
-- 2. Email System Tables
-- =========================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  template VARCHAR(50) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced', 'delivered')),
  error_message TEXT,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  frequency VARCHAR(20) DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'daily_digest', 'weekly_digest')),
  enabled_events JSONB DEFAULT '[]'::jsonb,
  quiet_hours JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_email_logs_org ON email_logs(organization_id);
CREATE INDEX idx_email_logs_user ON email_logs(user_id);
CREATE INDEX idx_email_logs_sent ON email_logs(sent_at DESC);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_preferences_user ON email_preferences(user_id);
CREATE INDEX idx_email_preferences_org ON email_preferences(organization_id);

-- =========================================================
-- 3. Compliance Scanning Tables
-- =========================================================

CREATE TABLE IF NOT EXISTS compliance_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id VARCHAR(255) NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework VARCHAR(50) NOT NULL CHECK (framework IN ('soc2', 'iso27001', 'hipaa', 'gdpr', 'pci_dss', 'nist', 'custom')),
  scan_type VARCHAR(20) NOT NULL CHECK (scan_type IN ('full', 'incremental', 'targeted', 'quick')),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  total_requirements INTEGER DEFAULT 0,
  compliant INTEGER DEFAULT 0,
  non_compliant INTEGER DEFAULT 0,
  partial INTEGER DEFAULT 0,
  not_applicable INTEGER DEFAULT 0,
  compliance_score INTEGER NOT NULL CHECK (compliance_score >= 0 AND compliance_score <= 100),
  findings JSONB DEFAULT '[]'::jsonb,
  recommendations JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scan_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID NOT NULL REFERENCES compliance_scans(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requirement_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('compliant', 'non_compliant', 'partial', 'not_applicable')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  remediation TEXT NOT NULL,
  estimated_effort INTEGER DEFAULT 0,
  evidence JSONB DEFAULT '[]'::jsonb,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_compliance_scans_org ON compliance_scans(organization_id);
CREATE INDEX idx_compliance_scans_framework ON compliance_scans(framework);
CREATE INDEX idx_compliance_scans_completed ON compliance_scans(completed_at DESC);
CREATE INDEX idx_compliance_scans_score ON compliance_scans(compliance_score);
CREATE INDEX idx_scan_findings_scan ON scan_findings(scan_id);
CREATE INDEX idx_scan_findings_org ON scan_findings(organization_id);
CREATE INDEX idx_scan_findings_severity ON scan_findings(severity);
CREATE INDEX idx_scan_findings_status ON scan_findings(status);

-- =========================================================
-- 4. Dashboard Widget Tables
-- =========================================================

CREATE TABLE IF NOT EXISTS dashboard_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  widget_id VARCHAR(255) NOT NULL UNIQUE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  widget_type VARCHAR(50) NOT NULL CHECK (widget_type IN ('risk_score', 'certificate_status', 'task_progress', 'compliance_score', 'team_activity', 'trend_chart', 'recent_alerts', 'quick_stats')),
  title VARCHAR(255) NOT NULL,
  size VARCHAR(20) DEFAULT 'medium' CHECK (size IN ('small', 'medium', 'large')),
  position JSONB DEFAULT '{"x": 0, "y": 0}'::jsonb,
  refresh_interval INTEGER DEFAULT 60,
  settings JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dashboard_layouts_org ON dashboard_layouts(organization_id);
CREATE INDEX idx_dashboard_layouts_enabled ON dashboard_layouts(enabled);
CREATE INDEX idx_dashboard_layouts_type ON dashboard_layouts(widget_type);

-- =========================================================
-- 5. API Rate Limiting & Monitoring Tables
-- =========================================================

CREATE TABLE IF NOT EXISTS api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL,
  error_message TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  error_rate_threshold DECIMAL(5,2) DEFAULT 10.0,
  response_time_threshold INTEGER DEFAULT 5000,
  request_rate_threshold INTEGER DEFAULT 1000,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id)
);

CREATE INDEX idx_api_usage_logs_org ON api_usage_logs(organization_id);
CREATE INDEX idx_api_usage_logs_user ON api_usage_logs(user_id);
CREATE INDEX idx_api_usage_logs_timestamp ON api_usage_logs(timestamp DESC);
CREATE INDEX idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);
CREATE INDEX idx_api_usage_logs_status ON api_usage_logs(status_code);
CREATE INDEX idx_api_alert_config_org ON api_alert_config(organization_id);

-- =========================================================
-- 6. Scheduled Tasks Table
-- =========================================================

CREATE TABLE IF NOT EXISTS scheduled_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('risk_analysis', 'compliance_scan', 'email_digest', 'report_generation')),
  frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  enabled BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  next_run TIMESTAMP WITH TIME ZONE NOT NULL,
  last_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_scheduled_tasks_org ON scheduled_tasks(organization_id);
CREATE INDEX idx_scheduled_tasks_enabled ON scheduled_tasks(enabled);
CREATE INDEX idx_scheduled_tasks_next_run ON scheduled_tasks(next_run);
CREATE INDEX idx_scheduled_tasks_type ON scheduled_tasks(task_type);

-- =========================================================
-- Row Level Security (RLS) Policies
-- =========================================================

-- Enable RLS on all new tables
ALTER TABLE risk_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_alert_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;

-- Risk Analyses Policies
CREATE POLICY "Users can view risk analyses in their org"
  ON risk_analyses FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage risk analyses"
  ON risk_analyses FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'manager')
    )
  );

-- AI Insights Policies
CREATE POLICY "Users can view AI insights in their org"
  ON ai_insights FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Email Logs Policies
CREATE POLICY "Admins can view email logs"
  ON email_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Email Preferences Policies
CREATE POLICY "Users can view their own email preferences"
  ON email_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own email preferences"
  ON email_preferences FOR ALL
  USING (user_id = auth.uid());

-- Compliance Scans Policies
CREATE POLICY "Users can view compliance scans in their org"
  ON compliance_scans FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage compliance scans"
  ON compliance_scans FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Scan Findings Policies
CREATE POLICY "Users can view scan findings in their org"
  ON scan_findings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Dashboard Layouts Policies
CREATE POLICY "Users can view dashboard layouts in their org"
  ON dashboard_layouts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage dashboard layouts in their org"
  ON dashboard_layouts FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- API Usage Logs Policies
CREATE POLICY "Admins can view API usage logs"
  ON api_usage_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- API Alert Config Policies
CREATE POLICY "Admins can view API alert config"
  ON api_alert_config FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage API alert config"
  ON api_alert_config FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Scheduled Tasks Policies
CREATE POLICY "Admins can view scheduled tasks"
  ON scheduled_tasks FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage scheduled tasks"
  ON scheduled_tasks FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- =========================================================
-- Functions and Triggers
-- =========================================================

-- Reuse existing update_updated_at_column function

-- Apply triggers to new tables
CREATE TRIGGER update_email_preferences_updated_at
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_layouts_updated_at
  BEFORE UPDATE ON dashboard_layouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_alert_config_updated_at
  BEFORE UPDATE ON api_alert_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scheduled_tasks_updated_at
  BEFORE UPDATE ON scheduled_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Additional Indexes for Performance
-- =========================================================

-- Composite indexes for common queries
CREATE INDEX idx_risk_analyses_org_created ON risk_analyses(organization_id, created_at DESC);
CREATE INDEX idx_compliance_scans_org_framework ON compliance_scans(organization_id, framework);
CREATE INDEX idx_api_usage_logs_org_timestamp ON api_usage_logs(organization_id, timestamp DESC);
CREATE INDEX idx_email_logs_org_sent ON email_logs(organization_id, sent_at DESC);

-- JSONB indexes for querying nested data
CREATE INDEX idx_risk_analyses_risks_by_severity ON risk_analyses USING gin(risks_by_severity);
CREATE INDEX idx_compliance_scans_findings ON compliance_scans USING gin(findings);
CREATE INDEX idx_dashboard_layouts_settings ON dashboard_layouts USING gin(settings);

-- =========================================================
-- Views for Common Queries
-- =========================================================

-- Risk Summary View
CREATE OR REPLACE VIEW risk_summary AS
SELECT 
  ra.organization_id,
  ra.overall_risk_score,
  ra.risk_level,
  ra.total_risks,
  ra.created_at,
  COUNT(ai.id) as insight_count,
  COUNT(CASE WHEN ai.actionable = true THEN 1 END) as actionable_insights
FROM risk_analyses ra
LEFT JOIN ai_insights ai ON ra.id = ai.risk_analysis_id
GROUP BY ra.id, ra.organization_id, ra.overall_risk_score, ra.risk_level, ra.total_risks, ra.created_at;

-- Compliance Status View
CREATE OR REPLACE VIEW compliance_status AS
SELECT 
  cs.organization_id,
  cs.framework,
  cs.compliance_score,
  cs.completed_at,
  cs.non_compliant,
  COUNT(sf.id) as critical_findings
FROM compliance_scans cs
LEFT JOIN scan_findings sf ON cs.id = sf.scan_id AND sf.severity = 'critical'
GROUP BY cs.id, cs.organization_id, cs.framework, cs.compliance_score, cs.completed_at, cs.non_compliant;

-- API Health View
CREATE OR REPLACE VIEW api_health AS
SELECT 
  aul.organization_id,
  DATE(aul.timestamp) as date,
  COUNT(*) as total_requests,
  AVG(aul.response_time) as avg_response_time,
  COUNT(CASE WHEN aul.status_code >= 500 THEN 1 END) as server_errors,
  COUNT(CASE WHEN aul.status_code >= 400 AND aul.status_code < 500 THEN 1 END) as client_errors,
  COUNT(CASE WHEN aul.status_code >= 200 AND aul.status_code < 300 THEN 1 END) as successful_requests
FROM api_usage_logs aul
GROUP BY aul.organization_id, DATE(aul.timestamp);

-- =========================================================
-- Grant Permissions
-- =========================================================

-- Grant access to views
GRANT SELECT ON risk_summary TO authenticated;
GRANT SELECT ON compliance_status TO authenticated;
GRANT SELECT ON api_health TO authenticated;

-- =========================================================
-- Migration Complete
-- =========================================================
