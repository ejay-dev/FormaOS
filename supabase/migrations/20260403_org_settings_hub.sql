-- Org Settings Hub: Branding, Feature Toggles, Preferences
-- Migration: 20260403_org_settings_hub.sql

-- Organization branding customization
CREATE TABLE IF NOT EXISTS org_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#8b5cf6',
  custom_domain TEXT,
  login_message TEXT,
  email_footer TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Feature toggles per organization
CREATE TABLE IF NOT EXISTS org_feature_toggles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, feature_key)
);
CREATE INDEX IF NOT EXISTS idx_feature_toggles_org ON org_feature_toggles(org_id);

-- Seed default feature toggles for existing orgs (run once)
-- Features: ai_assistant, care_plans, incidents, board_packs, custom_forms,
--           audit_portal, integrations, mobile_offline, advanced_reports, task_management

-- RLS
ALTER TABLE org_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_feature_toggles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
DROP POLICY IF EXISTS "org_branding_org" ON org_branding;
CREATE POLICY "org_branding_org" ON org_branding FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "org_feature_toggles_org" ON org_feature_toggles;
CREATE POLICY "org_feature_toggles_org" ON org_feature_toggles FOR ALL
  USING (org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()));
END $$;
