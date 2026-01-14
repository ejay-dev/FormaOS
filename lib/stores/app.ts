import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

/**
 * =========================================================
 * APP GLOBAL STATE STORE (Zustand)
 * =========================================================
 * 
 * This store holds shared application state that should
 * persist across sidebar navigation without re-fetching:
 * 
 * - User info (id, email, name)
 * - Organization (id, name, plan)
 * - Role & permissions
 * - Feature entitlements
 * - Trial status
 * 
 * Fetched ONCE after login, then reused everywhere.
 * Eliminates duplicate Supabase queries per page.
 */

export interface AppUser {
  id: string;
  email: string;
  name: string;
}

export interface AppOrganization {
  id: string;
  name: string;
  plan: string; // 'trial' | 'basic' | 'pro' | 'enterprise'
  onboardingCompleted: boolean;
}

export interface AppEntitlements {
  enabledModules: string[];
  permissions: Record<string, boolean>;
  trialActive: boolean;
  trialDaysRemaining: number;
}

export interface AppState {
  // Hydration status
  isHydrated: boolean;
  isHydrating: boolean;
  hydrationError: string | null;

  // User & Organization
  user: AppUser | null;
  organization: AppOrganization | null;
  role: 'owner' | 'admin' | 'member' | 'staff' | 'viewer' | 'auditor' | null;
  isFounder: boolean;

  // Entitlements
  entitlements: AppEntitlements | null;

  // Actions
  hydrate: (state: {
    user: AppUser | null;
    organization: AppOrganization | null;
    role: 'owner' | 'admin' | 'member' | 'staff' | 'viewer' | 'auditor' | null;
    isFounder: boolean;
    entitlements: AppEntitlements | null;
  }) => void;
  setHydrating: (isHydrating: boolean) => void;
  setHydrationError: (error: string | null) => void;
  clear: () => void;
}

const createInitialState = (): AppState => ({
  isHydrated: false,
  isHydrating: false,
  hydrationError: null,
  user: null,
  organization: null,
  role: null,
  isFounder: false,
  entitlements: null,
  hydrate: () => {},
  setHydrating: () => {},
  setHydrationError: () => {},
  clear: () => {},
});

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set) => {
    const initialState = createInitialState();
    return {
      ...initialState,

      hydrate: (state) => {
      set({
        user: state.user,
        organization: state.organization,
        role: state.role,
        isFounder: state.isFounder,
        entitlements: state.entitlements,
        isHydrated: true,
        isHydrating: false,
        hydrationError: null,
      });
    },

    setHydrating: (isHydrating) => {
      set({ isHydrating });
    },

    setHydrationError: (error) => {
      set({ hydrationError: error, isHydrating: false });
    },

    clear: () => {
      set(createInitialState());
    },
    };
  })
);

/**
 * Hook to check if user has a specific permission
 */
export function useHasPermission(permissionKey: string): boolean {
  const entitlements = useAppStore((state) => state.entitlements);
  return entitlements?.permissions?.[permissionKey] ?? false;
}

/**
 * Hook to check if module is enabled
 */
export function useIsModuleEnabled(moduleId: string): boolean {
  const enabledModules = useAppStore((state) => state.entitlements?.enabledModules);
  return enabledModules?.includes(moduleId) ?? false;
}

/**
 * Hook to get user's organization ID
 */
export function useOrgId(): string | null {
  return useAppStore((state) => state.organization?.id ?? null);
}

/**
 * Hook to get user's role
 */
export function useUserRole(): AppState['role'] {
  return useAppStore((state) => state.role);
}

/**
 * Hook to check if user is founder
 */
export function useIsFounder(): boolean {
  return useAppStore((state) => state.isFounder);
}
