import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/topbar';
import { CommandPalette } from '@/components/command-palette/CommandPalette';
import { AppHydrator } from '@/components/app-hydrator';
import { AppProviders } from '@/components/app-providers';
import { fetchSystemState } from '@/lib/system-state/server';
import { TrialCountdownBanner } from '@/components/billing/TrialCountdownBanner';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { UpgradeSuggestionEngine } from '@/components/billing/UpgradeSuggestionEngine';
import { brand } from '@/config/brand';
import { Logo } from '@/components/brand/Logo';
import { HelpAssistant } from '@/components/help/HelpAssistant';
import { recoverUserWorkspace } from '@/lib/provisioning/workspace-recovery';
import { EnterpriseTrustStrip } from '@/components/trust/EnterpriseTrustStrip';
import { SecurityTrackingBootstrap } from '@/components/security/SecurityTrackingBootstrap';
import { ControlPlaneRuntimeProvider } from '@/lib/control-plane/runtime-client';
import { RuntimeOpsGuard } from '@/components/control-plane/runtime-ops-guard';
import { RuntimeDebugIndicator } from '@/components/control-plane/runtime-debug-indicator';
import { routeLog } from '@/lib/monitoring/server-logger';

const log = routeLog('app/layout');

// Force dynamic rendering for all /app/* routes
// Required because this layout uses cookies() via Supabase auth
export const dynamic = 'force-dynamic';

/**
 * =========================================================
 * FORMAOS – ENTERPRISE APPLICATION SHELL
 * =========================================================
 *
 * PERFORMANCE OPTIMIZED
 *
 * This layout:
 * 1. Validates auth & org status (server-only)
 * 2. Fetches state ONCE via fetchSystemState()
 * 3. Passes state to AppHydrator for client-side caching
 * 4. Sidebar/pages then use cached state, NOT server queries
 *
 * ✅ Eliminates duplicate org_members, organizations queries
 * ✅ Sidebar navigation becomes instant (<100ms)
 * ✅ No spinner for page transitions
 * =========================================================
 */

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  /* -------------------------------------------------------
   * 1) AUTHENTICATION — fail-soft
   * ----------------------------------------------------- */
  let user: { id: string; email?: string | null } | null = null;

  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch (err) {
    log.error({ err }, 'getUser crashed');
  }

  if (!user) {
    redirect('/auth/signin');
  }

  /* -------------------------------------------------------
   * 2) FETCH COMPLETE SYSTEM STATE (server-side, once)
   *    Pass user to avoid duplicate getUser() call.
   * ----------------------------------------------------- */
  let systemState: Awaited<ReturnType<typeof fetchSystemState>> = null;

  try {
    systemState = await fetchSystemState(user);
  } catch (err) {
    log.error({ err, userId: user.id }, 'fetchSystemState crashed');
  }

  // If we can't build state, send to onboarding rather than crashing.
  // Add ?from=app to prevent /onboarding → /app → /onboarding infinite loop.
  if (!systemState) {
    log.warn({ userId: user.id }, 'No system state — redirecting to workspace recovery');
    redirect('/workspace-recovery?from=app-layout-null-state');
  }

  // 🔧 FIX: Don't force founders to /admin when they visit /app intentionally.
  // Founders may want to use the regular app (their org's dashboard).
  // Only redirect to /admin if they have NO organization at all.
  // The middleware already allows founders to access /admin, so this is safe.

  // Validate onboarding completion
  if (!systemState.organization.onboardingCompleted) {
    const recovery = await recoverUserWorkspace({
      userId: user.id,
      userEmail: user.email ?? null,
      source: 'app-layout-onboarding-guard',
    });
    redirect(
      recovery.nextPath === '/app'
        ? '/workspace-recovery?from=app-layout-onboarding-loop'
        : recovery.nextPath,
    );
  }

  /* -------------------------------------------------------
   * 3) APPLICATION FRAME
   *    - ControlPlaneRuntimeProvider: live feature-flag stream
   *    - AppHydrator: seeds Zustand store from server state
   *    - AppProviders: composes the remaining 5 context layers
   * ----------------------------------------------------- */
  return (
    <ControlPlaneRuntimeProvider>
      <AppHydrator
        initialState={{
          user: systemState.user,
          organization: systemState.organization,
          role: systemState.role,
          isFounder: systemState.isFounder,
          entitlements: systemState.entitlements,
        }}
      >
        <AppProviders
          initialState={{
            user: systemState.user,
            organization: systemState.organization,
            entitlements: systemState.entitlements,
            isFounder: systemState.isFounder,
          }}
        >
          <div className="relative flex min-h-screen w-full overflow-hidden bg-background text-foreground">
            {/* Ambient background */}
            <div className="pointer-events-none absolute inset-x-0 -top-32 h-64 bg-gradient-glow blur-3xl opacity-40" />

            {/* App shell grid */}
            <div className="flex h-full w-full min-w-0">
              {/* Sidebar */}
              <aside className="relative z-30 hidden md:flex h-full w-[280px] shrink-0 flex-col glass-panel-strong border-r border-border">
                <div className="flex h-20 items-center border-b border-border px-6">
                  <div className="flex items-center gap-3">
                    <Logo variant="mark" size={48} />
                    <div>
                      <div className="text-base font-bold font-display">
                        {brand.appName}
                      </div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">
                        {brand.identity}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 overflow-y-auto">
                  <Sidebar role={systemState.role} />
                </div>
                <div className="border-t border-border px-6 py-5 text-xs text-muted-foreground">
                  <div className="font-medium">
                    © {new Date().getFullYear()} {brand.appName}
                  </div>
                  <div className="mt-1.5">{brand.identity}</div>
                </div>
              </aside>

              {/* Main application area */}
              <section className="relative flex h-full flex-1 flex-col overflow-hidden">
                <header className="sticky top-0 z-40 flex h-16 w-full items-center glass-panel-strong border-b border-border">
                  <div className="flex h-full w-full items-center px-4 sm:px-6 lg:px-8">
                    <TopBar
                      orgName={systemState.organization.name || 'My Organization'}
                      userEmail={systemState.user.email || ''}
                      userId={systemState.user.id}
                      orgId={systemState.organization.id}
                      role={systemState.role}
                    />
                  </div>
                </header>

                <RuntimeOpsGuard surface="app" />
                <EnterpriseTrustStrip surface="app" />
                <TrialCountdownBanner />

                <main className="relative flex flex-1 flex-col overflow-y-auto bg-background">
                  <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                    {children}
                  </div>
                </main>
              </section>
            </div>

            <CommandPalette />
            <UpgradeModal />
            <UpgradeSuggestionEngine />
            <HelpAssistant />
            <SecurityTrackingBootstrap />
            <RuntimeDebugIndicator />
          </div>
        </AppProviders>
      </AppHydrator>
    </ControlPlaneRuntimeProvider>
  );
}
