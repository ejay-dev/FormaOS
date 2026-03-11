-- =========================================================
-- SCIM 2.0 Provisioning Tables
-- =========================================================
-- Supports RFC 7644 SCIM server for automated user lifecycle
-- management via identity providers (Okta, Entra ID, etc.)

-- SCIM bearer tokens for org-level API auth
CREATE TABLE IF NOT EXISTS scim_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  label TEXT DEFAULT 'SCIM Token',
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(organization_id)
);

-- SCIM groups (IdP-managed groups mapped to org roles)
CREATE TABLE IF NOT EXISTS scim_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- SCIM group membership
CREATE TABLE IF NOT EXISTS scim_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES scim_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- RLS policies
ALTER TABLE scim_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE scim_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE scim_group_members ENABLE ROW LEVEL SECURITY;

-- Service role can manage all SCIM tables (SCIM runs via admin client)
CREATE POLICY scim_tokens_service ON scim_tokens FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY scim_groups_service ON scim_groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY scim_group_members_service ON scim_group_members FOR ALL USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scim_tokens_org ON scim_tokens(organization_id);
CREATE INDEX IF NOT EXISTS idx_scim_groups_org ON scim_groups(organization_id);
CREATE INDEX IF NOT EXISTS idx_scim_group_members_group ON scim_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_scim_group_members_user ON scim_group_members(user_id);

-- Add data_residency_region to organizations (for Suggestion 1b)
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN IF NOT EXISTS data_residency_region TEXT DEFAULT 'au';
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
