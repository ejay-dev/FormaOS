export type PlatformAdminPermission =
  | 'dashboard:view'
  | 'audit:view'
  | 'users:view'
  | 'users:manage'
  | 'orgs:view'
  | 'orgs:manage'
  | 'billing:view'
  | 'billing:manage'
  | 'trials:view'
  | 'trials:manage'
  | 'support:view'
  | 'support:manage'
  | 'security:view'
  | 'security:manage'
  | 'system:view'
  | 'exports:view'
  | 'exports:manage'
  | 'releases:view'
  | 'releases:manage'
  | 'control_plane:view'
  | 'control_plane:manage'
  | 'settings:view'
  | 'settings:manage'
  | 'approvals:manage';

export type PlatformAdminRole =
  | 'platform_viewer'
  | 'platform_support'
  | 'platform_security'
  | 'platform_release_manager'
  | 'platform_operator'
  | 'platform_super_admin';

export const ALL_PLATFORM_ADMIN_PERMISSIONS: PlatformAdminPermission[] = [
  'dashboard:view',
  'audit:view',
  'users:view',
  'users:manage',
  'orgs:view',
  'orgs:manage',
  'billing:view',
  'billing:manage',
  'trials:view',
  'trials:manage',
  'support:view',
  'support:manage',
  'security:view',
  'security:manage',
  'system:view',
  'exports:view',
  'exports:manage',
  'releases:view',
  'releases:manage',
  'control_plane:view',
  'control_plane:manage',
  'settings:view',
  'settings:manage',
  'approvals:manage',
];

export const PLATFORM_ADMIN_ROLE_PERMISSIONS: Record<
  PlatformAdminRole,
  PlatformAdminPermission[]
> = {
  platform_viewer: [
    'dashboard:view',
    'audit:view',
    'users:view',
    'orgs:view',
    'billing:view',
    'trials:view',
    'support:view',
    'security:view',
    'system:view',
    'exports:view',
    'releases:view',
    'control_plane:view',
    'settings:view',
  ],
  platform_support: [
    'dashboard:view',
    'audit:view',
    'users:view',
    'users:manage',
    'orgs:view',
    'orgs:manage',
    'billing:view',
    'billing:manage',
    'trials:view',
    'trials:manage',
    'support:view',
    'support:manage',
    'security:view',
    'exports:view',
    'settings:view',
  ],
  platform_security: [
    'dashboard:view',
    'audit:view',
    'security:view',
    'security:manage',
    'system:view',
    'users:view',
    'orgs:view',
    'support:view',
    'settings:view',
  ],
  platform_release_manager: [
    'dashboard:view',
    'audit:view',
    'releases:view',
    'releases:manage',
    'exports:view',
    'control_plane:view',
    'settings:view',
  ],
  platform_operator: [
    'dashboard:view',
    'audit:view',
    'users:view',
    'users:manage',
    'orgs:view',
    'orgs:manage',
    'billing:view',
    'billing:manage',
    'trials:view',
    'trials:manage',
    'support:view',
    'support:manage',
    'security:view',
    'security:manage',
    'system:view',
    'exports:view',
    'exports:manage',
    'releases:view',
    'releases:manage',
    'control_plane:view',
    'control_plane:manage',
    'settings:view',
  ],
  platform_super_admin: ALL_PLATFORM_ADMIN_PERMISSIONS,
};

export function isPlatformAdminPermission(
  value: string,
): value is PlatformAdminPermission {
  return (ALL_PLATFORM_ADMIN_PERMISSIONS as string[]).includes(value);
}

export function resolvePlatformAdminPermissions(args: {
  role: PlatformAdminRole;
  customPermissions?: unknown;
}) {
  const base = new Set(PLATFORM_ADMIN_ROLE_PERMISSIONS[args.role] ?? []);
  if (!Array.isArray(args.customPermissions)) {
    return Array.from(base);
  }

  for (const permission of args.customPermissions) {
    if (typeof permission === 'string' && isPlatformAdminPermission(permission)) {
      base.add(permission);
    }
  }

  return Array.from(base);
}

export function hasPlatformPermission(
  permissions: Iterable<PlatformAdminPermission>,
  required: PlatformAdminPermission | PlatformAdminPermission[],
) {
  const set = permissions instanceof Set ? permissions : new Set(permissions);
  const requiredList = Array.isArray(required) ? required : [required];
  return requiredList.every((permission) => set.has(permission));
}
