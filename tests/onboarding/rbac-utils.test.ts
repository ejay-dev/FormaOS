/**
 * Unit Tests for RBAC Utilities
 * Tests role-based access control for industry onboarding
 */

import {
  canConfigureIndustry,
  canProvisionFrameworks,
  canApplyIndustryPacks,
  canViewIndustryGuidance,
  canCompleteOnboardingSteps,
  checkIndustryPermission,
  getPermissionError,
  type DatabaseRole,
} from '@/lib/onboarding/rbac-utils';

describe('RBAC Utils - Role Checks', () => {
  describe('canConfigureIndustry', () => {
    it('should allow owner role', () => {
      expect(canConfigureIndustry('owner')).toBe(true);
    });

    it('should allow admin role', () => {
      expect(canConfigureIndustry('admin')).toBe(true);
    });

    it('should deny member role', () => {
      expect(canConfigureIndustry('member')).toBe(false);
    });

    it('should deny viewer role', () => {
      expect(canConfigureIndustry('viewer')).toBe(false);
    });
  });

  describe('canProvisionFrameworks', () => {
    it('should allow owner role', () => {
      expect(canProvisionFrameworks('owner')).toBe(true);
    });

    it('should allow admin role', () => {
      expect(canProvisionFrameworks('admin')).toBe(true);
    });

    it('should deny member role', () => {
      expect(canProvisionFrameworks('member')).toBe(false);
    });

    it('should deny viewer role', () => {
      expect(canProvisionFrameworks('viewer')).toBe(false);
    });
  });

  describe('canApplyIndustryPacks', () => {
    it('should allow owner role', () => {
      expect(canApplyIndustryPacks('owner')).toBe(true);
    });

    it('should allow admin role', () => {
      expect(canApplyIndustryPacks('admin')).toBe(true);
    });

    it('should deny member role', () => {
      expect(canApplyIndustryPacks('member')).toBe(false);
    });

    it('should deny viewer role', () => {
      expect(canApplyIndustryPacks('viewer')).toBe(false);
    });
  });

  describe('canViewIndustryGuidance', () => {
    it('should allow all roles to view guidance', () => {
      const roles: DatabaseRole[] = ['owner', 'admin', 'member', 'viewer'];
      roles.forEach((role) => {
        expect(canViewIndustryGuidance(role)).toBe(true);
      });
    });
  });

  describe('canCompleteOnboardingSteps', () => {
    it('should allow owner role', () => {
      expect(canCompleteOnboardingSteps('owner')).toBe(true);
    });

    it('should allow admin role', () => {
      expect(canCompleteOnboardingSteps('admin')).toBe(true);
    });

    it('should deny member role', () => {
      expect(canCompleteOnboardingSteps('member')).toBe(false);
    });

    it('should deny viewer role', () => {
      expect(canCompleteOnboardingSteps('viewer')).toBe(false);
    });
  });
});

describe('RBAC Utils - Permission Checks', () => {
  describe('checkIndustryPermission', () => {
    describe('configure action', () => {
      it('should allow admin roles', () => {
        const result = checkIndustryPermission('owner', 'configure');
        expect(result.allowed).toBe(true);
        expect(result.reason).toBeUndefined();
        expect(result.suggestedAction).toBeUndefined();
      });

      it('should deny member roles with helpful message', () => {
        const result = checkIndustryPermission('member', 'configure');
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('Admin role required');
        expect(result.suggestedAction).toContain(
          'Contact your organization owner',
        );
      });
    });

    describe('provision action', () => {
      it('should allow admin roles', () => {
        const result = checkIndustryPermission('admin', 'provision');
        expect(result.allowed).toBe(true);
      });

      it('should deny viewer roles with specific message', () => {
        const result = checkIndustryPermission('viewer', 'provision');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('provision frameworks');
        expect(result.suggestedAction).toContain('Ask an admin');
      });
    });

    describe('apply_pack action', () => {
      it('should allow owner role', () => {
        const result = checkIndustryPermission('owner', 'apply_pack');
        expect(result.allowed).toBe(true);
      });

      it('should deny member role', () => {
        const result = checkIndustryPermission('member', 'apply_pack');
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('industry packs');
      });
    });

    describe('complete_step action', () => {
      it('should allow admin role', () => {
        const result = checkIndustryPermission('admin', 'complete_step');
        expect(result.allowed).toBe(true);
      });

      it('should deny viewer role', () => {
        const result = checkIndustryPermission('viewer', 'complete_step');
        expect(result.allowed).toBe(false);
        expect(result.suggestedAction).toContain('complete onboarding steps');
      });
    });
  });

  describe('getPermissionError', () => {
    it('should return formatted error message', () => {
      const error = getPermissionError('configure industry settings');
      expect(error).toContain("don't have permission");
      expect(error).toContain('configure industry settings');
      expect(error).toContain('owner or admin');
    });

    it('should handle different actions', () => {
      const error1 = getPermissionError('provision frameworks');
      const error2 = getPermissionError('apply industry packs');

      expect(error1).toContain('provision frameworks');
      expect(error2).toContain('apply industry packs');
    });
  });
});

describe('RBAC Utils - Role Constants', () => {
  it('should export ADMIN_ROLES constant', () => {
    const { ADMIN_ROLES } = require('@/lib/onboarding/rbac-utils');
    expect(ADMIN_ROLES).toContain('owner');
    expect(ADMIN_ROLES).toContain('admin');
    expect(ADMIN_ROLES).toHaveLength(2);
  });

  it('should export VIEWER_ROLES constant', () => {
    const { VIEWER_ROLES } = require('@/lib/onboarding/rbac-utils');
    expect(VIEWER_ROLES).toContain('member');
    expect(VIEWER_ROLES).toContain('viewer');
    expect(VIEWER_ROLES).toHaveLength(2);
  });
});

describe('RBAC Utils - Integration Scenarios', () => {
  it('should handle owner accessing all features', () => {
    const role: DatabaseRole = 'owner';

    expect(canConfigureIndustry(role)).toBe(true);
    expect(canProvisionFrameworks(role)).toBe(true);
    expect(canApplyIndustryPacks(role)).toBe(true);
    expect(canViewIndustryGuidance(role)).toBe(true);
    expect(canCompleteOnboardingSteps(role)).toBe(true);
  });

  it('should handle member viewing but not modifying', () => {
    const role: DatabaseRole = 'member';

    expect(canConfigureIndustry(role)).toBe(false);
    expect(canProvisionFrameworks(role)).toBe(false);
    expect(canApplyIndustryPacks(role)).toBe(false);
    expect(canViewIndustryGuidance(role)).toBe(true); // Can view
    expect(canCompleteOnboardingSteps(role)).toBe(false);
  });

  it('should provide consistent permission checks across actions', () => {
    const adminActions = [
      'configure',
      'provision',
      'apply_pack',
      'complete_step',
    ] as const;

    adminActions.forEach((action) => {
      const ownerCheck = checkIndustryPermission('owner', action);
      const memberCheck = checkIndustryPermission('member', action);

      expect(ownerCheck.allowed).toBe(true);
      expect(memberCheck.allowed).toBe(false);
      expect(memberCheck.suggestedAction).toBeDefined();
    });
  });
});
