/**
 * Tests for lib/stores/app.ts
 * Covers: hydrate, clear, initial state, and hook utilities.
 */

// Undo global mock from jest.setup.js so we test the real store
jest.unmock('@/lib/stores/app');

import { useAppStore } from '@/lib/stores/app';

// Reset store between tests
beforeEach(() => {
  useAppStore.getState().clear();
});

describe('AppStore initial state', () => {
  it('starts not hydrated', () => {
    const state = useAppStore.getState();
    expect(state.isHydrated).toBe(false);
    expect(state.isHydrating).toBe(false);
    expect(state.hydrationError).toBeNull();
  });

  it('starts with no user/org/role', () => {
    const state = useAppStore.getState();
    expect(state.user).toBeNull();
    expect(state.organization).toBeNull();
    expect(state.role).toBeNull();
    expect(state.isFounder).toBe(false);
    expect(state.entitlements).toBeNull();
  });
});

describe('AppStore hydrate', () => {
  it('hydrates all fields', () => {
    useAppStore.getState().hydrate({
      user: { id: 'u1', email: 'test@test.com', name: 'Test User' },
      organization: {
        id: 'org1',
        name: 'TestOrg',
        plan: 'pro',
        onboardingCompleted: true,
        industry: 'ndis',
      },
      role: 'admin',
      isFounder: false,
      entitlements: {
        enabledModules: ['compliance', 'incidents'],
        permissions: { 'tasks:write': true },
        trialActive: false,
        trialDaysRemaining: 0,
      },
    });

    const state = useAppStore.getState();
    expect(state.isHydrated).toBe(true);
    expect(state.isHydrating).toBe(false);
    expect(state.user?.id).toBe('u1');
    expect(state.organization?.name).toBe('TestOrg');
    expect(state.role).toBe('admin');
    expect(state.entitlements?.enabledModules).toContain('compliance');
  });

  it('hydrates with null user/org', () => {
    useAppStore.getState().hydrate({
      user: null,
      organization: null,
      role: null,
      isFounder: false,
      entitlements: null,
    });

    const state = useAppStore.getState();
    expect(state.isHydrated).toBe(true);
    expect(state.user).toBeNull();
  });
});

describe('AppStore clear', () => {
  it('resets to initial state', () => {
    useAppStore.getState().hydrate({
      user: { id: 'u1', email: 'a@b.com', name: 'Name' },
      organization: {
        id: 'o1',
        name: 'Org',
        plan: 'trial',
        onboardingCompleted: false,
        industry: null,
      },
      role: 'owner',
      isFounder: true,
      entitlements: null,
    });

    useAppStore.getState().clear();
    const state = useAppStore.getState();
    expect(state.isHydrated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.organization).toBeNull();
    expect(state.role).toBeNull();
    expect(state.isFounder).toBe(false);
  });
});

describe('AppStore setHydrating / setHydrationError', () => {
  it('setHydrating sets isHydrating', () => {
    useAppStore.getState().setHydrating(true);
    expect(useAppStore.getState().isHydrating).toBe(true);
  });

  it('setHydrationError sets error and stops hydrating', () => {
    useAppStore.getState().setHydrating(true);
    useAppStore.getState().setHydrationError('Network timeout');
    expect(useAppStore.getState().hydrationError).toBe('Network timeout');
    expect(useAppStore.getState().isHydrating).toBe(false);
  });
});
