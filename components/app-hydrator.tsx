'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/stores/app';

// Don't re-fetch entitlements more than once per this window even if the
// user rapidly tabs the FormaOS window in and out. Tab focus is the
// signal; this debounces noise.
const ENTITLEMENT_REFRESH_MIN_INTERVAL_MS = 30_000;

/**
 * =========================================================
 * APP HYDRATOR COMPONENT
 * =========================================================
 * 
 * Wraps the app shell and hydrates global state once on mount.
 * 
 * This replaces the per-page Supabase fetches with a single
 * hydration call.
 * 
 * Flow:
 * 1. Component mounts
 * 2. Checks if already hydrated (fast path)
 * 3. If not, calls /api/system-state
 * 4. Stores result in Zustand
 * 5. Children render with cached data
 * 
 * Performance:
 * - First render: ~80-120ms (API call)
 * - Sidebar navigation: <5ms (Zustand store lookup)
 */

interface AppHydratorProps {
  children: React.ReactNode;
  // Server-side state can be passed to skip API call
  initialState?: {
    user: { id: string; email: string; name: string };
    organization: { id: string; name: string; plan: string; onboardingCompleted: boolean; industry: string | null };
    role: 'owner' | 'admin' | 'member' | 'staff' | 'viewer' | 'auditor';
    isFounder: boolean;
    entitlements: {
      enabledModules: string[];
      permissions: Record<string, boolean>;
      trialActive: boolean;
      trialDaysRemaining: number;
    };
  };
}

export function AppHydrator({ children, initialState }: AppHydratorProps) {
  const isHydrated = useAppStore((state) => state.isHydrated);
  const hydrate = useAppStore((state) => state.hydrate);
  const refreshEntitlements = useAppStore(
    (state) => state.refreshEntitlements,
  );
  const setHydrating = useAppStore((state) => state.setHydrating);
  const setHydrationError = useAppStore((state) => state.setHydrationError);

  useEffect(() => {
    // Fast path: already hydrated
    if (isHydrated) {
      return;
    }

    // If initial state provided (from server), use it immediately
    if (initialState) {
      hydrate(initialState);
      return;
    }

    // Slow path: fetch from API
    async function fetchAndHydrate() {
      try {
        setHydrating(true);

        const response = await fetch('/api/system-state');

        if (!response.ok) {
          throw new Error(`Hydration failed: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        hydrate({
          user: data.user,
          organization: data.organization,
          role: data.role,
          isFounder: data.isFounder,
          entitlements: data.entitlements,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[AppHydrator] Hydration failed:', message);
        setHydrationError(message);
        // Don't block render on hydration failure
        // App can still function with partial state
      }
    }

    fetchAndHydrate();
  }, [isHydrated, initialState, hydrate, setHydrating, setHydrationError]);

  // Refresh the entitlement/subscription slice whenever the tab regains
  // focus. Addresses the bug where Stripe-side state (trial expiry, plan
  // upgrade, cancellation) lands while the user has FormaOS open in a
  // background tab — without this, FeatureGate / useTrialState keep
  // showing the pre-event state until a full reload.
  //
  // Scope: refresh-only-on-visible. No polling, no work when the tab is
  // hidden. Debounced via entitlementsRefreshedAt so rapid tab in/out
  // doesn't fan out to a burst of /api/system-state hits.
  useEffect(() => {
    if (typeof document === 'undefined') return;

    async function refresh() {
      const last = useAppStore.getState().entitlementsRefreshedAt;
      if (last && Date.now() - last < ENTITLEMENT_REFRESH_MIN_INTERVAL_MS) {
        return;
      }
      try {
        const response = await fetch('/api/system-state');
        if (!response.ok) return;
        const data = await response.json();
        if (data?.error) return;
        refreshEntitlements({
          organization: data.organization
            ? {
                plan: data.organization.plan,
                onboardingCompleted: data.organization.onboardingCompleted,
              }
            : null,
          entitlements: data.entitlements ?? null,
        });
      } catch (error) {
        // Silent: the existing state is still usable; a real next-render
        // will pick up fresh data anyway.
        console.warn(
          '[AppHydrator] entitlement focus-refresh failed:',
          error instanceof Error ? error.message : 'Unknown error',
        );
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        void refresh();
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [refreshEntitlements]);

  // NOTE: founder status is intentionally NOT persisted to localStorage.
  // Founder gating is enforced server-side (proxy.ts admin guard,
  // requireAdminAccess, isFounder env allowlist). Client code that needs
  // the hint should read it from useAppStore (hydrated from /api/system-state),
  // not from a spoofable localStorage value.

  return <>{children}</>;
}
