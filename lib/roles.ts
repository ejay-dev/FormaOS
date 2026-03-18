/**
 * =========================================================
 * UNIFIED ROLE SYSTEM - Type & Capability Definitions
 * =========================================================
 * Standardized role model across database, API, and frontend
 *
 * Database roles (org_members.role):
 * - owner: Organization owner/employer
 * - admin: Organization administrator
 * - member: Team member/employee
 * - viewer: Read-only access
 */

/**
 * Database-level roles stored in org_members.role column
 */
export type DatabaseRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * User-facing role groups
 */
export type UserRoleGroup = 'employer' | 'employee';

/**
 * Combined role type
 */
export type Role = DatabaseRole;

/**
 * Permission keys for access control
 */
export type Permission =
  // Organization-level
  | 'org:view_overview'
  | 'org:manage_settings'

  // Team management
  | 'team:invite_members'
  | 'team:remove_members'
  | 'team:change_roles'
  | 'team:view_all_members'

  // Certificates & Licenses
  | 'cert:view_all'
  | 'cert:view_own'
  | 'cert:create'
  | 'cert:edit'
  | 'cert:delete'

  // Evidence & Files
  | 'evidence:view_all'
  | 'evidence:view_own'
  | 'evidence:upload'
  | 'evidence:approve'
  | 'evidence:reject'

  // Tasks
  | 'task:create_for_others'
  | 'task:create_own'
  | 'task:view_all'
  | 'task:view_own'
  | 'task:complete_own'
  | 'task:assign'

  // Audit & Compliance
  | 'audit:view_logs'
  | 'audit:export_reports'
  | 'audit:view_org_compliance'

  // Billing
  | 'billing:view'
  | 'billing:manage';

/**
 * Role capabilities matrix
 */
export const ROLE_CAPABILITIES: Record<DatabaseRole, Permission[]> = {
  owner: [
    // Organization
    'org:view_overview',
    'org:manage_settings',
    // Team
    'team:invite_members',
    'team:remove_members',
    'team:change_roles',
    'team:view_all_members',
    // Certificates
    'cert:view_all',
    'cert:view_own',
    'cert:create',
    'cert:edit',
    'cert:delete',
    // Evidence
    'evidence:view_all',
    'evidence:view_own',
    'evidence:upload',
    'evidence:approve',
    'evidence:reject',
    // Tasks
    'task:create_for_others',
    'task:create_own',
    'task:view_all',
    'task:view_own',
    'task:complete_own',
    'task:assign',
    // Audit
    'audit:view_logs',
    'audit:export_reports',
    'audit:view_org_compliance',
    // Billing
    'billing:view',
    'billing:manage',
  ],
  admin: [
    // Organization
    'org:view_overview',
    'org:manage_settings',
    // Team
    'team:invite_members',
    'team:remove_members',
    'team:change_roles',
    'team:view_all_members',
    // Certificates
    'cert:view_all',
    'cert:view_own',
    'cert:create',
    'cert:edit',
    'cert:delete',
    // Evidence
    'evidence:view_all',
    'evidence:view_own',
    'evidence:upload',
    'evidence:approve',
    'evidence:reject',
    // Tasks
    'task:create_for_others',
    'task:create_own',
    'task:view_all',
    'task:view_own',
    'task:complete_own',
    'task:assign',
    // Audit
    'audit:view_logs',
    'audit:export_reports',
    'audit:view_org_compliance',
    // Billing (no access)
  ],
  member: [
    // Certificates
    'cert:view_own',
    // Evidence
    'evidence:view_own',
    'evidence:upload',
    // Tasks
    'task:create_own',
    'task:view_own',
    'task:complete_own',
    // Audit (limited)
    'audit:view_org_compliance',
  ],
  viewer: [
    // Organization (read-only)
    'org:view_overview',
    // Certificates (read-only)
    'cert:view_own',
    // Evidence (read-only)
    'evidence:view_own',
    // Tasks (read-only)
    'task:view_own',
    // Audit (read-only)
    'audit:view_org_compliance',
  ],
};

/**
 * Helper: Check if role has permission
 */
export function hasPermission(
  role: DatabaseRole,
  permission: Permission,
): boolean {
  return ROLE_CAPABILITIES[role].includes(permission);
}

/**
 * Helper: Get user role group
 */
export function getRoleGroup(role: DatabaseRole): UserRoleGroup {
  return role === 'member' || role === 'viewer' ? 'employee' : 'employer';
}

/**
 * Helper: Check if role is employer
 */
export function isEmployerRole(role: DatabaseRole): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * Helper: Check if role is employee
 */
export function isEmployeeRole(role: DatabaseRole): boolean {
  return role === 'member' || role === 'viewer';
}

/**
 * Module/Node visibility by role
 */
export type ModuleId =
  | 'org_overview'
  | 'team_management'
  | 'certificates'
  | 'evidence'
  | 'tasks'
  | 'audit_logs'
  | 'billing'
  | 'admin_settings'
  | 'my_compliance'
  | 'my_certificates'
  | 'my_evidence'
  | 'my_tasks'
  | 'training';

/**
 * Node state visualization
 */
export type NodeState = 'locked' | 'active' | 'restricted' | 'loading';

/**
 * Module accessibility by role
 */
export const MODULE_ACCESS: Record<
  DatabaseRole,
  Record<ModuleId, NodeState>
> = {
  owner: {
    org_overview: 'active',
    team_management: 'active',
    certificates: 'active',
    evidence: 'active',
    tasks: 'active',
    audit_logs: 'active',
    billing: 'active',
    admin_settings: 'active',
    my_compliance: 'restricted', // Can see own too
    my_certificates: 'active',
    my_evidence: 'active',
    my_tasks: 'active',
    training: 'active',
  },
  admin: {
    org_overview: 'active',
    team_management: 'active',
    certificates: 'active',
    evidence: 'active',
    tasks: 'active',
    audit_logs: 'active',
    billing: 'locked',
    admin_settings: 'active',
    my_compliance: 'restricted',
    my_certificates: 'active',
    my_evidence: 'active',
    my_tasks: 'active',
    training: 'active',
  },
  member: {
    org_overview: 'locked',
    team_management: 'locked',
    certificates: 'locked',
    evidence: 'locked',
    tasks: 'locked',
    audit_logs: 'locked',
    billing: 'locked',
    admin_settings: 'locked',
    my_compliance: 'active',
    my_certificates: 'active',
    my_evidence: 'active',
    my_tasks: 'active',
    training: 'active',
  },
  viewer: {
    org_overview: 'locked',
    team_management: 'locked',
    certificates: 'locked',
    evidence: 'locked',
    tasks: 'locked',
    audit_logs: 'locked',
    billing: 'locked',
    admin_settings: 'locked',
    my_compliance: 'restricted',
    my_certificates: 'restricted',
    my_evidence: 'restricted',
    my_tasks: 'restricted',
    training: 'active',
  },
};

/**
 * Helper: Check if user can access module
 */
export function canAccessModule(role: DatabaseRole, module: ModuleId): boolean {
  const state = MODULE_ACCESS[role][module];
  return state === 'active' || state === 'restricted';
}

/**
 * Helper: Get module access state
 */
export function getModuleState(
  role: DatabaseRole,
  module: ModuleId,
): NodeState {
  return MODULE_ACCESS[role][module];
}
