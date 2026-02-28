'use client';

/**
 * =========================================================
 * APP PROVIDERS — Composited context tree for the app shell
 * =========================================================
 * Encapsulates all client-side providers required by the
 * authenticated app shell in a single component, keeping
 * app/app/layout.tsx readable and reducing visual nesting.
 *
 * Provider order matters — inner providers may consume outer ones:
 *   ProductTourProvider  → reads useAppStore (via AppHydrator above)
 *   SystemStateProvider  → receives server initialState
 *   CommandProvider      → independent, provides command palette state
 *   ComplianceSystemProvider → reads SystemStateProvider
 *   HelpAssistantProvider    → independent, provides help panel state
 *   AppShellErrorBoundary    → outermost error boundary inside providers
 * =========================================================
 */

import { ProductTourProvider } from '@/lib/onboarding/product-tour';
import { SystemStateProvider } from '@/lib/system-state/context';
import { CommandProvider } from '@/components/ui/command-provider';
import { ComplianceSystemProvider } from '@/components/compliance-system/provider';
import { HelpAssistantProvider } from '@/components/help/help-assistant-context';
import { AppShellErrorBoundary } from '@/components/app-shell-error-boundary';
import type { SystemState, UserEntitlements } from '@/lib/system-state/types';

interface AppProvidersProps {
  children: React.ReactNode;
  /** Passed straight through to SystemStateProvider — must match its expected shape. */
  initialState: {
    user: NonNullable<SystemState['user']>;
    organization: NonNullable<SystemState['organization']>;
    entitlements: UserEntitlements;
    isFounder: boolean;
  };
}

export function AppProviders({ children, initialState }: AppProvidersProps) {
  return (
    <ProductTourProvider>
      <SystemStateProvider initialState={initialState}>
        <CommandProvider>
          <ComplianceSystemProvider>
            <HelpAssistantProvider>
              <AppShellErrorBoundary>
                {children}
              </AppShellErrorBoundary>
            </HelpAssistantProvider>
          </ComplianceSystemProvider>
        </CommandProvider>
      </SystemStateProvider>
    </ProductTourProvider>
  );
}
