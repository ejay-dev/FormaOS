/**
 * @jest-environment jsdom
 */

/* ------------------------------------------------------------------ */
/*  Tests for lib/trial/use-trial-state.ts                            */
/*  Covers: useTrialState — all status derivations, feature locks,    */
/*          upgrade suggestions, and billing permission checks.       */
/* ------------------------------------------------------------------ */

import { renderHook } from '@testing-library/react';

// ---- Mock useAppStore -----------------------------------------------
let mockEntitlements: any = null;
let mockOrganization: any = null;
let mockRole: any = null;

jest.mock('@/lib/stores/app', () => ({
  useAppStore: jest.fn((selector: Function) => {
    const state = {
      entitlements: mockEntitlements,
      organization: mockOrganization,
      role: mockRole,
    };
    return selector(state);
  }),
}));

// ---- Import after mock -------
import { useTrialState } from '@/lib/trial/use-trial-state';

// ---- Helpers --------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
  mockEntitlements = null;
  mockOrganization = null;
  mockRole = null;
  localStorage.clear();
});

// ---- Status derivation -----------------------------------------------

describe('useTrialState – status derivation', () => {
  it('returns not_applicable when plan is paid and trial not active', () => {
    mockEntitlements = { trialActive: false, trialDaysRemaining: 0 };
    mockOrganization = { plan: 'pro' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.status).toBe('not_applicable');
    expect(result.current.isTrialUser).toBe(false);
  });

  it('returns not_applicable for basic plan (converted path unreachable)', () => {
    mockEntitlements = { trialActive: false, trialDaysRemaining: 0 };
    mockOrganization = { plan: 'basic' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    // The not_applicable check fires before converted
    expect(result.current.status).toBe('not_applicable');
    expect(result.current.isTrialUser).toBe(false);
  });

  it('returns not_applicable for enterprise', () => {
    mockEntitlements = { trialActive: false, trialDaysRemaining: 0 };
    mockOrganization = { plan: 'enterprise' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.status).toBe('not_applicable');
  });

  it('returns expired when trial inactive, days <= 0, plan trial', () => {
    mockEntitlements = { trialActive: false, trialDaysRemaining: 0 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.status).toBe('expired');
    expect(result.current.isExpired).toBe(true);
    expect(result.current.isTrialUser).toBe(true);
  });

  it('returns last_day when days remaining <= 1', () => {
    mockEntitlements = { trialActive: true, trialDaysRemaining: 1 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.status).toBe('last_day');
    expect(result.current.showUpgradeUrgency).toBe(true);
  });

  it('returns urgent when days remaining <= 3', () => {
    mockEntitlements = { trialActive: true, trialDaysRemaining: 2 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.status).toBe('urgent');
    expect(result.current.showUpgradeUrgency).toBe(true);
  });

  it('returns expiring_soon when days remaining <= 5', () => {
    mockEntitlements = { trialActive: true, trialDaysRemaining: 4 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.status).toBe('expiring_soon');
    expect(result.current.showUpgradeUrgency).toBe(false);
  });

  it('returns active when days remaining > 5', () => {
    mockEntitlements = { trialActive: true, trialDaysRemaining: 10 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.status).toBe('active');
    expect(result.current.isTrialUser).toBe(true);
    expect(result.current.showBanner).toBe(true);
  });

  it('defaults entitlements to false/0 when null', () => {
    mockEntitlements = null;
    mockOrganization = null;
    mockRole = null;

    const { result } = renderHook(() => useTrialState());
    // plan defaults to 'trial', trialActive=false, days=0 → expired
    expect(result.current.status).toBe('expired');
  });
});

// ---- UI flags -------------------------------------------------------

describe('useTrialState – UI flags', () => {
  it('showBanner is false when expired', () => {
    mockEntitlements = { trialActive: false, trialDaysRemaining: 0 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.showBanner).toBe(false);
  });

  it('showBanner is true when trial is active', () => {
    mockEntitlements = { trialActive: true, trialDaysRemaining: 10 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.showBanner).toBe(true);
  });

  it('canManageBilling true for owner', () => {
    mockEntitlements = { trialActive: true, trialDaysRemaining: 10 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'owner';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.canManageBilling).toBe(true);
  });

  it('canManageBilling true for admin', () => {
    mockEntitlements = { trialActive: true, trialDaysRemaining: 10 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'admin';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.canManageBilling).toBe(true);
  });

  it('canManageBilling false for member', () => {
    mockEntitlements = { trialActive: true, trialDaysRemaining: 10 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.canManageBilling).toBe(false);
  });

  it('canManageBilling false for viewer', () => {
    mockEntitlements = { trialActive: true, trialDaysRemaining: 10 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'viewer';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.canManageBilling).toBe(false);
  });
});

// ---- Feature lock helpers -------------------------------------------

describe('useTrialState – isFeatureLocked / isFeatureAccessible', () => {
  it('isFeatureLocked returns false when not expired', () => {
    mockEntitlements = { trialActive: true, trialDaysRemaining: 10 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.isFeatureLocked('reports')).toBe(false);
  });

  it('isFeatureLocked returns true for soft-locked feature when expired', () => {
    mockEntitlements = { trialActive: false, trialDaysRemaining: 0 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.isFeatureLocked('reports')).toBe(true);
    expect(result.current.isFeatureLocked('audits')).toBe(true);
    expect(result.current.isFeatureLocked('vault')).toBe(true);
    expect(result.current.isFeatureLocked('registers')).toBe(true);
    expect(result.current.isFeatureLocked('team')).toBe(true);
    expect(result.current.isFeatureLocked('automation')).toBe(true);
  });

  it('isFeatureLocked returns false for non-locked feature when expired', () => {
    mockEntitlements = { trialActive: false, trialDaysRemaining: 0 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.isFeatureLocked('controls')).toBe(false);
    expect(result.current.isFeatureLocked('settings')).toBe(false);
  });

  it('isFeatureAccessible returns true when not expired', () => {
    mockEntitlements = { trialActive: true, trialDaysRemaining: 10 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.isFeatureAccessible('reports')).toBe(true);
  });

  it('isFeatureAccessible returns true for always-accessible feature when expired', () => {
    mockEntitlements = { trialActive: false, trialDaysRemaining: 0 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.isFeatureAccessible('controls')).toBe(true);
    expect(result.current.isFeatureAccessible('evidence')).toBe(true);
    expect(result.current.isFeatureAccessible('policies')).toBe(true);
    expect(result.current.isFeatureAccessible('tasks')).toBe(true);
    expect(result.current.isFeatureAccessible('settings')).toBe(true);
    expect(result.current.isFeatureAccessible('billing')).toBe(true);
  });

  it('isFeatureAccessible returns false for non-accessible feature when expired', () => {
    mockEntitlements = { trialActive: false, trialDaysRemaining: 0 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.isFeatureAccessible('reports')).toBe(false);
  });
});

// ---- Upgrade suggestion helpers ------------------------------------

describe('useTrialState – upgrade suggestion', () => {
  it('shouldShowUpgradeSuggestion returns false when not trial user', () => {
    mockEntitlements = { trialActive: false, trialDaysRemaining: 0 };
    mockOrganization = { plan: 'pro' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.shouldShowUpgradeSuggestion()).toBe(false);
  });

  it('shouldShowUpgradeSuggestion returns false when expired', () => {
    mockEntitlements = { trialActive: false, trialDaysRemaining: 0 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.shouldShowUpgradeSuggestion()).toBe(false);
  });

  it('shouldShowUpgradeSuggestion returns true when active trial, no dismiss', () => {
    mockEntitlements = { trialActive: true, trialDaysRemaining: 10 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current.shouldShowUpgradeSuggestion()).toBe(true);
  });

  it('shouldShowUpgradeSuggestion returns false within cooldown', () => {
    mockEntitlements = { trialActive: true, trialDaysRemaining: 10 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    // Recent dismiss
    localStorage.setItem(
      'formaos_upgrade_dismissed_at',
      String(Date.now() - 1000),
    );

    const { result } = renderHook(() => useTrialState());
    expect(result.current.shouldShowUpgradeSuggestion()).toBe(false);
  });

  it('shouldShowUpgradeSuggestion returns true after cooldown expires', () => {
    mockEntitlements = { trialActive: true, trialDaysRemaining: 10 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    // Dismissed 5 hours ago (cooldown is 4 hours)
    localStorage.setItem(
      'formaos_upgrade_dismissed_at',
      String(Date.now() - 5 * 60 * 60 * 1000),
    );

    const { result } = renderHook(() => useTrialState());
    expect(result.current.shouldShowUpgradeSuggestion()).toBe(true);
  });

  it('dismissUpgradeSuggestion sets localStorage', () => {
    mockEntitlements = { trialActive: true, trialDaysRemaining: 10 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    result.current.dismissUpgradeSuggestion();

    const val = localStorage.getItem('formaos_upgrade_dismissed_at');
    expect(val).toBeTruthy();
    expect(Number(val)).toBeGreaterThan(0);
  });
});

// ---- Return values --------------------------------------------------

describe('useTrialState – return shape', () => {
  it('returns all expected fields', () => {
    mockEntitlements = { trialActive: true, trialDaysRemaining: 10 };
    mockOrganization = { plan: 'trial' };
    mockRole = 'member';

    const { result } = renderHook(() => useTrialState());
    expect(result.current).toMatchObject({
      status: expect.any(String),
      daysRemaining: 10,
      isTrialUser: true,
      isExpired: false,
      trialActive: true,
      plan: 'trial',
      showBanner: true,
      showUpgradeUrgency: false,
      canManageBilling: false,
      isFeatureLocked: expect.any(Function),
      isFeatureAccessible: expect.any(Function),
      shouldShowUpgradeSuggestion: expect.any(Function),
      dismissUpgradeSuggestion: expect.any(Function),
    });
  });
});
