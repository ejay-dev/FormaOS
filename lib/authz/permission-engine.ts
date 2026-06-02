import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const PERMISSION_MODULES = [
  'tasks',
  'evidence',
  'compliance',
  'incidents',
  'reports',
  'team',
  'billing',
  'settings',
  'forms',
  'care_plans',
  'audit',
  'policies',
  'integrations',
] as const;

export type PermissionModule = (typeof PERMISSION_MODULES)[number];
export type PermissionAction = 'read' | 'write' | 'delete' | 'export' | 'admin';

export type PermissionMatrix = Record<
  PermissionModule,
  Record<PermissionAction, boolean>
>;

const BASE_PERMISSIONS: Record<string, Partial<PermissionMatrix>> = {
  admin: Object.fromEntries(
    PERMISSION_MODULES.map((m) => [
      m,
      { read: true, write: true, delete: true, export: true, admin: true },
    ]),
  ) as Record<PermissionModule, Record<PermissionAction, boolean>>,
  member: Object.fromEntries(
    PERMISSION_MODULES.map((m) => [
      m,
      { read: true, write: true, delete: false, export: true, admin: false },
    ]),
  ) as Record<PermissionModule, Record<PermissionAction, boolean>>,
  viewer: Object.fromEntries(
    PERMISSION_MODULES.map((m) => [
      m,
      { read: true, write: false, delete: false, export: false, admin: false },
    ]),
  ) as Record<PermissionModule, Record<PermissionAction, boolean>>,
};

export async function getEffectivePermissions(
  userId: string,
  orgId: string,
): Promise<PermissionMatrix> {
  const db = createSupabaseAdminClient();

  // Get base role
  const { data: membership } = await db
    .from('org_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .single();

  const baseRole = membership?.role || 'member';
  const basePerms = BASE_PERMISSIONS[baseRole] || BASE_PERMISSIONS.member;

  // v4-031: team_members rows were previously fetched only by user_id,
  // merging custom-role permissions from any org the user has ever joined
  // into the active org context. Scope through team_groups.org_id (the
  // canonical org binding) AND filter custom_roles by org_id for defence
  // in depth against orphan team_member rows.
  const { data: orgTeams } = await db
    .from('team_groups')
    .select('id')
    .eq('org_id', orgId);

  const teamIds = (orgTeams || [])
    .map((t) => (t as { id?: string }).id)
    .filter((id): id is string => Boolean(id));

  if (teamIds.length === 0) return basePerms as PermissionMatrix;

  const { data: teamMemberships } = await db
    .from('team_members')
    .select('custom_role_id')
    .eq('user_id', userId)
    .in('team_id', teamIds);

  const customRoleIds = (teamMemberships || [])
    .map((tm) => tm.custom_role_id)
    .filter(Boolean);

  if (customRoleIds.length === 0) return basePerms as PermissionMatrix;

  // Merge custom role permissions (most permissive wins) — scoped to org.
  const { data: customRoles } = await db
    .from('custom_roles')
    .select('permissions')
    .in('id', customRoleIds)
    .eq('org_id', orgId);

  const merged = structuredClone(basePerms) as PermissionMatrix;
  for (const role of customRoles || []) {
    const perms = role.permissions as Partial<PermissionMatrix>;
    for (const mod of PERMISSION_MODULES) {
      if (perms[mod]) {
        for (const action of [
          'read',
          'write',
          'delete',
          'export',
          'admin',
        ] as PermissionAction[]) {
          if (perms[mod]![action]) {
            if (!merged[mod])
              merged[mod] = {} as Record<PermissionAction, boolean>;
            merged[mod][action] = true;
          }
        }
      }
    }
  }

  return merged;
}

export async function hasPermission(
  userId: string,
  orgId: string,
  module: PermissionModule,
  action: PermissionAction,
): Promise<boolean> {
  const perms = await getEffectivePermissions(userId, orgId);
  return perms[module]?.[action] ?? false;
}

export async function getRolePermissions(
  roleId: string,
): Promise<PermissionMatrix | null> {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from('custom_roles')
    .select('permissions, base_role')
    .eq('id', roleId)
    .single();
  if (!data) return null;

  const base = BASE_PERMISSIONS[data.base_role] || BASE_PERMISSIONS.member;
  const custom = data.permissions as Partial<PermissionMatrix>;

  // Merge custom on top of base
  const merged = structuredClone(base) as PermissionMatrix;
  for (const mod of PERMISSION_MODULES) {
    if (custom[mod]) {
      for (const action of [
        'read',
        'write',
        'delete',
        'export',
        'admin',
      ] as PermissionAction[]) {
        if (custom[mod]![action] !== undefined) {
          merged[mod][action] = custom[mod]![action]!;
        }
      }
    }
  }
  return merged;
}

export async function createCustomRole(
  orgId: string,
  name: string,
  baseRole: string,
  permissions: Partial<PermissionMatrix>,
  description?: string | null,
) {
  const db = createSupabaseAdminClient();
  const trimmed = description?.trim();
  const { data, error } = await db
    .from('custom_roles')
    .insert({
      org_id: orgId,
      name,
      base_role: baseRole,
      permissions,
      // custom_roles.description exists in the schema; the New Role form
      // captured it but previously dropped it on the floor.
      description: trimmed ? trimmed : null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function getPermissionDiff(
  roleA: PermissionMatrix,
  roleB: PermissionMatrix,
) {
  const diffs: {
    module: PermissionModule;
    action: PermissionAction;
    a: boolean;
    b: boolean;
  }[] = [];
  for (const mod of PERMISSION_MODULES) {
    for (const action of [
      'read',
      'write',
      'delete',
      'export',
      'admin',
    ] as PermissionAction[]) {
      const a = roleA[mod]?.[action] ?? false;
      const b = roleB[mod]?.[action] ?? false;
      if (a !== b) diffs.push({ module: mod, action, a, b });
    }
  }
  return diffs;
}
