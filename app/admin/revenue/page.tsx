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
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Revenue data unavailable</p>
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
        <h1 className="text-3xl font-bold text-foreground">Revenue</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Monthly recurring revenue computed from active subscriptions × plan
          prices
        </p>
      </div>

      {/* MRR Highlight */}
      <div className="rounded-lg border border-emerald-800/30 bg-gradient-to-br from-emerald-900/20 to-card p-8">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">MRR (from DB)</p>
            <p className="mt-4 text-4xl font-bold text-foreground">
              {formatMoney(data.mrrCents ?? 0)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {totalSubs} active subscription{totalSubs !== 1 ? 's' : ''}
            </p>
          </div>
          <DollarSign className="h-12 w-12 text-emerald-500/20" />
        </div>
      </div>

      {/* Plan Breakdown */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Revenue by Plan
        </h2>
        {planMetrics.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {planMetrics.map((plan) => (
              <div
                key={plan.key}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      {plan.key}
                    </p>
                    <p className="mt-3 text-2xl font-bold text-foreground">
                      {plan.subscriptions}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">subscriptions</p>
                    {plan.priceCents > 0 ? (
                      <p className="mt-3 text-sm font-semibold text-emerald-400">
                        {formatMoney(plan.revenue)}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground italic">
                        Custom pricing
                      </p>
                    )}
                    {plan.priceCents > 0 && (
                      <p className="text-xs text-muted-foreground">
                        @ {formatMoney(plan.priceCents)}/mo each
                      </p>
                    )}
                  </div>
                  <Zap className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">No active paid subscriptions</p>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Summary</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Active Subscriptions</span>
            <span className="font-semibold text-foreground">{totalSubs}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Failed Payments</span>
            <span
              className={`font-semibold ${data.failedPayments > 0 ? 'text-red-400' : 'text-foreground'}`}
            >
              {data.failedPayments}
            </span>
          </div>
          <div className="border-t border-border pt-3 flex justify-between">
            <span className="text-muted-foreground">Monthly Recurring Revenue</span>
            <span className="font-semibold text-emerald-400">
              {formatMoney(data.mrrCents ?? 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
