-- Integration sync log and config tables
-- Tracks cross-system entity mapping for Jira, Linear, Google Drive, etc.

-- Store integration configurations per org
CREATE TABLE IF NOT EXISTS integration_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, provider)
);

ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_manage_integrations"
  ON integration_configs
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Sync log: maps local entities to remote entities
CREATE TABLE IF NOT EXISTS integration_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  local_entity_type TEXT NOT NULL,
  local_entity_id TEXT NOT NULL,
  remote_entity_id TEXT NOT NULL,
  remote_url TEXT,
  sync_type TEXT NOT NULL DEFAULT 'push',
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

ALTER TABLE integration_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_members_view_sync_log"
  ON integration_sync_log
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "org_admins_manage_sync_log"
  ON integration_sync_log
  FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Add storage_type and external fields to org_evidence for linked evidence
DO $$ BEGIN
  ALTER TABLE org_evidence ADD COLUMN IF NOT EXISTS storage_type TEXT DEFAULT 'uploaded';
  ALTER TABLE org_evidence ADD COLUMN IF NOT EXISTS external_url TEXT;
  ALTER TABLE org_evidence ADD COLUMN IF NOT EXISTS external_id TEXT;
EXCEPTION WHEN others THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_integration_configs_org_provider
  ON integration_configs(organization_id, provider);

CREATE INDEX IF NOT EXISTS idx_sync_log_org_provider
  ON integration_sync_log(organization_id, provider);

CREATE INDEX IF NOT EXISTS idx_sync_log_local_entity
  ON integration_sync_log(local_entity_type, local_entity_id);
