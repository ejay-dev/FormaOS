/**
 * =========================================================
 * ONBOARDING RBAC UTILITIES
 * =========================================================
 * Role-based access control for industry onboarding features
 * Ensures proper permissions for framework provisioning and configuration
 */

export type DatabaseRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Roles that can configure industry onboarding
 */
export const ADMIN_ROLES: readonly DatabaseRole[] = ['owner', 'admin'] as const;

/**
 * Roles that can view but not modify
 */
export const VIEWER_ROLES: readonly DatabaseRole[] = [
  'member',
  'viewer',
] as const;

/**
 * Check if user can configure industry settings
 */
export function canConfigureIndustry(role: DatabaseRole): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Check if user can provision frameworks
 */
export function canProvisionFrameworks(role: DatabaseRole): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Check if user can apply industry packs
 */
export function canApplyIndustryPacks(role: DatabaseRole): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Check if user can view industry guidance
 */
export function canViewIndustryGuidance(_role: DatabaseRole): boolean {
  // All roles can view guidance, but some features may be disabled
  return true;
}

/**
 * Check if user can complete onboarding steps
 */
export function canCompleteOnboardingSteps(role: DatabaseRole): boolean {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

/**
 * Get permission error message
 */
export function getPermissionError(action: string): string {
  return `You don't have permission to ${action}. Contact your organization owner or admin.`;
}

/**
 * Permission check result with detailed info
 */
export type PermissionCheck = {
  allowed: boolean;
  reason?: string;
  suggestedAction?: string;
};

/**
 * Comprehensive permission check for industry actions
 */
export function checkIndustryPermission(
  role: DatabaseRole,
  action: 'configure' | 'provision' | 'apply_pack' | 'complete_step',
): PermissionCheck {
  const isAdmin = canConfigureIndustry(role);

  switch (action) {
    case 'configure':
      return {
        allowed: isAdmin,
        reason: isAdmin ? undefined : 'Admin role required',
        suggestedAction: isAdmin
          ? undefined
          : 'Contact your organization owner to request admin access',
      };

    case 'provision':
      return {
        allowed: canProvisionFrameworks(role),
        reason: canProvisionFrameworks(role)
          ? undefined
          : 'Admin role required to provision frameworks',
        suggestedAction: canProvisionFrameworks(role)
          ? undefined
          : 'Ask an admin to provision frameworks for you',
      };

    case 'apply_pack':
      return {
        allowed: canApplyIndustryPacks(role),
        reason: canApplyIndustryPacks(role)
          ? undefined
          : 'Admin role required to apply industry packs',
        suggestedAction: canApplyIndustryPacks(role)
          ? undefined
          : 'Request an admin to apply the industry pack',
      };

    case 'complete_step':
      return {
        allowed: canCompleteOnboardingSteps(role),
        reason: canCompleteOnboardingSteps(role)
          ? undefined
          : 'Admin role required to complete onboarding',
        suggestedAction: canCompleteOnboardingSteps(role)
          ? undefined
          : 'Ask an admin to complete onboarding steps',
      };

    default:
      return {
        allowed: false,
        reason: 'Unknown action',
      };
  }
}

/**
 * React hook helper for permission checks (use in client components)
 */
export function useIndustryPermissions(role: DatabaseRole) {
  return {
    canConfigure: canConfigureIndustry(role),
    canProvision: canProvisionFrameworks(role),
    canApplyPacks: canApplyIndustryPacks(role),
    canView: canViewIndustryGuidance(role),
    canCompleteSteps: canCompleteOnboardingSteps(role),
    checkPermission: (action: Parameters<typeof checkIndustryPermission>[1]) =>
      checkIndustryPermission(role, action),
  };
}
