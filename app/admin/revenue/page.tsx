import { getAdminFetchConfig } from '@/app/admin/lib';
import { DollarSign, Zap, RefreshCw, Activity } from 'lucide-react';

async function fetchOverview() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/overview`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

function StripeModeBadge({ mode }: { mode: 'live' | 'test' | 'unknown' }) {
  if (mode === 'live') {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 border border-emerald-500/30">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-sm font-semibold text-emerald-400">🟢 Live Mode</span>
      </div>
    );
  }
  
  if (mode === 'test') {
    return (
      <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-4 py-2 border border-blue-500/30">
        <div className="h-2 w-2 rounded-full bg-blue-500" />
        <span className="text-sm font-semibold text-blue-400">🔵 Test Mode</span>
      </div>
    );
  }
  
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-slate-500/10 px-4 py-2 border border-slate-500/30">
      <div className="h-2 w-2 rounded-full bg-slate-500" />
      <span className="text-sm font-semibold text-slate-400">⚪ Unknown Mode</span>
    </div>
  );
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
  
  // Use Stripe count as source of truth
  const totalSubs = data.stripeActiveCount ?? 0;
  const stripeMrr = data.stripeMrrCents ?? 0;
  const stripeMode = data.stripeMode ?? 'unknown';
  const dbMrr = data.dbMrrCents ?? 0;
  const arrCents = stripeMrr * 12;

  // Compute per-plan revenue from real DB prices (for breakdown only)
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
  
  // Format last sync time
  const lastSync = data.lastSyncAt 
    ? new Date(data.lastSyncAt).toLocaleString('en-AU', { 
        dateStyle: 'short', 
        timeStyle: 'short' 
      })
    : 'Unknown';

  return (
    <div className="space-y-6">
      {/* Header with Mode Badge */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Revenue</h1>
          <p className="mt-2 text-sm text-slate-400">
            Live revenue from Stripe • Updated: {lastSync}
          </p>
        </div>
        <StripeModeBadge mode={stripeMode} />
      </div>

      {/* Live Stripe MRR Highlight */}
      <div className="rounded-lg border border-emerald-800/30 bg-gradient-to-br from-emerald-900/20 to-slate-900/50 p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium text-slate-400">
                Monthly Recurring Revenue
              </p>
              <span className="text-xs text-emerald-400/60 font-medium">
                from Stripe
              </span>
            </div>
            <p className="mt-4 text-5xl font-bold text-slate-100">
              {formatMoney(stripeMrr)}
            </p>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-slate-500" />
                <span className="text-slate-400">
                  {totalSubs} active subscription{totalSubs !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="text-slate-600">•</div>
              <span className="text-slate-400">
                ARR: {formatMoney(arrCents)}
              </span>
            </div>
            
            {/* Show delta if DB differs from Stripe */}
            {Math.abs(stripeMrr - dbMrr) > 0 && (
              <div className="mt-4 rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
                <p className="text-xs text-amber-400">
                  ⚠️ DB shows {formatMoney(dbMrr)} (delta: {formatMoney(Math.abs(stripeMrr - dbMrr))})
                  {' • '}
                  <a href="/admin/revenue/reconciliation" className="underline hover:text-amber-300">
                    View reconciliation
                  </a>
                </p>
              </div>
            )}
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
            <span className="text-slate-400">Stripe Active Subscriptions</span>
            <span className="font-semibold text-slate-100">{totalSubs}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Monthly Recurring Revenue</span>
            <span className="font-semibold text-emerald-400">
              {formatMoney(stripeMrr)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Annual Recurring Revenue</span>
            <span className="font-semibold text-emerald-400">
              {formatMoney(arrCents)}
            </span>
          </div>
          <div className="border-t border-slate-800 pt-3 flex justify-between">
            <span className="text-slate-400">Failed Payments</span>
            <span
              className={`font-semibold ${data.failedPayments > 0 ? 'text-red-400' : 'text-slate-100'}`}
            >
              {data.failedPayments}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Last Synced</span>
            <span className="text-xs text-slate-500">{lastSync}</span>
          </div>
        </div>
      </div>
      
      {/* Refresh Notice */}
      <div className="rounded-lg bg-slate-900/30 border border-slate-800/50 p-4">
        <p className="text-xs text-slate-500">
          💡 Data refreshes automatically every 10 seconds. Reload the page for latest numbers.
        </p>
      </div>
    </div>
  );
}
