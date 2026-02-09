import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { TopBar } from '@/components/topbar';
import { CommandMenu } from '@/components/command-menu';
import { CommandProvider } from '@/components/ui/command-provider';
import { ComplianceSystemProvider } from '@/components/compliance-system/provider';
import { SystemStateProvider } from '@/lib/system-state/context';
import { AppHydrator } from '@/components/app-hydrator';
import { fetchSystemState } from '@/lib/system-state/server';
import { resolvePlanKey } from '@/lib/plans';
import { normalizeRole } from '@/app/app/actions/rbac';
import { TrialCountdownBanner } from '@/components/billing/TrialCountdownBanner';
import { UpgradeModal } from '@/components/billing/UpgradeModal';
import { UpgradeSuggestionEngine } from '@/components/billing/UpgradeSuggestionEngine';
import { brand } from '@/config/brand';
import { Logo } from '@/components/brand/Logo';
import { HelpAssistantProvider } from '@/components/help/help-assistant-context';
import { HelpAssistant } from '@/components/help/HelpAssistant';
import { AppShellErrorBoundary } from '@/components/app-shell-error-boundary';

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
    console.error('[AppLayout] getUser crashed:', err);
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
    console.error('[AppLayout] fetchSystemState crashed:', err);
  }

  // If we can't build state, send to onboarding rather than crashing
  if (!systemState) {
    console.warn('[AppLayout] No system state — redirecting to /onboarding');
    redirect('/onboarding');
  }

  // 🔧 FIX: Don't force founders to /admin when they visit /app intentionally.
  // Founders may want to use the regular app (their org's dashboard).
  // Only redirect to /admin if they have NO organization at all.
  // The middleware already allows founders to access /admin, so this is safe.

  // Validate onboarding completion
  if (!systemState.organization.onboardingCompleted) {
    redirect('/onboarding');
  }

  /* -------------------------------------------------------
   * 3) APPLICATION FRAME
   *    - AppHydrator: seeds Zustand store (client-side cache)
   *    - SystemStateProvider: React context (direct, no 2nd fetch)
   *    - AppShellErrorBoundary: catches render errors in the shell
   * ----------------------------------------------------- */
  return (
    <AppHydrator
      initialState={{
        user: systemState.user,
        organization: systemState.organization,
        role: systemState.role,
        isFounder: systemState.isFounder,
        entitlements: systemState.entitlements,
      }}
    >
      <SystemStateProvider
        initialState={{
          user: systemState.user,
          organization: systemState.organization,
          entitlements: systemState.entitlements,
          isFounder: systemState.isFounder,
        }}
      >
        <CommandProvider>
          <ComplianceSystemProvider>
            <HelpAssistantProvider>
              <AppShellErrorBoundary>
                <div className="relative flex min-h-screen w-full overflow-hidden bg-background text-foreground">
                  {/* Ambient background effects */}
                  <div className="pointer-events-none absolute inset-x-0 -top-32 h-64 bg-gradient-glow blur-3xl opacity-40" />

                  {/* App shell grid */}
                  <div className="flex h-full w-full min-w-0">
                    {/* Sidebar */}
                    <aside className="relative z-30 hidden md:flex h-full w-[280px] shrink-0 flex-col glass-panel-strong border-r border-border">
                      {/* Sidebar header */}
                      <div className="flex h-20 items-center border-b border-border px-6">
                        <div className="flex items-center gap-3">
                          <Logo variant="mark" size={40} />
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

                      {/* Sidebar navigation */}
                      <div className="flex flex-1 overflow-y-auto">
                        <Sidebar role={systemState.role} />
                      </div>

                      {/* Sidebar footer */}
                      <div className="border-t border-border px-6 py-5 text-xs text-muted-foreground">
                        <div className="font-medium">
                          © {new Date().getFullYear()} {brand.appName}
                        </div>
                        <div className="mt-1.5">{brand.identity}</div>
                      </div>
                    </aside>

                    {/* Main application area */}
                    <section className="relative flex h-full flex-1 flex-col overflow-hidden">
                      {/* Top bar */}
                      <header className="sticky top-0 z-40 flex h-16 md:h-20 w-full items-center glass-panel-strong border-b border-border">
                        <div className="flex h-full w-full items-center px-4 sm:px-6 lg:px-8">
                          <TopBar
                            orgName={
                              systemState.organization.name || 'My Organization'
                            }
                            userEmail={systemState.user.email || ''}
                            userId={systemState.user.id}
                            orgId={systemState.organization.id}
                            role={systemState.role}
                          />
                        </div>
                      </header>

                      {/* Trial Countdown Banner (conversion system) */}
                      <TrialCountdownBanner />

                      {/* Main content */}
                      <main className="relative flex flex-1 flex-col overflow-y-auto bg-background">
                        {/* Page container with better spacing */}
                        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                          {children}
                        </div>
                      </main>
                    </section>
                  </div>

                  {/* Command palette */}
                  <CommandMenu />

                  {/* Trial conversion system (non-blocking) */}
                  <UpgradeModal />
                  <UpgradeSuggestionEngine />

                  {/* In-app help */}
                  <HelpAssistant />
                </div>
              </AppShellErrorBoundary>
            </HelpAssistantProvider>
          </ComplianceSystemProvider>
        </CommandProvider>
      </SystemStateProvider>
    </AppHydrator>
  );
}
