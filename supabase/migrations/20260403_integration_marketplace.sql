-- Integration Marketplace: Org Integrations, Event Mappings, Sync Log
-- Migration: 20260403_integration_marketplace.sql

-- Connected integrations per org
CREATE TABLE IF NOT EXISTS org_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- slack, jira, azure_ad, webhook, google_workspace, teams
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'paused', 'error')),
  config JSONB NOT NULL DEFAULT '{}', -- encrypted credentials / tokens / urls
  last_synced_at TIMESTAMPTZ,
  error_message TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, provider)
);
CREATE INDEX IF NOT EXISTS idx_org_integrations_org ON org_integrations(org_id);

-- Event mappings (what FormaOS events trigger integration actions)
CREATE TABLE IF NOT EXISTS integration_event_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES org_integrations(id) ON DELETE CASCADE,
  formaos_event TEXT NOT NULL, -- control_status_change, evidence_uploaded, incident_created, task_overdue, policy_published
  integration_action TEXT NOT NULL, -- send_message, create_issue, sync_user, webhook_post
  config JSONB DEFAULT '{}', -- channel, project, labels, url, etc.
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_mappings_integration ON integration_event_mappings(integration_id);

-- Sync log for integration operations
CREATE TABLE IF NOT EXISTS integration_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES org_integrations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('inbound', 'outbound')),
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'skipped')),
  payload JSONB DEFAULT '{}',
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sync_log_integration ON integration_sync_log(integration_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_created ON integration_sync_log(created_at);

-- RLS
ALTER TABLE org_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_event_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_sync_log ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
DROP POLICY IF EXISTS "org_integrations_org" ON org_integrations;
CREATE POLICY "org_integrations_org" ON org_integrations FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "event_mappings_org" ON integration_event_mappings;
CREATE POLICY "event_mappings_org" ON integration_event_mappings FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "sync_log_org" ON integration_sync_log;
CREATE POLICY "sync_log_org" ON integration_sync_log FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
END $$;
