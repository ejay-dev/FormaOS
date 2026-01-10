import { createSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/topbar";
import { CommandMenu } from "@/components/command-menu";
import { CommandProvider } from "@/components/ui/command-provider";
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
    <CommandProvider>
      <div className="relative flex h-screen w-full overflow-hidden bg-[#05080f] text-slate-100">
        <div className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-32 h-80 w-80 rounded-full bg-cyan-500/5 blur-3xl" />
        {/* =====================================================
            APP SHELL GRID
            ===================================================== */}
        <div className="flex h-full w-full">

          {/* =====================================================
              SIDEBAR ZONE
              ===================================================== */}
          <aside
            className="
              relative
              z-30
              hidden
              md:flex
              h-full
              w-[260px]
              shrink-0
              flex-col
              border-r
              border-white/10
              bg-gradient-to-b
              from-[#0B1220]
              to-[#0A101C]
            "
          >
            {/* Sidebar Header Slot */}
            <div className="flex h-16 items-center border-b border-white/10 px-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-slate-100">
                  FormaOS
                </span>
                <span className="rounded bg-white/5 px-2 py-0.5 text-xs font-medium text-slate-400">
                  Enterprise
                </span>
              </div>
            </div>

            {/* Sidebar Body */}
            <div className="flex flex-1 overflow-y-auto">
              <Sidebar role={roleKey} />
            </div>

            {/* Sidebar Footer Slot */}
            <div className="border-t border-white/10 px-6 py-4 text-xs text-slate-400">
              <div>© {new Date().getFullYear()} FormaOS</div>
              <div className="mt-1">Compliance Operating System</div>
            </div>
          </aside>

          {/* =====================================================
              MAIN APPLICATION ZONE
              ===================================================== */}
          <section className="relative flex h-full flex-1 flex-col overflow-hidden">

            {/* =====================================================
                TOP BAR ZONE
                ===================================================== */}
            <header
              className="
                sticky
                top-0
                z-40
                flex
                h-16
                w-full
                items-center
                border-b
                border-white/10
                bg-gradient-to-r
                from-[#0B1220]
                via-[#0E1526]
                to-[#0B1220]
              "
            >
              <div className="flex h-full w-full items-center px-6">
                <TopBar
                  orgName={orgName || "My Organization"}
                  userEmail={user.email || ""}
                  userId={user.id}
                  orgId={membership.organization_id}
                  role={roleKey}
                />
              </div>
            </header>

            {/* =====================================================
                OPTIONAL SYSTEM BANNER ZONE
                (future: alerts, trials, compliance warnings)
                ===================================================== */}
            <div
              className="
                hidden
                w-full
                border-b
                border-white/10
                bg-white/5
              "
            >
              <div className="mx-auto max-w-7xl px-6 py-2 text-sm text-slate-400">
                System banner placeholder
              </div>
            </div>

            {/* =====================================================
                MAIN CONTENT ZONE
                ===================================================== */}
            <main
              className="
                relative
                flex
                flex-1
                flex-col
                overflow-y-auto
                bg-[#05080f]
              "
            >
              {/* Page Container */}
              <div className="mx-auto w-full max-w-7xl px-8 py-8">

                {/* =================================================
                    PAGE FRAME
                    ================================================= */}
                <div
                  className="
                    relative
                    flex
                    w-full
                    flex-col
                    gap-6
                    rounded-lg
                    border
                    border-white/10
                    bg-gradient-to-br
                    from-[#0B1220]
                    via-[#0E1526]
                    to-[#0A101C]
                    p-6
                    shadow-sm
                  "
                >
                  {/* -------------------------------------------------
                      PAGE HEADER SLOT
                      ------------------------------------------------- */}
                  <div
                    className="
                      flex
                      w-full
                      flex-col
                      gap-1
                      border-b
                      border-white/10
                      pb-4
                    "
                  >
                    {/* Page title should live inside children */}
                  </div>

                  {/* -------------------------------------------------
                      PAGE CONTENT
                      ------------------------------------------------- */}
                  <div className="relative w-full">
                    {children}
                  </div>

                  {/* -------------------------------------------------
                      PAGE FOOTER SLOT
                      ------------------------------------------------- */}
                  <div
                    className="
                      hidden
                      w-full
                      border-t
                      border-white/10
                      pt-4
                      text-xs
                      text-slate-400
                    "
                  >
                    Page footer placeholder
                  </div>
                </div>
              </div>
            </main>
          </section>
        </div>

        {/* =====================================================
            COMMAND PALETTE (GLOBAL)
            ===================================================== */}
        <CommandMenu />
      </div>
    </CommandProvider>
  );
}
