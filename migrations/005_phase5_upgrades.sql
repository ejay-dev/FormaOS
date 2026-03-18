-- =========================================================
-- Phase 5 Upgrade Migrations
-- =========================================================
-- Database schema for advanced integrations and collaboration features

-- =========================================================
-- 1. Slack Integration Tables
-- =========================================================

CREATE TABLE IF NOT EXISTS integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_type VARCHAR(50) NOT NULL, -- 'slack', 'teams', 'zapier', etc.
  name VARCHAR(255) NOT NULL,
  webhook_url TEXT,
  channel VARCHAR(255),
  enabled BOOLEAN DEFAULT true,
  events JSONB DEFAULT '[]'::jsonb,
  headers JSONB DEFAULT '{}'::jsonb,
  retry_count INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS integration_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integration_configs(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'failed', 'retrying'
  response_code INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_integration_configs_org ON integration_configs(organization_id);
CREATE INDEX idx_integration_configs_type ON integration_configs(integration_type);
CREATE INDEX idx_integration_events_integration ON integration_events(integration_id);
CREATE INDEX idx_integration_events_org ON integration_events(organization_id);
CREATE INDEX idx_integration_events_created ON integration_events(created_at);

-- =========================================================
-- 2. Comments & Mentions Tables
-- =========================================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'task', 'certificate', 'evidence', 'organization'
  entity_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions JSONB DEFAULT '[]'::jsonb, -- Array of user IDs mentioned
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For threaded replies
  edited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id, emoji)
);

CREATE INDEX idx_comments_org ON comments(organization_id);
CREATE INDEX idx_comments_entity ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_created ON comments(created_at);
CREATE INDEX idx_comment_reactions_comment ON comment_reactions(comment_id);

-- =========================================================
-- 3. Reports Tables
-- =========================================================

CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'compliance', 'audit', 'certificate', 'team', 'custom'
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  format VARCHAR(10) DEFAULT 'html', -- 'html', 'pdf'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  widgets JSONB DEFAULT '[]'::jsonb,
  layout JSONB DEFAULT '{}'::jsonb,
  schedule JSONB DEFAULT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  generated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  format VARCHAR(10) NOT NULL,
  file_path TEXT,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reports_org ON reports(organization_id);
CREATE INDEX idx_reports_user ON reports(user_id);
CREATE INDEX idx_reports_created ON reports(created_at);
CREATE INDEX idx_report_templates_org ON report_templates(organization_id);
CREATE INDEX idx_report_generations_template ON report_generations(template_id);

-- =========================================================
-- 4. Webhook System Tables
-- =========================================================

CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  events JSONB DEFAULT '[]'::jsonb,
  secret VARCHAR(255) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  retry_count INTEGER DEFAULT 3,
  headers JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,
  event VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed', 'retrying'
  response_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempts INTEGER DEFAULT 1,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_webhook_configs_org ON webhook_configs(organization_id);
CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX idx_webhook_deliveries_created ON webhook_deliveries(created_at);

-- =========================================================
-- 5. File Versioning Tables
-- =========================================================

CREATE TABLE IF NOT EXISTS file_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL, -- 'evidence', 'certificate', 'document'
  entity_id UUID NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  current_version INTEGER DEFAULT 1,
  total_versions INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  change_summary TEXT,
  checksum VARCHAR(64) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(file_id, version_number)
);

CREATE INDEX idx_file_metadata_org ON file_metadata(organization_id);
CREATE INDEX idx_file_metadata_entity ON file_metadata(entity_type, entity_id);
CREATE INDEX idx_file_versions_file ON file_versions(file_id);
CREATE INDEX idx_file_versions_version ON file_versions(version_number);
CREATE INDEX idx_file_versions_uploaded ON file_versions(uploaded_by);

-- =========================================================
-- Row Level Security (RLS) Policies
-- =========================================================

-- Enable RLS on all new tables
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_versions ENABLE ROW LEVEL SECURITY;

-- Integration Configs Policies
CREATE POLICY "Users can view integration configs in their org"
  ON integration_configs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage integration configs"
  ON integration_configs FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Comments Policies
CREATE POLICY "Users can view comments in their org"
  ON comments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create comments in their org"
  ON comments FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (user_id = auth.uid());

-- Comment Reactions Policies
CREATE POLICY "Users can view reactions in their org"
  ON comment_reactions FOR SELECT
  USING (
    comment_id IN (
      SELECT id FROM comments
      WHERE organization_id IN (
        SELECT organization_id FROM org_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage their own reactions"
  ON comment_reactions FOR ALL
  USING (user_id = auth.uid());

-- Reports Policies
CREATE POLICY "Users can view reports in their org"
  ON reports FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reports in their org"
  ON reports FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Report Templates Policies
CREATE POLICY "Users can view report templates in their org"
  ON report_templates FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage report templates"
  ON report_templates FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'manager')
    )
  );

-- Webhook Configs Policies
CREATE POLICY "Admins can view webhook configs"
  ON webhook_configs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can manage webhook configs"
  ON webhook_configs FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- File Metadata Policies
CREATE POLICY "Users can view file metadata in their org"
  ON file_metadata FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage file metadata in their org"
  ON file_metadata FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- File Versions Policies
CREATE POLICY "Users can view file versions in their org"
  ON file_versions FOR SELECT
  USING (
    file_id IN (
      SELECT id FROM file_metadata
      WHERE organization_id IN (
        SELECT organization_id FROM org_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage file versions in their org"
  ON file_versions FOR ALL
  USING (
    file_id IN (
      SELECT id FROM file_metadata
      WHERE organization_id IN (
        SELECT organization_id FROM org_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- =========================================================
-- Functions and Triggers
-- =========================================================

-- Update updated_at timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to new tables
CREATE TRIGGER update_integration_configs_updated_at
  BEFORE UPDATE ON integration_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_templates_updated_at
  BEFORE UPDATE ON report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_configs_updated_at
  BEFORE UPDATE ON webhook_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_metadata_updated_at
  BEFORE UPDATE ON file_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- Indexes for Performance
-- =========================================================

-- Full-text search on comments
CREATE INDEX idx_comments_content_search ON comments USING gin(to_tsvector('english', content));

-- Composite indexes for common queries
CREATE INDEX idx_webhook_deliveries_webhook_status ON webhook_deliveries(webhook_id, status);
CREATE INDEX idx_integration_events_org_type ON integration_events(organization_id, event_type);
CREATE INDEX idx_file_versions_file_version ON file_versions(file_id, version_number DESC);

-- =========================================================
-- Sample Data (Optional for Testing)
-- =========================================================

-- Example comment
-- INSERT INTO comments (organization_id, entity_type, entity_id, user_id, content)
-- VALUES (
--   'org-uuid',
--   'task',
--   'task-uuid',
--   'user-uuid',
--   'Great progress on this task! @john.doe please review.'
-- );

-- Example report template
-- INSERT INTO report_templates (organization_id, name, description, widgets, layout, created_by)
-- VALUES (
--   'org-uuid',
--   'Monthly Compliance Dashboard',
--   'Overview of compliance metrics and certificate status',
--   '[]'::jsonb,
--   '{"rows": 4, "columns": 3}'::jsonb,
--   'user-uuid'
-- );

-- =========================================================
-- Migration Complete
-- =========================================================
