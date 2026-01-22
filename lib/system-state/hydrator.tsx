import { fetchSystemState } from './server';
import { SystemStateProvider } from './context';
import type { UserEntitlements } from './types';
import { headers } from 'next/headers';

/**
 * =========================================================
 * SYSTEM STATE HYDRATOR
 * =========================================================
 *
 * Server component that fetches system state and provides it
 * to the client-side SystemStateProvider.
 *
 * Usage in layout.tsx:
 * ```tsx
 * import { SystemStateHydrator } from "@/lib/system-state/hydrator";
 *
 * export default function AppLayout({ children }) {
 *   return (
 *     <SystemStateHydrator>
 *       {children}
 *     </SystemStateHydrator>
 *   );
 * }
 * ```
 */

interface SystemStateHydratorProps {
  children: React.ReactNode;
  publicRoute?: boolean; // Flag to indicate if this is a public route
}

export async function SystemStateHydrator({
  children,
  publicRoute = false,
}: SystemStateHydratorProps) {
  // For public routes, don't attempt to fetch system state
  // This prevents auth errors on public pages
  if (publicRoute) {
    return <SystemStateProvider>{children}</SystemStateProvider>;
  }

  try {
    const systemState = await fetchSystemState();

    // If no system state (not authenticated), provide empty provider
    if (!systemState) {
      return <SystemStateProvider>{children}</SystemStateProvider>;
    }

    // Provide hydrated state to provider
    return (
      <SystemStateProvider
        initialState={{
          user: systemState.user,
          organization: systemState.organization,
          entitlements: systemState.entitlements,
          isFounder: systemState.isFounder,
        }}
      >
        {children}
      </SystemStateProvider>
    );
  } catch (error) {
    // Gracefully handle errors by providing empty provider
    console.error('[SystemStateHydrator] Error fetching system state:', error);
    return <SystemStateProvider>{children}</SystemStateProvider>;
  }
}

/**
 * Helper to get system state in server components
 * Use this when you need access to system state in a page/layout
 */
export { fetchSystemState } from './server';
