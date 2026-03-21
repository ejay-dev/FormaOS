/**
 * @jest-environment node
 */

jest.mock('server-only', () => ({}));
jest.mock('@/lib/supabase/admin', () => ({}));
jest.mock('@/lib/supabase/server', () => ({}));
jest.mock('@/lib/provisioning/ensure-provisioning', () => ({}));

import {
  calculateAllModuleStates,
  calculateModuleState,
  mapPlanKeyToTier,
  mapRoleKeyToUserRole,
  mapUserRoleToRoleKey,
} from '@/lib/system-state/server';
import type { UserEntitlements } from '@/lib/system-state/types';

function makeEntitlements(
  overrides: Partial<UserEntitlements> = {},
): UserEntitlements {
  return {
    plan: 'pro',
    role: 'admin',
    trialActive: false,
    trialDaysRemaining: 14,
    enabledModules: ['dashboard', 'tasks', 'vault', 'reports'],
    permissions: {
      canCreatePolicies: true,
      canManageTeam: true,
      canViewAudit: true,
      canExportReports: true,
      canManageBilling: false,
      canAccessAdmin: false,
      canEditSettings: true,
    },
    ...overrides,
  };
}

describe('system-state server helpers', () => {
  it('maps plan keys and role keys into the app-facing enums', () => {
    expect(mapPlanKeyToTier('basic')).toBe('basic');
    expect(mapPlanKeyToTier('pro')).toBe('pro');
    expect(mapPlanKeyToTier('enterprise')).toBe('enterprise');
    expect(mapPlanKeyToTier('unknown')).toBe('trial');

    expect(mapRoleKeyToUserRole('OWNER')).toBe('owner');
    expect(mapRoleKeyToUserRole('COMPLIANCE_OFFICER')).toBe('admin');
    expect(mapRoleKeyToUserRole('STAFF')).toBe('member');
    expect(mapUserRoleToRoleKey('viewer')).toBe('VIEWER');
  });

  it('activates every module for founders regardless of plan restrictions', () => {
    expect(
      calculateModuleState('admin', makeEntitlements({ plan: 'basic' }), 'pending', true),
    ).toBe('active');
  });

  it('restricts modules for past_due subscriptions and for insufficient role', () => {
    expect(
      calculateModuleState('controls', makeEntitlements(), 'past_due', false),
    ).toBe('restricted');

    expect(
      calculateModuleState(
        'settings',
        makeEntitlements({ role: 'member' }),
        'active',
        false,
      ),
    ).toBe('restricted');
  });

  it('locks modules that are not included in the current plan or are canceled', () => {
    expect(
      calculateModuleState('audits', makeEntitlements({ plan: 'basic' }), 'active', false),
    ).toBe('locked');

    expect(
      calculateModuleState('controls', makeEntitlements(), 'canceled', false),
    ).toBe('locked');
  });

  it('calculates a complete module state map', () => {
    const states = calculateAllModuleStates(makeEntitlements(), 'active', false);

    expect(states.size).toBeGreaterThan(0);
    expect(states.get('controls')).toBe('active');
    expect(states.get('admin')).toBeDefined();
  });
});
