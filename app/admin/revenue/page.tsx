import { getAdminFetchConfig } from "@/app/admin/lib";
import { TrendingUp, DollarSign, Zap } from "lucide-react";

async function fetchOverview() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/overview`, {
    cache: "no-store",
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminRevenuePage() {
  const data = await fetchOverview();

  if (!data) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
        <p className="text-slate-400">Revenue data unavailable</p>
      </div>
    );
  }

  const formatMoney = (cents: number) =>
    new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
      minimumFractionDigits: 0,
    }).format(cents / 100);

  const activeByPlan = data.activeByPlan ?? {};
  const totalSubs = Object.values(activeByPlan).reduce(
    (sum: number, count: any) => sum + count,
    0
  );

  const planMetrics = {
    starter: { subscriptions: activeByPlan["starter"] || 0, revenue: 4999 * (activeByPlan["starter"] || 0) },
    pro: { subscriptions: activeByPlan["pro"] || 0, revenue: 9999 * (activeByPlan["pro"] || 0) },
    enterprise: { subscriptions: activeByPlan["enterprise"] || 0, revenue: 0 }, // Custom pricing
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Revenue</h1>
        <p className="mt-2 text-sm text-slate-400">
          Estimated monthly recurring revenue and subscription metrics
        </p>
      </div>

      {/* MRR Highlight */}
      <div className="rounded-lg border border-emerald-800/30 bg-gradient-to-br from-emerald-900/20 to-slate-900/50 p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">Estimated MRR</p>
            <p className="mt-4 text-4xl font-bold text-slate-100">
              {formatMoney(data.mrrCents ?? 0)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {totalSubs} active subscriptions
            </p>
          </div>
          <DollarSign className="h-12 w-12 text-emerald-500/20" />
        </div>
      </div>

      {/* Plan Breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Revenue by Plan</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {Object.entries(planMetrics).map(([plan, metrics]: [string, any]) => (
            <div key={plan} className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase">
                    {plan}
                  </p>
                  <p className="mt-3 text-2xl font-bold text-slate-100">
                    {metrics.subscriptions}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">subscriptions</p>
                  <p className="mt-3 text-sm font-semibold text-emerald-400">
                    {formatMoney(metrics.revenue)}
                  </p>
                </div>
                <Zap className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Summary</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Total Active Subscriptions</span>
            <span className="font-semibold text-slate-100">{totalSubs}</span>
          </div>
          <div className="border-t border-slate-800 pt-3 flex justify-between">
            <span className="text-slate-400">Estimated Monthly Revenue</span>
            <span className="font-semibold text-emerald-400">
              {formatMoney(data.mrrCents ?? 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
