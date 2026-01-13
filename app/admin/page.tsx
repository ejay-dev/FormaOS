import { getAdminFetchConfig } from "@/app/admin/lib";
import { 
  Building2, 
  Users, 
  CreditCard, 
  AlertTriangle, 
  TrendingUp,
  Shield,
  FileText,
  CheckSquare,
  Activity,
  Zap,
  ArrowRight,
  ChevronRight
} from "lucide-react";
import Link from "next/link";

/**
 * =========================================================
 * ADMIN COMMAND CENTER
 * =========================================================
 * Platform-wide governance overview showing:
 * - Organization health across all tenants
 * - Compliance graph aggregate stats
 * - System-level metrics and alerts
 */

async function fetchOverview() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/overview`, { cache: "no-store", headers });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export default async function AdminOverviewPage() {
  const data: any = await fetchOverview();

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Unable to load admin metrics right now.
      </div>
    );
  }

  const formatMoney = (cents: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);

  // Derived governance metrics
  const orgHealth = {
    healthy: Math.max(0, data.totalOrgs - (data.trialsExpiring || 0) - (data.failedPayments || 0)),
    atRisk: data.trialsExpiring || 0,
    critical: data.failedPayments || 0,
  };

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Command Center</h1>
          <p className="mt-2 text-sm text-slate-400">
            Platform-wide governance health and operational metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/30 text-xs font-semibold text-emerald-300">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live data
          </span>
        </div>
      </div>

      {/* Platform Health Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] to-transparent p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">Organizations</div>
              <div className="mt-3 text-4xl font-bold text-slate-100">{data.totalOrgs}</div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                <span className="text-emerald-400">{orgHealth.healthy} healthy</span>
                <span>•</span>
                <span className="text-amber-400">{orgHealth.atRisk} at risk</span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-400/30 text-blue-300">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] to-transparent p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-500/20 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">Active Trials</div>
              <div className="mt-3 text-4xl font-bold text-slate-100">{data.trialsActive}</div>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="text-amber-400">{data.trialsExpiring} expiring in 7d</span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-400/30 text-amber-300">
              <Activity className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] to-transparent p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/20 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">Est. MRR</div>
              <div className="mt-3 text-4xl font-bold text-slate-100">
                {formatMoney(data.mrrCents ?? 0)}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                <span>Monthly recurring</span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-400/30 text-emerald-300">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-rose-400/20 bg-gradient-to-br from-rose-500/10 to-transparent p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-rose-500/20 blur-2xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-rose-300 font-bold">Failed Payments</div>
              <div className="mt-3 text-4xl font-bold text-rose-200">{data.failedPayments}</div>
              <div className="mt-2 text-xs text-rose-300/80">
                Requires immediate action
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Governance System Status */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] overflow-hidden">
        <div className="px-6 py-5 border-b border-white/10">
          <h2 className="text-lg font-semibold text-slate-100">Platform Governance Graph</h2>
          <p className="text-xs text-slate-400 mt-1">
            Aggregate compliance node activity across all organizations
          </p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Policy Node */}
            <div className="group relative rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-4 hover:bg-cyan-500/15 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-cyan-200">--</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Policies</div>
                </div>
              </div>
              <div className="mt-3 text-[9px] text-slate-400">Platform-wide</div>
            </div>

            {/* Control Node */}
            <div className="group relative rounded-xl border border-teal-400/30 bg-teal-500/10 p-4 hover:bg-teal-500/15 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500/20 border border-teal-400/40 text-teal-300">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-teal-200">--</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Controls</div>
                </div>
              </div>
              <div className="mt-3 text-[9px] text-slate-400">Active controls</div>
            </div>

            {/* Evidence Node */}
            <div className="group relative rounded-xl border border-violet-400/30 bg-violet-500/10 p-4 hover:bg-violet-500/15 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/20 border border-violet-400/40 text-violet-300">
                  <Zap className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-violet-200">--</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-violet-400">Evidence</div>
                </div>
              </div>
              <div className="mt-3 text-[9px] text-slate-400">Uploaded items</div>
            </div>

            {/* Audit Node */}
            <div className="group relative rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 hover:bg-amber-500/15 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-200">--</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Audits</div>
                </div>
              </div>
              <div className="mt-3 text-[9px] text-slate-400">Audit events</div>
            </div>

            {/* Risk Node */}
            <div className="group relative rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 hover:bg-rose-500/15 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-300">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-rose-200">--</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-rose-400">Risks</div>
                </div>
              </div>
              <div className="mt-3 text-[9px] text-slate-400">Identified risks</div>
            </div>

            {/* Task Node */}
            <div className="group relative rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 hover:bg-emerald-500/15 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-200">--</div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Tasks</div>
                </div>
              </div>
              <div className="mt-3 text-[9px] text-slate-400">Open tasks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Plans */}
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] to-transparent p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Active Plans</h2>
            <p className="text-xs text-slate-400 mt-1">Distribution of organizations by subscription tier</p>
          </div>
          <Link 
            href="/admin/billing" 
            className="flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Manage billing
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(data.activeByPlan ?? {}).map(([plan, count]) => (
            <div 
              key={plan} 
              className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
            >
              <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">{plan}</div>
              <div className="mt-3 text-3xl font-bold text-slate-100">{String(count)}</div>
              <div className="mt-2 text-xs text-slate-400">organizations</div>
            </div>
          ))}
          {Object.keys(data.activeByPlan ?? {}).length === 0 && (
            <div className="col-span-3 text-sm text-slate-400">No active subscriptions yet.</div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/admin/orgs"
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-all"
        >
          <div className="flex items-start justify-between">
            <Building2 className="h-6 w-6 text-blue-300" />
            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-4 text-sm font-semibold text-slate-100">Manage Organizations</div>
          <div className="mt-1 text-xs text-slate-400">View all tenant workspaces</div>
        </Link>

        <Link
          href="/admin/users"
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-all"
        >
          <div className="flex items-start justify-between">
            <Users className="h-6 w-6 text-violet-300" />
            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-4 text-sm font-semibold text-slate-100">User Management</div>
          <div className="mt-1 text-xs text-slate-400">Platform-wide user access</div>
        </Link>

        <Link
          href="/admin/support"
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-all"
        >
          <div className="flex items-start justify-between">
            <Activity className="h-6 w-6 text-amber-300" />
            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-4 text-sm font-semibold text-slate-100">Support Queue</div>
          <div className="mt-1 text-xs text-slate-400">Handle escalations</div>
        </Link>

        <Link
          href="/admin/health"
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 transition-all"
        >
          <div className="flex items-start justify-between">
            <Zap className="h-6 w-6 text-emerald-300" />
            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <div className="mt-4 text-sm font-semibold text-slate-100">System Health</div>
          <div className="mt-1 text-xs text-slate-400">Infrastructure status</div>
        </Link>
      </div>
    </div>
  );
}
