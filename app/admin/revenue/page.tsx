import { getAdminFetchConfig } from '@/app/admin/lib';
import { DollarSign, Zap } from 'lucide-react';

async function fetchOverview() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/overview`, {
    cache: 'no-store',
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
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(cents / 100);

  const activeByPlan: Record<string, number> = data.activeByPlan ?? {};
  const planPrices: Record<string, number> = data.planPrices ?? {};
  const totalSubs = Object.values(activeByPlan).reduce(
    (sum: number, count: any) => sum + count,
    0,
  );

  // Compute per-plan revenue from real DB prices
  const planKeys = [
    ...new Set([...Object.keys(activeByPlan), ...Object.keys(planPrices)]),
  ];
  const planMetrics = planKeys.map((key) => {
    const subscriptions = activeByPlan[key] ?? 0;
    const priceCents = planPrices[key] ?? 0;
    return {
      key,
      subscriptions,
      revenue: priceCents * subscriptions,
      priceCents,
    };
  });

  // Sort by revenue desc
  planMetrics.sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Revenue</h1>
        <p className="mt-2 text-sm text-slate-400">
          Monthly recurring revenue computed from active subscriptions × plan
          prices
        </p>
      </div>

      {/* MRR Highlight */}
      <div className="rounded-lg border border-emerald-800/30 bg-gradient-to-br from-emerald-900/20 to-slate-900/50 p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-400">MRR (from DB)</p>
            <p className="mt-4 text-4xl font-bold text-slate-100">
              {formatMoney(data.mrrCents ?? 0)}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              {totalSubs} active subscription{totalSubs !== 1 ? 's' : ''}
            </p>
          </div>
          <DollarSign className="h-12 w-12 text-emerald-500/20" />
        </div>
      </div>

      {/* Plan Breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Revenue by Plan
        </h2>
        {planMetrics.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {planMetrics.map((plan) => (
              <div
                key={plan.key}
                className="rounded-lg border border-slate-800 bg-slate-900/50 p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase">
                      {plan.key}
                    </p>
                    <p className="mt-3 text-2xl font-bold text-slate-100">
                      {plan.subscriptions}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">subscriptions</p>
                    {plan.priceCents > 0 ? (
                      <p className="mt-3 text-sm font-semibold text-emerald-400">
                        {formatMoney(plan.revenue)}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500 italic">
                        Custom pricing
                      </p>
                    )}
                    {plan.priceCents > 0 && (
                      <p className="text-xs text-slate-500">
                        @ {formatMoney(plan.priceCents)}/mo each
                      </p>
                    )}
                  </div>
                  <Zap className="h-6 w-6 text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
            <p className="text-slate-400">No active paid subscriptions</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">Summary</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Total Active Subscriptions</span>
            <span className="font-semibold text-slate-100">{totalSubs}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Failed Payments</span>
            <span
              className={`font-semibold ${data.failedPayments > 0 ? 'text-red-400' : 'text-slate-100'}`}
            >
              {data.failedPayments}
            </span>
          </div>
          <div className="border-t border-slate-800 pt-3 flex justify-between">
            <span className="text-slate-400">Monthly Recurring Revenue</span>
            <span className="font-semibold text-emerald-400">
              {formatMoney(data.mrrCents ?? 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
