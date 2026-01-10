export type UserRole = 'admin' | 'manager' | 'staff';

export const PERMISSIONS = {
  admin: ['manage_users', 'edit_policies', 'view_audit', 'manage_billing', 'delete_data'],
  manager: ['view_audit', 'assign_tasks', 'review_evidence', 'view_all_staff'],
  staff: ['view_tasks', 'upload_evidence', 'view_policies']
};

export function hasPermission(role: UserRole, action: string) {
  return (PERMISSIONS[role] as string[]).includes(action);
}