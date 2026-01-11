import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ShieldCheck,
  TriangleAlert,
  CheckCircle2,
  Clock3,
  FileText,
  Lock,
  Users,
  Activity,
  Radar,
  Sparkles,
  Download,
  Settings,
  Server,
  Database,
  Zap,
  Search,
  Building2,
  CalendarDays,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";
import {
  evaluateOrgCompliance,
  fetchComplianceSummary,
} from "@/app/app/actions/control-evaluations";
import { normalizeRole } from "@/app/app/actions/rbac";

/**
 * =========================================================
 * FORMAOS – COMMAND CENTER (ENTERPRISE DASHBOARD)
 * Route: /app
 * File:  app/app/page.tsx
 * =========================================================
 *
 * Constraints:
 *  - Do NOT use shadcn token classes (bg-card, text-muted-foreground, border-border, etc.)
 *  - Do NOT assume token CSS variables exist
 *  - Must be safe if database is empty or tables are missing
 *
 * Goals:
 *  - True enterprise information hierarchy
 *  - Predictable spacing, borders, typography
 *  - Scalable component-like sections (cards, tables, panels)
 *  - Strong visual rhythm without relying on fancy theming
 * =========================================================
 */

type MembershipRow = {
  organization_id: string;
  role?: string | null;
  organizations?: { name?: string | null } | { name?: string | null }[] | null;
};

type AuditLogRow = {
  id: string;
  action: string;
  target?: string | null;
  actor_email?: string | null;
  created_at: string;
};

type TaskRow = {
  id: string;
  title: string;
  status: string;
  due_at?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  // optional dynamic assignee might exist in DB; we treat as unknown safely
  [key: string]: any;
};

type EvidenceRow = {
  id: string;
  title: string;
  status: string;
  created_at?: string | null;
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "—";
  }
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeOrgName(membership?: MembershipRow | null) {
  const orgs = membership?.organizations as any;
  const name = Array.isArray(orgs) ? orgs?.[0]?.name : orgs?.name;
  return (name || "My Organization") as string;
}

function pctBarWidth(score: number) {
  const s = clamp(score, 0, 100);
  return `${s}%`;
}

/**
 * Small UI primitives (no external design system required)
 * ---------------------------------------------------------
 * These are intentionally simple and verbose.
 * They keep spacing and hierarchy consistent across the page.
 */

function SectionTitle({
  title,
  subtitle,
  icon,
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="absolute inset-x-0 -top-6 h-20 rounded-2xl bg-gradient-to-r from-blue-600/15 via-indigo-600/10 to-cyan-500/15 blur-2xl" />
      <div className="relative flex items-start gap-4">
        {icon ? (
          <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--panel-2))] shadow-[0_0_18px_rgba(56,189,248,0.15)]">
            {icon}
          </div>
        ) : null}
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-50">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm leading-6 text-slate-300">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}

function Pill({
  label,
  tone = "neutral",
  icon,
}: {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  icon?: React.ReactNode;
}) {
  const toneMap: Record<string, string> = {
    neutral: "border-white/10 bg-white/5 text-slate-200",
    success: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
    warning: "border-amber-400/40 bg-amber-400/10 text-amber-200",
    danger: "border-rose-400/40 bg-rose-400/10 text-rose-200",
    info: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur",
        toneMap[tone],
      ].join(" ")}
    >
      {icon ? <span className="inline-flex">{icon}</span> : null}
      {label}
    </span>
  );
}

function CardShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-blue-600/10 via-transparent to-cyan-500/10" />
      <div className="relative flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-slate-100">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-1 text-xs leading-5 text-slate-400">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="relative px-6 py-5">{children}</div>
    </section>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon,
  tone = "neutral",
  href,
}: {
  label: string;
  value: string;
  helper?: string;
  icon?: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  href?: string;
}) {
  const toneRing: Record<string, string> = {
    neutral: "ring-white/10",
    success: "ring-emerald-400/30",
    warning: "ring-amber-400/30",
    danger: "ring-rose-400/30",
    info: "ring-sky-400/30",
  };

  const iconBg: Record<string, string> = {
    neutral: "bg-white/5 text-slate-200 border-white/10 shadow-[0_0_18px_rgba(56,189,248,0.15)]",
    success: "bg-emerald-400/10 text-emerald-200 border-emerald-400/30 shadow-[0_0_18px_rgba(16,185,129,0.2)]",
    warning: "bg-amber-400/10 text-amber-200 border-amber-400/30 shadow-[0_0_18px_rgba(245,158,11,0.2)]",
    danger: "bg-rose-400/10 text-rose-200 border-rose-400/30 shadow-[0_0_18px_rgba(244,63,94,0.2)]",
    info: "bg-sky-400/10 text-sky-200 border-sky-400/30 shadow-[0_0_18px_rgba(14,165,233,0.2)]",
  };

  const body = (
    <div
      className={[
        "group relative rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur transition",
        "hover:-translate-y-[2px] hover:border-white/20 hover:shadow-[0_24px_60px_rgba(15,23,42,0.45)]",
        "ring-1",
        toneRing[tone],
      ].join(" ")}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {label}
          </div>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-slate-50">
            {value}
          </div>
          {helper ? (
            <div className="mt-1 text-xs leading-5 text-slate-400">
              {helper}
            </div>
          ) : null}
        </div>

        {icon ? (
          <div
            className={[
              "relative flex h-10 w-10 items-center justify-center rounded-xl border",
              iconBg[tone],
            ].join(" ")}
          >
            {icon}
          </div>
        ) : null}
      </div>

      {href ? (
        <div className="relative mt-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-200">
          View details
          <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-[1px]" />
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {body}
      </Link>
    );
  }

  return body;
}

function ProgressBar({
  label,
  value,
  helper,
  percent,
  tone = "info",
}: {
  label: string;
  value: string;
  helper?: string;
  percent: number;
  tone?: "info" | "success" | "warning" | "danger" | "neutral";
}) {
  const barTone: Record<string, string> = {
    neutral: "bg-slate-500",
    info: "bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500",
    success: "bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400",
    warning: "bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500",
    danger: "bg-gradient-to-r from-rose-500 via-rose-600 to-red-500",
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            {label}
          </div>
          <div className="mt-3 text-5xl font-semibold tracking-tight text-slate-50">
            {value}
          </div>
          {helper ? (
            <div className="mt-2 text-xs leading-5 text-slate-400">
              {helper}
            </div>
          ) : null}
        </div>
        <Pill
          label={`${clamp(Math.round(percent), 0, 100)}%`}
          tone={
            percent >= 85
              ? "success"
              : percent >= 60
              ? "info"
              : percent >= 35
              ? "warning"
              : "danger"
          }
        />
      </div>

      <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-white/5">
        <div
          className={["h-full rounded-full", barTone[tone]].join(" ")}
          style={{ width: pctBarWidth(percent) }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
}

function TableShell({
  columns,
  rows,
  empty,
}: {
  columns: string[];
  rows: React.ReactNode[];
  empty: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[hsl(var(--card))] to-[hsl(var(--panel-2))]">
      <div className="relative w-full overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gradient-to-r from-white/5 via-white/0 to-white/5">
            <tr className="border-b border-white/10">
              {columns.map((c) => (
                <th
                  key={c}
                  className="h-11 px-4 align-middle text-xs font-semibold uppercase tracking-widest text-slate-400"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-10" colSpan={columns.length}>
                  {empty}
                </td>
              </tr>
            ) : (
              rows
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  description,
  icon,
  cta,
}: {
  title: string;
  description: string;
  icon?: React.ReactNode;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center">
      {icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          {icon}
        </div>
      ) : null}
      <div className="text-sm font-semibold text-slate-100">{title}</div>
      <div className="max-w-md text-xs leading-5 text-slate-400">
        {description}
      </div>
      {cta ? <div className="mt-2">{cta}</div> : null}
    </div>
  );
}

function ButtonLink({
  href,
  children,
  tone = "primary",
  iconLeft,
  disabled = false,
}: {
  href: string;
  children: React.ReactNode;
  tone?: "primary" | "neutral";
  iconLeft?: React.ReactNode;
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition";
  const styles =
    tone === "primary"
      ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-[0_10px_30px_rgba(59,130,246,0.35)] hover:brightness-110"
      : "bg-white/5 text-slate-200 border border-white/10 hover:bg-white/10";
  if (disabled) {
    return (
      <span
        className={[
          base,
          styles,
          "cursor-not-allowed opacity-60",
        ].join(" ")}
        aria-disabled="true"
      >
        {iconLeft ? <span className="inline-flex">{iconLeft}</span> : null}
        {children}
        <ArrowRight className="h-4 w-4 text-slate-200" />
      </span>
    );
  }
  return (
    <Link href={href} className={[base, styles].join(" ")}>
      {iconLeft ? <span className="inline-flex">{iconLeft}</span> : null}
      {children}
      <ArrowRight className="h-4 w-4 text-slate-200" />
    </Link>
  );
}

/**
 * =========================================================
 * PAGE
 * =========================================================
 */

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  // Auth context should already be enforced in layout, but keep safe.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Layout should redirect first, but on edge cases we still guard.
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-6">
        <EmptyState
          title="Session expired"
          description="Please sign in again to continue."
          icon={<ShieldCheck className="h-5 w-5 text-slate-300" />}
          cta={<ButtonLink href="/auth/signin">Go to Sign in</ButtonLink>}
        />
      </div>
    );
  }

  // Org context
  let membership: MembershipRow | null = null;

  try {
    const { data } = await supabase
      .from("org_members")
      .select("organization_id, role, organizations(name)")
      .eq("user_id", user.id)
      .maybeSingle();

    membership = (data as any) || null;
  } catch {
    membership = null;
  }

  const orgName = safeOrgName(membership);
  const orgId = membership?.organization_id || "";
  const roleKey = normalizeRole(membership?.role ?? null);

  if (roleKey === "STAFF") {
    redirect("/app/staff");
  }
  let subscriptionStatus: string | null = null;
  let hasActiveSubscription = false;

  try {
    if (orgId) {
      const { data: subscription } = await supabase
        .from("org_subscriptions")
        .select("status")
        .eq("organization_id", orgId)
        .maybeSingle();
      subscriptionStatus = subscription?.status ?? null;
      hasActiveSubscription = subscription?.status === "active" || subscription?.status === "trialing";
    }
  } catch {
    subscriptionStatus = null;
    hasActiveSubscription = false;
  }

  // =====================================================
  // Compliance evaluation (server-side, defensive)
  // =====================================================
  let complianceSummary = {
    total: 0,
    compliant: 0,
    atRisk: 0,
    nonCompliant: 0,
    requiredNonCompliant: 0,
  };

  try {
    if (orgId) {
      await evaluateOrgCompliance(orgId);
      complianceSummary = await fetchComplianceSummary(orgId);
    }
  } catch {
    // keep defaults
  }

  // =====================================================
  // Compliance gates (best-effort)
  // =====================================================
  let complianceBlocks: { id: string; gate_key: string; reason?: string | null; metadata?: any; created_at?: string | null }[] = [];

  try {
    if (orgId) {
      const { data: blocksData, error } = await supabase
        .from("org_compliance_blocks")
        .select("id, gate_key, reason, metadata, created_at")
        .eq("organization_id", orgId)
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error && blocksData) complianceBlocks = blocksData as any;
    }
  } catch {
    complianceBlocks = [];
  }

  /**
   * Data (best-effort)
   * ------------------
   * These queries are intentionally defensive.
   * If any table is missing or RLS blocks it, the dashboard still loads.
   */
  let auditLogs: AuditLogRow[] = [];
  let tasks: TaskRow[] = [];
  let evidence: EvidenceRow[] = [];

  try {
    const [logsRes, tasksRes, evidenceRes] = await Promise.all([
      supabase
        .from("org_audit_logs")
        .select("id, action, target, actor_email, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("org_tasks")
        .select("id, title, status, due_at, completed_at, created_at, assignee")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("org_evidence")
        .select("id, title, status, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (!logsRes.error && logsRes.data) auditLogs = logsRes.data as any;
    if (!tasksRes.error && tasksRes.data) tasks = tasksRes.data as any;
    if (!evidenceRes.error && evidenceRes.data) evidence = evidenceRes.data as any;
  } catch {
    // swallow
  }

  // Derived metrics (safe defaults)
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const openTasks = totalTasks - completedTasks;

  const evidenceApproved = evidence.filter((e) => e.status === "approved").length;
  const evidencePending = evidence.filter((e) => e.status !== "approved").length;

  // Operational control visuals (no new queries)
  const myTasksCount = tasks.filter((t: any) => {
    return (t as any).assignee === user.email || t.status === "in_progress";
  }).length;

  const unassignedCount = tasks.filter((t: any) => {
    return !(t as any).assignee || (t as any).assignee === "" || t.status === "unassigned";
  }).length;

  const overdueCount = tasks.filter((t) => {
    try {
      return t.due_at && new Date(t.due_at) < new Date() && t.status !== "completed";
    } catch {
      return false;
    }
  }).length;

  const postureScore =
    complianceSummary.total === 0
      ? 0
      : clamp(
          Math.round((complianceSummary.compliant / complianceSummary.total) * 100),
          0,
          100
        );

  const postureTone =
    postureScore >= 85 ? "success" : postureScore >= 60 ? "info" : postureScore >= 35 ? "warning" : "danger";

  const nonCompliantCount = complianceSummary.nonCompliant;
  const atRiskCount = complianceSummary.atRisk;
  const compliantCount = complianceSummary.compliant;
  const totalControls = complianceSummary.total;
  const hasCriticalGaps = nonCompliantCount > 0;
  const isEnforcementBlocked = complianceSummary.requiredNonCompliant > 0;

  // Compliance summary derived
  const totalActiveBlocks = complianceBlocks.length;
  const frameworkBlocks = complianceBlocks.filter((b) => b.gate_key?.startsWith?.("FRAMEWORK_")).length;
  const auditExportBlocks = complianceBlocks.filter((b) => b.gate_key === "AUDIT_EXPORT").length;
  const topReasons = complianceBlocks.slice(0, 3).map((b) => b.reason || (b.metadata && b.metadata.message) || b.gate_key);

  return (
    <div className="relative flex w-full flex-col gap-8">
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-40 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-cyan-500/10 blur-3xl" />
      {!hasActiveSubscription ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-6 py-4">
          <div className="flex items-center gap-3 text-amber-200">
            <TriangleAlert className="h-5 w-5" />
            <div>
              <div className="text-sm font-semibold">Subscription inactive</div>
              <div className="text-xs text-amber-300">
                Activate your plan to unlock exports, framework evaluations, and certifications.
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-amber-100">
            Status: {subscriptionStatus ?? "not configured"} ·{" "}
            <Link href="/app/billing" className="underline">Go to billing</Link>
          </div>
        </div>
      ) : null}
      {/* =====================================================
          HEADER
          ===================================================== */}
      <SectionTitle
        title="Command Center"
        subtitle="Real-time compliance posture, operational health, and governance activity in one place."
        icon={<Radar className="h-5 w-5 text-slate-300" />}
        right={
          <>
            <ButtonLink
              href="/app/reports"
              tone="neutral"
              iconLeft={<Download className="h-4 w-4 text-slate-300" />}
              disabled={isEnforcementBlocked}
            >
              Reports
            </ButtonLink>
            <ButtonLink href="/app/settings" tone="primary" iconLeft={<Settings className="h-4 w-4 text-white" />}>
              Configure
            </ButtonLink>
          </>
        }
      />

      {/* =====================================================
          CONTEXT STRIP
          ===================================================== */}
      <div className="relative flex flex-col gap-3 rounded-2xl border border-white/10 bg-gradient-to-r from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--card))] px-6 py-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] sm:flex-row sm:items-center sm:justify-between">
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10" />
        <div className="flex flex-wrap items-center gap-2">
          <Pill
            label={orgName}
            tone="neutral"
            icon={<Building2 className="h-4 w-4 text-slate-300" />}
          />
          <Pill
            label={membership?.role ? `Role: ${membership.role}` : "Role: Member"}
            tone="info"
            icon={<Users className="h-4 w-4 text-sky-200" />}
          />
          <Pill
            label={`Signed in: ${user.email || "user"}`}
            tone="neutral"
            icon={<ShieldCheck className="h-4 w-4 text-slate-300" />}
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-400 sm:flex">
            <Search className="h-4 w-4 text-slate-400" />
            Tip: press <span className="rounded bg-white/10 px-2 py-0.5 text-[11px] font-bold">⌘K</span>
          </div>
        </div>
      </div>

      {/* =====================================================
          CRITICAL WARNING STRIP
          ===================================================== */}
      {hasCriticalGaps ? (
        <div className="relative overflow-hidden rounded-2xl border border-rose-400/30 bg-gradient-to-r from-rose-600/10 via-rose-500/5 to-transparent px-6 py-4 shadow-[0_0_40px_rgba(244,63,94,0.2)]">
          <div className="absolute -left-8 top-1/2 h-24 w-24 -translate-y-1/2 rounded-full bg-rose-500/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <TriangleAlert className="h-5 w-5 text-rose-200" />
            <div>
              <div className="text-sm font-semibold text-rose-100">
                ⚠ Critical compliance gaps detected
              </div>
              <div className="text-xs text-rose-200/80">
                {nonCompliantCount} control(s) are non-compliant. Resolve required gaps before export or approvals.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* =====================================================
          COMPLIANCE GATES SUMMARY (NEW)
          ===================================================== */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] px-6 py-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">Compliance gates</div>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-rose-500/15 px-3 py-1 border border-rose-400/30 text-rose-200 text-sm font-semibold">
                  Active: {totalActiveBlocks}
                </div>
                <div className="rounded-md bg-amber-400/15 px-3 py-1 border border-amber-400/30 text-amber-200 text-sm font-semibold">
                  Framework: {frameworkBlocks}
                </div>
                <div className="rounded-md bg-rose-400/10 px-3 py-1 border border-white/10 text-rose-200 text-sm font-semibold">
                  Audit export: {auditExportBlocks}
                </div>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {topReasons.length > 0 ? (
                <span>Top reasons: {topReasons.join(" • ")}</span>
              ) : (
                <span>No active gates</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/app/reports" className="inline-flex items-center gap-2 rounded-md bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 border border-white/10 hover:bg-white/10">
              View gates
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* =====================================================
          PRIMARY KPI GRID
          ===================================================== */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Compliance Posture */}
        <div className="lg:col-span-5">
          <ProgressBar
            label="Compliance posture"
            value={`${postureScore}%`}
            helper={`Compliant ${compliantCount}/${totalControls} • At risk ${atRiskCount} • Non-compliant ${nonCompliantCount}`}
            percent={postureScore}
            tone={postureTone as any}
          />
        </div>

        {/* KPI cards */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              label="Open tasks"
              value={`${openTasks}`}
              helper="Pending obligations requiring action."
              tone={openTasks === 0 ? "success" : openTasks <= 3 ? "warning" : "danger"}
              icon={<Clock3 className="h-5 w-5 text-slate-300" />}
              href="/app/tasks"
            />
            <StatCard
              label="Evidence pipeline"
              value={`${evidenceApproved}/${Math.max(evidence.length, 0)}`}
              helper="Approved items vs total uploaded."
              tone={evidence.length === 0 ? "neutral" : evidencePending === 0 ? "success" : "warning"}
              icon={<Lock className="h-5 w-5 text-slate-300" />}
              href="/app/vault"
            />
            <StatCard
              label="Governance activity"
              value={`${auditLogs.length}`}
              helper="Latest actions recorded in audit trail."
              tone={auditLogs.length > 0 ? "info" : "neutral"}
              icon={<Activity className="h-5 w-5 text-slate-300" />}
              href="/app/audit"
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          QUICK ACTIONS
          ===================================================== */}
      <CardShell
        title="Quick actions"
        subtitle="High-frequency workflows to keep the organization compliant and audit-ready."
        action={
          <Pill
            label="Operational"
            tone="neutral"
            icon={<Sparkles className="h-4 w-4 text-slate-300" />}
          />
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Link
            href="/app/policies"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-[2px] hover:border-white/20 hover:shadow-[0_24px_60px_rgba(15,23,42,0.45)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 shadow-[0_0_18px_rgba(56,189,248,0.15)]">
                <FileText className="h-5 w-5" />
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-[1px]" />
            </div>
            <div className="relative mt-3 text-sm font-semibold text-slate-100">
              Review policies
            </div>
            <div className="relative mt-1 text-xs leading-5 text-slate-400">
              Approve or update governance documents and keep versions current.
            </div>
          </Link>

          <Link
            href="/app/tasks"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-[2px] hover:border-white/20 hover:shadow-[0_24px_60px_rgba(15,23,42,0.45)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 shadow-[0_0_18px_rgba(16,185,129,0.15)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-[1px]" />
            </div>
            <div className="relative mt-3 text-sm font-semibold text-slate-100">
              Execute tasks
            </div>
            <div className="relative mt-1 text-xs leading-5 text-slate-400">
              Close gaps and maintain audit readiness with controlled execution.
            </div>
          </Link>

          <Link
            href="/app/vault"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-[2px] hover:border-white/20 hover:shadow-[0_24px_60px_rgba(15,23,42,0.45)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 shadow-[0_0_18px_rgba(59,130,246,0.15)]">
                <Lock className="h-5 w-5" />
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-[1px]" />
            </div>
            <div className="relative mt-3 text-sm font-semibold text-slate-100">
              Upload evidence
            </div>
            <div className="relative mt-1 text-xs leading-5 text-slate-400">
              Centralize documentation with status, review, and traceability.
            </div>
          </Link>

          <Link
            href="/app/audit"
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:-translate-y-[2px] hover:border-white/20 hover:shadow-[0_24px_60px_rgba(15,23,42,0.45)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 shadow-[0_0_18px_rgba(14,165,233,0.15)]">
                <Activity className="h-5 w-5" />
              </div>
              <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-[1px]" />
            </div>
            <div className="relative mt-3 text-sm font-semibold text-slate-100">
              View audit trail
            </div>
            <div className="relative mt-1 text-xs leading-5 text-slate-400">
              Immutable record of sensitive actions across the organization.
            </div>
          </Link>
        </div>
      </CardShell>

      {/* =====================================================
          WORKSTREAMS GRID
          ===================================================== */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Left: Tasks */}
        <div className="xl:col-span-7">
          <CardShell
            title="Work queue"
            subtitle="Priority items requiring attention. Keep this close to zero."
            action={<ButtonLink href="/app/tasks" tone="neutral">Open Tasks</ButtonLink>}
          >
            {/* Operational control strip (visual-only) */}
            <div className="mb-4 flex gap-3">
              <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">My tasks</div>
                <div className="mt-1 text-lg font-semibold text-slate-100">{myTasksCount}</div>
                <div className="mt-1 text-xs text-slate-400">In progress / assigned to you</div>
              </div>

              <div className="flex-1 rounded-xl border border-rose-400/30 bg-rose-500/10 p-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-rose-200">Unassigned</div>
                <div className="mt-1 text-lg font-semibold text-rose-100">{unassignedCount}</div>
                <div className="mt-1 text-xs text-rose-200/80">No owner — needs assignment</div>
              </div>

              <div className="flex-1 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-amber-200">Overdue</div>
                <div className="mt-1 text-lg font-semibold text-amber-100">{overdueCount}</div>
                <div className="mt-1 text-xs text-amber-200/80">Past due and still open</div>
              </div>
            </div>

            <TableShell
              columns={["Title", "Status", "Due", "Last update"]}
              rows={tasks.map((t) => {
                const statusTone =
                  t.status === "completed"
                    ? "success"
                    : t.status === "in_progress"
                    ? "info"
                    : t.status === "blocked"
                    ? "danger"
                    : t.status === "unassigned"
                    ? "danger"
                    : "warning";

                return (
                  <tr key={t.id} className="border-b border-white/10 last:border-b-0">
                    <td className="px-4 py-4">
                      <div className="text-sm font-semibold text-slate-100">
                        {t.title}
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        Task ID: <span className="font-mono text-slate-300">{t.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Pill
                        label={t.status.replaceAll("_", " ")}
                        tone={statusTone as any}
                        icon={statusTone === "danger" ? <TriangleAlert className="h-3 w-3 text-rose-200" /> : undefined}
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      {fmtDate(t.due_at)}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-300">
                      {fmtDate(t.completed_at || t.created_at)}
                    </td>
                  </tr>
                );
              })}
              empty={
                <EmptyState
                  title="No tasks found"
                  description="Create tasks to drive compliance execution. This table should surface the next actions for the org."
                  icon={<CheckCircle2 className="h-5 w-5 text-slate-300" />}
                  cta={<ButtonLink href="/app/tasks">Create / Manage tasks</ButtonLink>}
                />
              }
            />
          </CardShell>
        </div>

        {/* Right: Evidence */}
        <div className="xl:col-span-5">
          <CardShell
            title="Evidence ledger"
            subtitle="What’s approved vs pending. Evidence is your audit shield."
            action={<ButtonLink href="/app/vault" tone="neutral">Open Vault</ButtonLink>}
          >
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-wrap gap-2">
                <Pill
                  label={`Approved: ${evidenceApproved}`}
                  tone={evidenceApproved > 0 ? "success" : "neutral"}
                  icon={<CheckCircle2 className="h-4 w-4 text-slate-300" />}
                />
                <Pill
                  label={`Pending: ${evidencePending}`}
                  tone={evidencePending > 0 ? "warning" : "neutral"}
                  icon={<Clock3 className="h-4 w-4 text-slate-300" />}
                />
                <Pill
                  label={`Total: ${evidence.length}`}
                  tone="neutral"
                  icon={<Lock className="h-4 w-4 text-slate-300" />}
                />
              </div>

              <div className="space-y-3">
                {evidence.length === 0 ? (
                  <EmptyState
                    title="No evidence uploaded"
                    description="Upload evidence against controls and policies. Status should move from pending → approved."
                    icon={<Lock className="h-5 w-5 text-slate-300" />}
                    cta={<ButtonLink href="/app/vault">Upload evidence</ButtonLink>}
                  />
                ) : (
                  evidence.map((e) => {
                    const tone =
                      e.status === "approved"
                        ? "success"
                        : e.status === "rejected"
                        ? "danger"
                        : "warning";

                    return (
                      <div
                        key={e.id}
                        className="rounded-2xl border border-white/10 bg-white/5 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-100">
                              {e.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-400">
                              Collected: {fmtDate(e.created_at)}
                            </div>
                          </div>
                          <Pill
                            label={e.status.replaceAll("_", " ")}
                            tone={tone as any}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </CardShell>
        </div>
      </div>

      {/* =====================================================
          ACTIVITY + DIAGNOSTICS
          ===================================================== */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <CardShell
            title="Governance activity"
            subtitle="Recent changes that matter. This is what auditors will ask about."
            action={<ButtonLink href="/app/audit" tone="neutral">Open Audit Trail</ButtonLink>}
          >
            <TableShell
              columns={["Action", "Target", "Actor", "Time"]}
              rows={auditLogs.map((l) => (
                <tr key={l.id} className="border-b border-white/10 last:border-b-0">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300">
                        <Activity className="h-4 w-4 text-slate-300" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-100">
                          {l.action}
                        </div>
                        <div className="mt-1 text-xs text-slate-400">
                          Log ID: <span className="font-mono text-slate-300">{l.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">
                    {l.target || "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">
                    {l.actor_email || "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">
                    {fmtDate(l.created_at)}
                  </td>
                </tr>
              ))}
              empty={
                <EmptyState
                  title="No audit events yet"
                  description="Once users create policies, complete tasks, or export reports, activity will appear here automatically."
                  icon={<Activity className="h-5 w-5 text-slate-300" />}
                />
              }
            />
          </CardShell>
        </div>

        <div className="xl:col-span-4">
          <CardShell
            title="System health"
            subtitle="Live platform and organization integrity checks."
            action={<Pill label="Operational" tone="info" icon={<Server className="h-4 w-4 text-sky-200" />} />}
          >
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-emerald-200/80">
                      Auth
                    </div>
                    <div className="mt-1 text-sm font-semibold text-emerald-200">
                      Session active
                    </div>
                    <div className="mt-1 text-xs text-emerald-200/80">
                      User: {user.email || "—"}
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/40 bg-emerald-400/20 text-emerald-200 shadow-[0_0_18px_rgba(16,185,129,0.2)]">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                      Org context
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">
                      {orgId ? "Resolved" : "Missing"}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Org: {orgName}
                    </div>
                  </div>
                  <div
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-xl border",
                      orgId
                        ? "border-emerald-400/40 bg-emerald-400/20 text-emerald-200"
                        : "border-rose-400/40 bg-rose-500/15 text-rose-200",
                    ].join(" ")}
                  >
                    {orgId ? (
                      <Database className="h-5 w-5 text-slate-200" />
                    ) : (
                      <TriangleAlert className="h-5 w-5 text-rose-200" />
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-400/30 bg-sky-400/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-sky-200/80">
                      Performance
                    </div>
                    <div className="mt-1 text-sm font-semibold text-sky-100">
                      Normal
                    </div>
                    <div className="mt-1 text-xs text-sky-200/80">
                      No system alerts detected.
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/40 bg-sky-400/20 text-sky-200 shadow-[0_0_18px_rgba(14,165,233,0.2)]">
                    <Zap className="h-5 w-5" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">
                      Next improvement
                    </div>
                    <div className="mt-1 text-xs leading-5 text-slate-400">
                      Compliance evaluations are now persisted in <span className="font-mono text-slate-300">org_control_evaluations</span>. Expand controls to include framework-specific mappings.
                    </div>
                    <div className="mt-3">
                      <ButtonLink href="/app/reports" tone="neutral" iconLeft={<CalendarDays className="h-4 w-4 text-slate-300" />}>
                        Run evaluation
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </CardShell>
        </div>
      </div>
    </div>
  );
}
