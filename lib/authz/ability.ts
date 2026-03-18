import { AbilityBuilder, createMongoAbility, type MongoAbility } from '@casl/ability';
import { ROLE_CAPABILITIES, type DatabaseRole, type Permission } from '@/lib/roles';

type AbilityAction = Permission | 'manage';
type AbilitySubject =
  | 'all'
  | 'organization'
  | 'team'
  | 'cert'
  | 'evidence'
  | 'task'
  | 'audit'
  | 'billing'
  | 'settings';

export type AppAbility = MongoAbility<[AbilityAction, AbilitySubject]>;

const abilityCache = new Map<DatabaseRole, AppAbility>();

const PERMISSION_SUBJECT: Partial<Record<Permission, AbilitySubject>> = {
  'org:view_overview': 'organization',
  'org:manage_settings': 'settings',
  'team:invite_members': 'team',
  'team:remove_members': 'team',
  'team:change_roles': 'team',
  'team:view_all_members': 'team',
  'cert:view_all': 'cert',
  'cert:view_own': 'cert',
  'cert:create': 'cert',
  'cert:edit': 'cert',
  'cert:delete': 'cert',
  'evidence:view_all': 'evidence',
  'evidence:view_own': 'evidence',
  'evidence:upload': 'evidence',
  'evidence:approve': 'evidence',
  'evidence:reject': 'evidence',
  'task:create_for_others': 'task',
  'task:create_own': 'task',
  'task:view_all': 'task',
  'task:view_own': 'task',
  'task:complete_own': 'task',
  'task:assign': 'task',
  'audit:view_logs': 'audit',
  'audit:export_reports': 'audit',
  'audit:view_org_compliance': 'audit',
  'billing:view': 'billing',
  'billing:manage': 'billing',
};

function createAbilityForRole(role: DatabaseRole): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

  if (role === 'owner') {
    can('manage', 'all');
  }

  for (const permission of ROLE_CAPABILITIES[role]) {
    can(permission, 'all');

    const subject = PERMISSION_SUBJECT[permission];
    if (subject) {
      can(permission, subject);
    }
  }

  return build();
}

export function getAbilityForRole(role: DatabaseRole): AppAbility {
  const cached = abilityCache.get(role);
  if (cached) return cached;

  const ability = createAbilityForRole(role);
  abilityCache.set(role, ability);
  return ability;
}

export function abilityCanPermission(
  role: DatabaseRole,
  permission: Permission,
): boolean {
  const ability = getAbilityForRole(role);
  return ability.can(permission, 'all');
}
