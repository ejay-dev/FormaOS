-- Permissions: custom roles, teams, team members

CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_role TEXT NOT NULL DEFAULT 'member' CHECK (base_role IN ('admin', 'member', 'viewer')),
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(org_id, name)
);

CREATE TABLE IF NOT EXISTS team_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  parent_team_id UUID REFERENCES team_groups(id),
  lead_user_id UUID,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES team_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  custom_role_id UUID REFERENCES custom_roles(id),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_roles_org ON custom_roles(org_id);
CREATE INDEX IF NOT EXISTS idx_team_groups_org ON team_groups(org_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);

ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "custom_roles_org" ON custom_roles;
  CREATE POLICY "custom_roles_org" ON custom_roles FOR ALL USING (
    org_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
  );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "team_groups_org" ON team_groups;
  CREATE POLICY "team_groups_org" ON team_groups FOR ALL USING (
    org_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
  );
END $$;

DO $$ BEGIN
  DROP POLICY IF EXISTS "team_members_org" ON team_members;
  CREATE POLICY "team_members_org" ON team_members FOR ALL USING (
    team_id IN (SELECT id FROM team_groups WHERE org_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid()))
  );
END $$;
