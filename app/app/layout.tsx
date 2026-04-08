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
import { AiAssistant } from '@/components/ai-assistant/AiAssistant';
import { NotificationToast } from '@/components/notifications/notification-toast';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard';
import { recoverUserWorkspace } from '@/lib/provisioning/workspace-recovery';
import { EnterpriseTrustStrip } from '@/components/trust/EnterpriseTrustStrip';
import { SecurityTrackingBootstrap } from '@/components/security/SecurityTrackingBootstrap';
import { ControlPlaneRuntimeProvider } from '@/lib/control-plane/runtime-client';
import { RuntimeOpsGuard } from '@/components/control-plane/runtime-ops-guard';
import { RuntimeDebugIndicator } from '@/components/control-plane/runtime-debug-indicator';
import { routeLog } from '@/lib/monitoring/server-logger';
import { FeedbackWidget } from '@/components/feedback/FeedbackWidget';
import { ComplianceStatusStrip } from '@/components/compliance/ComplianceStatusStrip';

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
   * 1) FETCH COMPLETE SYSTEM STATE (server-side, once)
   *    Uses request cache so child pages can reuse the same payload.
   * ----------------------------------------------------- */
  let systemState: Awaited<ReturnType<typeof fetchSystemState>> = null;

  try {
    systemState = await fetchSystemState();
  } catch (err) {
    log.error({ err }, 'fetchSystemState crashed');
  }

  // If state is unavailable, distinguish unauthenticated users from workspace issues.
  if (!systemState) {
    let authUser: { id: string; email?: string | null } | null = null;
    try {
      const supabase = await createSupabaseServerClient();
      const { data } = await supabase.auth.getUser();
      authUser = data?.user ?? null;
    } catch (err) {
      log.error({ err }, 'fallback getUser crashed');
    }

    if (!authUser) {
      redirect('/auth/signin');
    }

    log.warn(
      { userId: authUser.id },
      'No system state — redirecting to workspace recovery',
    );
    const recovery = await recoverUserWorkspace({
      userId: authUser.id,
      userEmail: authUser.email ?? null,
      source: 'app-layout-null-state',
    });
    redirect(
      recovery.nextPath === '/app'
        ? '/workspace-recovery?from=app-layout-null-state'
        : recovery.nextPath,
    );
  }

  // 🔧 FIX: Don't force founders to /admin when they visit /app intentionally.
  // Founders may want to use the regular app (their org's dashboard).
  // Only redirect to /admin if they have NO organization at all.
  // The middleware already allows founders to access /admin, so this is safe.

  // Track whether the onboarding wizard should be shown
  const showOnboardingWizard = !systemState.organization.onboardingCompleted;

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
          {showOnboardingWizard && <OnboardingWizard />}
          <div className="app-shell relative flex min-h-screen w-full overflow-hidden bg-background text-foreground">
            {/* Ambient background */}
            <div className="pointer-events-none absolute inset-x-0 -top-32 h-64 bg-gradient-glow blur-3xl opacity-40" />

            {/* App shell grid */}
            <div className="flex h-full w-full min-w-0">
              {/* Sidebar */}
              <aside className="relative z-30 hidden md:flex h-full w-52 shrink-0 flex-col glass-panel-strong border-r border-border">
                <div className="flex h-12 items-center border-b border-border px-4">
                  <div className="flex items-center gap-2">
                    <Logo variant="mark" size={28} />
                    <div>
                      <div className="text-sm font-bold">{brand.appName}</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 overflow-y-auto">
                  <Sidebar role={systemState.role} />
                </div>
                <div className="border-t border-border px-4 py-3 text-[10px] text-muted-foreground/60">
                  <div className="font-medium">
                    © {new Date().getFullYear()} {brand.appName}
                  </div>
                </div>
              </aside>

              {/* Main application area */}
              <section className="relative flex h-full flex-1 flex-col overflow-hidden">
                <header className="sticky top-0 z-40 flex h-12 w-full items-center glass-panel-strong border-b border-border">
                  <div className="flex h-full w-full items-center px-3 sm:px-6">
                    <TopBar
                      orgName={
                        systemState.organization.name || 'My Organization'
                      }
                      userEmail={systemState.user.email || ''}
                      userId={systemState.user.id}
                      orgId={systemState.organization.id}
                      role={systemState.role}
                    />
                    <ComplianceStatusStrip />
                  </div>
                </header>

                <RuntimeOpsGuard surface="app" />
                <EnterpriseTrustStrip surface="app" />
                <TrialCountdownBanner />

                <main className="relative flex flex-1 flex-col overflow-y-auto bg-background">
                  <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 py-4 pb-[max(env(safe-area-inset-bottom),1rem)] sm:pb-6">
                    {children}
                  </div>
                </main>
              </section>
            </div>

            <CommandPalette />
            <UpgradeModal />
            <UpgradeSuggestionEngine />
            <HelpAssistant />
            <AiAssistant />
            <NotificationToast
              userId={systemState.user.id}
              orgId={systemState.organization.id}
            />
            <SecurityTrackingBootstrap />
            <FeedbackWidget />
            <RuntimeDebugIndicator />
          </div>
        </AppProviders>
      </AppHydrator>
    </ControlPlaneRuntimeProvider>
  );
}
