'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/lib/stores/app';

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
    organization: { id: string; name: string; plan: string; onboardingCompleted: boolean };
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

  return <>{children}</>;
}
