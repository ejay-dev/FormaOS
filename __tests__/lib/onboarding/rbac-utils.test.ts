/**
 * Tests for lib/onboarding/rbac-utils.ts
 * Covers: role checks, permission checks, and error messages.
 */

import {
  canConfigureIndustry,
  canProvisionFrameworks,
  canApplyIndustryPacks,
  canViewIndustryGuidance,
  canCompleteOnboardingSteps,
  getPermissionError,
  checkIndustryPermission,
  ADMIN_ROLES,
  VIEWER_ROLES,
} from '@/lib/onboarding/rbac-utils';

describe('RBAC role constants', () => {
  it('ADMIN_ROLES contains owner and admin', () => {
    expect(ADMIN_ROLES).toContain('owner');
    expect(ADMIN_ROLES).toContain('admin');
  });

  it('VIEWER_ROLES contains member and viewer', () => {
    expect(VIEWER_ROLES).toContain('member');
    expect(VIEWER_ROLES).toContain('viewer');
  });
});

describe('canConfigureIndustry', () => {
  it('returns true for owner', () => {
    expect(canConfigureIndustry('owner')).toBe(true);
  });

  it('returns true for admin', () => {
    expect(canConfigureIndustry('admin')).toBe(true);
  });

  it('returns false for member', () => {
    expect(canConfigureIndustry('member')).toBe(false);
  });

  it('returns false for viewer', () => {
    expect(canConfigureIndustry('viewer')).toBe(false);
  });
});

describe('canProvisionFrameworks', () => {
  it('allows owner', () => {
    expect(canProvisionFrameworks('owner')).toBe(true);
  });

  it('denies member', () => {
    expect(canProvisionFrameworks('member')).toBe(false);
  });
});

describe('canApplyIndustryPacks', () => {
  it('allows admin', () => {
    expect(canApplyIndustryPacks('admin')).toBe(true);
  });

  it('denies viewer', () => {
    expect(canApplyIndustryPacks('viewer')).toBe(false);
  });
});

describe('canViewIndustryGuidance', () => {
  it('allows all roles', () => {
    expect(canViewIndustryGuidance('owner')).toBe(true);
    expect(canViewIndustryGuidance('admin')).toBe(true);
    expect(canViewIndustryGuidance('member')).toBe(true);
    expect(canViewIndustryGuidance('viewer')).toBe(true);
  });
});

describe('canCompleteOnboardingSteps', () => {
  it('allows owner', () => {
    expect(canCompleteOnboardingSteps('owner')).toBe(true);
  });

  it('denies viewer', () => {
    expect(canCompleteOnboardingSteps('viewer')).toBe(false);
  });
});

describe('getPermissionError', () => {
  it('returns formatted error message', () => {
    const msg = getPermissionError('edit settings');
    expect(msg).toContain('edit settings');
    expect(msg).toContain('permission');
  });
});

describe('checkIndustryPermission', () => {
  it('allows owner to configure', () => {
    const result = checkIndustryPermission('owner', 'configure');
    expect(result).toEqual({ allowed: true });
  });

  it('denies member to configure with reason', () => {
    const result = checkIndustryPermission('member', 'configure');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBeDefined();
    expect(result.suggestedAction).toBeDefined();
  });

  it('allows admin to provision', () => {
    const result = checkIndustryPermission('admin', 'provision');
    expect(result.allowed).toBe(true);
  });

  it('denies viewer to apply_pack', () => {
    const result = checkIndustryPermission('viewer', 'apply_pack');
    expect(result.allowed).toBe(false);
  });

  it('allows owner to complete_step', () => {
    const result = checkIndustryPermission('owner', 'complete_step');
    expect(result.allowed).toBe(true);
  });

  it('denies member to complete_step', () => {
    const result = checkIndustryPermission('member', 'complete_step');
    expect(result.allowed).toBe(false);
    expect(result.suggestedAction).toContain('admin');
  });
});
