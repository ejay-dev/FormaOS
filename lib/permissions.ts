/**
 * =========================================================
 * DEPRECATED — Use lib/roles.ts instead
 * =========================================================
 *
 * This file is kept for backward compatibility only.
 * All permission checks should use the unified role system
 * in lib/roles.ts which provides:
 *
 * - DatabaseRole: 'owner' | 'admin' | 'member' | 'viewer'
 * - Fine-grained Permission type (org:*, team:*, cert:*, etc.)
 * - ROLE_CAPABILITIES matrix
 * - hasPermission(role, permission) helper
 * - isEmployerRole(role) / isEmployeeRole(role) helpers
 * - MODULE_ACCESS visibility matrix
 *
 * Migration guide:
 *   OLD: import { hasPermission, UserRole } from '@/lib/permissions'
 *   NEW: import { hasPermission, DatabaseRole } from '@/lib/roles'
 *
 *   OLD role mapping:
 *     'admin' → 'owner' or 'admin'
 *     'manager' → 'admin'
 *     'staff' → 'member'
 */

import {
  hasPermission as unifiedHasPermission,
  type DatabaseRole,
  type Permission,
} from './roles';

/** @deprecated Use DatabaseRole from lib/roles.ts */
export type UserRole = 'admin' | 'manager' | 'staff';

/** @deprecated Use ROLE_CAPABILITIES from lib/roles.ts */
export const PERMISSIONS = {
  admin: [
    'manage_users',
    'edit_policies',
    'view_audit',
    'manage_billing',
    'delete_data',
  ],
  manager: ['view_audit', 'assign_tasks', 'review_evidence', 'view_all_staff'],
  staff: ['view_tasks', 'upload_evidence', 'view_policies'],
};

/** Map legacy roles to new DatabaseRole */
function mapLegacyRole(role: UserRole): DatabaseRole {
  switch (role) {
    case 'admin':
      return 'owner';
    case 'manager':
      return 'admin';
    case 'staff':
      return 'member';
  }
}

/** @deprecated Use hasPermission from lib/roles.ts */
export function hasPermission(role: UserRole, action: string): boolean {
  // Use legacy behavior for backward compat
  return (PERMISSIONS[role] as string[]).includes(action);
}
