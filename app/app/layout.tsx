import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { CommandMenu } from "@/components/command-menu";
import { CommandProvider } from "@/components/ui/command-provider";
import { ComplianceSystemProvider } from "@/components/compliance-system/provider";
import { SystemStateHydrator } from "@/lib/system-state/hydrator";
import { resolvePlanKey } from "@/lib/plans";
import { normalizeRole } from "@/app/app/actions/rbac";

/**
 * =========================================================
 * FORMAOS – ENTERPRISE APPLICATION SHELL
 * =========================================================
 * This layout is the structural backbone of the product UI.
 *
 * Goals:
 *  - Preserve authentication & org context
 *  - Provide scalable layout zones
 *  - Create visual hierarchy for enterprise dashboards
 *  - Allow future expansion (alerts, banners, widgets, modals)
 *
 * No business logic is altered here.
 * This is pure application infrastructure.
 * =========================================================
 */

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();

  /* -------------------------------------------------------
   * 1) AUTHENTICATION
   * ----------------------------------------------------- */
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  /* -------------------------------------------------------
   * 1.5) CHECK IF USER IS A FOUNDER - Redirect to admin
   * ----------------------------------------------------- */
  console.log("[app/layout] 🔧 ENV CHECK", {
    FOUNDER_EMAILS_raw: process.env.FOUNDER_EMAILS,
    FOUNDER_EMAILS_type: typeof process.env.FOUNDER_EMAILS,
    FOUNDER_USER_IDS_raw: process.env.FOUNDER_USER_IDS,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });
  
  const parseEnvList = (value?: string | null) =>
    new Set(
      (value ?? "")
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean)
    );

  const founderEmails = parseEnvList(process.env.FOUNDER_EMAILS);
  const founderIds = parseEnvList(process.env.FOUNDER_USER_IDS);
  const userEmail = (user?.email ?? "").trim().toLowerCase();
  const userId = (user?.id ?? "").trim().toLowerCase();
  const isFounder = Boolean(
    user && ((userEmail && founderEmails.has(userEmail)) || founderIds.has(userId))
  );

  // 🔍 DEBUG LOGGING
  console.log("[app/layout] Founder check", {
    email: userEmail,
    isFounder,
    founderEmailsConfigured: founderEmails.size > 0,
    founderEmailsSize: founderEmails.size,
    founderEmailsArray: Array.from(founderEmails),
    emailMatch: founderEmails.has(userEmail),
  });

  // Founders should not be in the app layout - redirect to admin
  if (isFounder) {
    console.log("[app/layout] ✅ FOUNDER redirecting to /admin", { email: userEmail });
    redirect("/admin");
  }

  /* -------------------------------------------------------
   * 2) ORGANIZATION CONTEXT
   * ----------------------------------------------------- */
  const { data: membership } = await supabase
    .from("org_members")
    .select("organization_id, role, organizations(name, plan_key, industry, onboarding_completed, frameworks)")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.organization_id) {
    redirect("/onboarding");
  }

  const organizations = membership?.organizations as any;
  const orgRecord = Array.isArray(organizations) ? organizations[0] : organizations;
  const orgName = orgRecord?.name;
  const orgPlan = resolvePlanKey(orgRecord?.plan_key ?? null);
  const orgIndustry = orgRecord?.industry;
  const orgFrameworks = orgRecord?.frameworks;
  const onboardingComplete = orgRecord?.onboarding_completed;
  const roleKey = normalizeRole(membership.role ?? null);

  const hasFrameworks = Array.isArray(orgFrameworks) ? orgFrameworks.length > 0 : false;

  if (!orgPlan || !orgIndustry || !onboardingComplete || !hasFrameworks) {
    const planQuery = orgPlan ? `?plan=${encodeURIComponent(orgPlan)}` : "";
    redirect(`/onboarding${planQuery}`);
  }

  /* -------------------------------------------------------
   * 3) APPLICATION FRAME
   * ----------------------------------------------------- */
  return (
    <SystemStateHydrator>
      <CommandProvider>
        <ComplianceSystemProvider>
          <div className="relative flex h-screen w-full overflow-hidden bg-background text-foreground">
            {/* Ambient background effects */}
            <div className="pointer-events-none absolute inset-x-0 -top-32 h-64 bg-gradient-glow blur-3xl opacity-40" />
            
            {/* App shell grid */}
            <div className="flex h-full w-full">

              {/* Sidebar */}
              <aside className="relative z-30 hidden md:flex h-full w-[280px] shrink-0 flex-col glass-panel-strong border-r border-white/8">
                {/* Sidebar header */}
                <div className="flex h-20 items-center border-b border-white/8 px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-sm font-bold text-primary-foreground shadow-premium-lg glow-cyan">
                      FO
                    </div>
                    <div>
                      <div className="text-base font-bold font-display">FormaOS</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider">Enterprise</div>
                    </div>
                  </div>
                </div>

                {/* Sidebar navigation */}
                <div className="flex flex-1 overflow-y-auto">
                  <Sidebar role={roleKey} />
                </div>

                {/* Sidebar footer */}
                <div className="border-t border-white/8 px-6 py-5 text-xs text-muted-foreground">
                  <div className="font-medium">© {new Date().getFullYear()} FormaOS</div>
                  <div className="mt-1.5">Compliance Operating System</div>
                </div>
              </aside>

              {/* Main application area */}
              <section className="relative flex h-full flex-1 flex-col overflow-hidden">

                {/* Top bar */}
                <header className="sticky top-0 z-40 flex h-20 w-full items-center glass-panel-strong border-b border-white/8">
                  <div className="flex h-full w-full items-center px-8">
                    <TopBar
                      orgName={orgName || "My Organization"}
                      userEmail={user.email || ""}
                      userId={user.id}
                      orgId={membership.organization_id}
                      role={roleKey}
                    />
                  </div>
                </header>

                {/* Main content */}
                <main className="relative flex flex-1 flex-col overflow-y-auto bg-background">
                  {/* Page container with better spacing */}
                  <div className="mx-auto w-full max-w-[1600px] px-8 py-10">{children}</div>
                </main>
              </section>
            </div>

            {/* Command palette */}
            <CommandMenu />
          </div>
        </ComplianceSystemProvider>
      </CommandProvider>
    </SystemStateHydrator>
  );
}
