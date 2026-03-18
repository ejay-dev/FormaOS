import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type FormaOrgRole = 'owner' | 'admin' | 'member' | 'viewer' | 'auditor';

export interface GroupMemberInput {
  value: string;
  display?: string;
  type?: 'User' | 'Group';
}

export interface ScimGroupRecord {
  id: string;
  organization_id: string;
  display_name: string;
  external_id: string | null;
  role_mapping: FormaOrgRole | null;
  team_slug: string | null;
  created_at: string;
  updated_at: string | null;
}

const ROLE_NAME_MAP: Record<string, FormaOrgRole> = {
  owner: 'owner',
  admin: 'admin',
  administrator: 'admin',
  auditor: 'auditor',
  viewer: 'viewer',
  read_only: 'viewer',
  readonly: 'viewer',
  member: 'member',
  employee: 'member',
};

export function inferRoleMapping(
  displayName: string,
  explicitRole?: string | null,
): FormaOrgRole | null {
  const source = explicitRole ?? displayName;
  const normalized = source.trim().toLowerCase().replace(/[\s-]+/g, '_');

  for (const [key, role] of Object.entries(ROLE_NAME_MAP)) {
    if (normalized === key || normalized.includes(key)) {
      return role;
    }
  }

  return null;
}

export async function getGroupById(orgId: string, groupId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from('scim_groups')
    .select('*')
    .eq('organization_id', orgId)
    .eq('id', groupId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as ScimGroupRecord | null) ?? null;
}

export async function getGroupMembers(groupId: string): Promise<GroupMemberInput[]> {
  const admin = createSupabaseAdminClient();
  const [{ data: userMembers }, { data: nestedGroups }] = await Promise.all([
    admin
      .from('scim_group_members')
      .select('user_id')
      .eq('group_id', groupId),
    admin
      .from('scim_group_links')
      .select('child_group_id')
      .eq('parent_group_id', groupId),
  ]);

  return [
    ...((userMembers ?? []) as Array<{ user_id: string }>).map((row) => ({
      value: row.user_id,
      type: 'User' as const,
    })),
    ...((nestedGroups ?? []) as Array<{ child_group_id: string }>).map((row) => ({
      value: row.child_group_id,
      type: 'Group' as const,
    })),
  ];
}

export async function syncGroupMembership(args: {
  orgId: string;
  groupId: string;
  members: GroupMemberInput[];
}) {
  const admin = createSupabaseAdminClient();

  await Promise.all([
    admin.from('scim_group_members').delete().eq('group_id', args.groupId),
    admin.from('scim_group_links').delete().eq('parent_group_id', args.groupId),
  ]);

  const userRows = args.members
    .filter((member) => member.type !== 'Group')
    .map((member) => ({
      group_id: args.groupId,
      user_id: member.value,
    }));

  const nestedRows = args.members
    .filter((member) => member.type === 'Group')
    .map((member) => ({
      parent_group_id: args.groupId,
      child_group_id: member.value,
    }));

  if (userRows.length) {
    const { error } = await admin
      .from('scim_group_members')
      .upsert(userRows, { onConflict: 'group_id,user_id' });
    if (error) throw new Error(error.message);
  }

  if (nestedRows.length) {
    const { error } = await admin
      .from('scim_group_links')
      .upsert(nestedRows, { onConflict: 'parent_group_id,child_group_id' });
    if (error) throw new Error(error.message);
  }

  await syncGroupRoleAssignments(args.orgId, args.groupId);
}

async function listResolvedUserIds(
  groupId: string,
  seen = new Set<string>(),
): Promise<Set<string>> {
  if (seen.has(groupId)) {
    return new Set();
  }

  seen.add(groupId);
  const admin = createSupabaseAdminClient();
  const [{ data: directUsers }, { data: childGroups }] = await Promise.all([
    admin.from('scim_group_members').select('user_id').eq('group_id', groupId),
    admin
      .from('scim_group_links')
      .select('child_group_id')
      .eq('parent_group_id', groupId),
  ]);

  const resolved = new Set<string>(
    ((directUsers ?? []) as Array<{ user_id: string }>).map((row) => row.user_id),
  );

  for (const row of (childGroups ?? []) as Array<{ child_group_id: string }>) {
    const nested = await listResolvedUserIds(row.child_group_id, seen);
    for (const userId of nested) {
      resolved.add(userId);
    }
  }

  return resolved;
}

export async function syncGroupRoleAssignments(orgId: string, groupId: string) {
  const group = await getGroupById(orgId, groupId);
  if (!group?.role_mapping) {
    return;
  }

  const admin = createSupabaseAdminClient();
  const userIds = await listResolvedUserIds(groupId);

  if (!userIds.size) {
    return;
  }

  const { error } = await admin
    .from('org_members')
    .update({ role: group.role_mapping })
    .eq('organization_id', orgId)
    .in('user_id', [...userIds]);

  if (error) {
    throw new Error(error.message);
  }
}

export async function upsertScimGroup(args: {
  orgId: string;
  displayName: string;
  externalId?: string | null;
  roleMapping?: string | null;
  teamSlug?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const roleMapping = inferRoleMapping(args.displayName, args.roleMapping ?? null);

  const { data, error } = await admin
    .from('scim_groups')
    .upsert(
      {
        organization_id: args.orgId,
        display_name: args.displayName,
        external_id: args.externalId ?? null,
        role_mapping: roleMapping,
        team_slug: args.teamSlug ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,display_name' },
    )
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as ScimGroupRecord;
}
