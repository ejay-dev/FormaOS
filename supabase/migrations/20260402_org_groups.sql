-- Multi-org groups for enterprise rollup
CREATE TABLE IF NOT EXISTS org_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES org_groups(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  added_by UUID REFERENCES profiles(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_id, organization_id)
);

CREATE INDEX idx_org_groups_parent ON org_groups(parent_org_id);
CREATE INDEX idx_org_group_members_group ON org_group_members(group_id);

ALTER TABLE org_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_groups_parent_admin" ON org_groups
  USING (parent_org_id IN (
    SELECT organization_id FROM org_memberships WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ));

ALTER TABLE org_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_group_members_parent_admin" ON org_group_members
  USING (group_id IN (
    SELECT id FROM org_groups WHERE parent_org_id IN (
      SELECT organization_id FROM org_memberships WHERE user_id = auth.uid() AND role IN ('owner','admin')
    )
  ));
