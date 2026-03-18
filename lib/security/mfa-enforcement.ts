/**
 * MFA Enforcement Module
 *
 * Enforces MFA for privileged roles:
 * - Admins
 * - Founders
 * - Billing owners
 * - Compliance officers
 */

import { createSupabaseServerClient } from '@/lib/supabase/server';

export type PrivilegedRole =
  | 'owner'
  | 'admin'
  | 'OWNER'
  | 'COMPLIANCE_OFFICER'
  | 'MANAGER';

const PRIVILEGED_ROLES: string[] = [
  'owner',
  'admin',
  'OWNER',
  'COMPLIANCE_OFFICER',
  'MANAGER',
];

export interface MFAStatus {
  required: boolean;
  enabled: boolean;
  enrolledAt: string | null;
  reason?: string;
}

/**
 * Check if user's role requires MFA
 */
export function roleRequiresMFA(role: string | null): boolean {
  if (!role) return false;
  return PRIVILEGED_ROLES.includes(role);
}

/**
 * Check MFA status for current user
 */
export async function checkMFAStatus(userId: string): Promise<MFAStatus> {
  const supabase = await createSupabaseServerClient();

  // Get user's membership and role
  const { data: membership } = await supabase
    .from('org_members')
    .select('role, organization_id')
    .eq('user_id', userId)
    .maybeSingle();

  const isPrivilegedRole = membership?.role
    ? roleRequiresMFA(membership.role)
    : false;

  // Check if user has MFA enabled in user_security table
  const { data: security } = await supabase
    .from('user_security')
    .select('two_factor_enabled, two_factor_enabled_at')
    .eq('user_id', userId)
    .maybeSingle();

  const mfaEnabled = security?.two_factor_enabled ?? false;
  const enrolledAt = security?.two_factor_enabled_at ?? null;

  return {
    required: isPrivilegedRole,
    enabled: mfaEnabled,
    enrolledAt,
    reason:
      isPrivilegedRole && !mfaEnabled
        ? `Your role (${membership?.role}) requires MFA to be enabled for security compliance.`
        : undefined,
  };
}

/**
 * Middleware helper to enforce MFA for privileged routes
 */
export async function enforceMFAForPrivilegedActions(
  userId: string,
  action: string,
): Promise<{ allowed: boolean; reason?: string }> {
  const status = await checkMFAStatus(userId);

  // If MFA is required but not enabled, block sensitive actions
  if (status.required && !status.enabled) {
    return {
      allowed: false,
      reason: `MFA enrollment required before performing: ${action}`,
    };
  }

  return { allowed: true };
}
