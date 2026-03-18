import { normalizeRole } from '@/app/app/actions/rbac';

export function isProvisioningRole(role?: string | null) {
  const roleKey = normalizeRole(role ?? null);
  return roleKey === 'OWNER' || roleKey === 'COMPLIANCE_OFFICER';
}
