import { getAdminFetchConfig } from '@/app/admin/lib';
import { AlertTriangle, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

async function fetchReconciliation() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/mrr-verification`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function ReconciliationPage() {
  const data = await fetchReconciliation();

  if (!data) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/revenue"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Revenue
        </Link>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
          <p className="text-slate-400">Reconciliation data unavailable</p>
        </div>
      </div>
    );
  }

  const formatMoney = (cents: number) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(cents / 100);

  const deltaCents = data.delta_cents ?? 0;
  const isMatch = data.match ?? false;
  const stripeOnly = data.stripe_only ?? [];
  const dbOnly = data.db_only ?? [];
  const perSub = data.per_subscription ?? [];
  
  const mismatches = perSub.filter((sub: any) => !sub.match);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/revenue"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Revenue
        </Link>
        <h1 className="text-3xl font-bold text-slate-100">
          Revenue Reconciliation
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Compare Stripe (source of truth) with database records
        </p>
      </div>

      {/* Status Overview */}
      <div
        className={`rounded-lg border p-6 ${
          isMatch
            ? 'border-emerald-800/30 bg-emerald-900/10'
            : 'border-amber-800/30 bg-amber-900/10'
        }`}
      >
        <div className="flex items-start gap-4">
          {isMatch ? (
            <CheckCircle2 className="h-8 w-8 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-8 w-8 text-amber-400 flex-shrink-0" />
          )}
          <div className="flex-1">
            <h2
              className={`text-xl font-semibold ${isMatch ? 'text-emerald-400' : 'text-amber-400'}`}
            >
              {isMatch ? '✓ Revenue Synced' : '⚠️ Revenue Mismatch'}
            </h2>
            <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Stripe MRR</p>
                <p className="text-lg font-bold text-slate-100 mt-1">
                  {formatMoney(data.stripe_mrr_cents ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">DB MRR</p>
                <p className="text-lg font-bold text-slate-100 mt-1">
                  {formatMoney(data.db_mrr_cents ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Delta</p>
                <p
                  className={`text-lg font-bold mt-1 ${
                    deltaCents === 0
                      ? 'text-emerald-400'
                      : deltaCents > 0
                        ? 'text-amber-400'
                        : 'text-red-400'
                  }`}
                >
                  {deltaCents >= 0 ? '+' : ''}
                  {formatMoney(Math.abs(deltaCents))}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Stripe Active:</span>
                <span className="text-slate-300">{data.stripe_active_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DB Active:</span>
                <span className="text-slate-300">{data.db_active_count}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe-Only Subscriptions */}
      {stripeOnly.length > 0 && (
        <div className="rounded-lg border border-amber-800/30 bg-slate-900/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-slate-100">
              In Stripe, Not in DB ({stripeOnly.length})
            </h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            These subscriptions exist in Stripe but have no matching database record.
            Customer may have paid but lacks access.
          </p>
          <div className="space-y-2">
            {stripeOnly.slice(0, 10).map((sub: any, idx: number) => (
              <div
                key={idx}
                className="rounded border border-slate-800 bg-slate-900/30 p-3 text-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono text-xs text-slate-400">
                      {sub.stripe_subscription_id}
                    </p>
                    {sub.stripe_customer_id && (
                      <p className="font-mono text-xs text-slate-500 mt-1">
                        Customer: {sub.stripe_customer_id}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-amber-400">
                      {formatMoney(sub.stripe_amount_cents ?? 0)}/mo
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {sub.stripe_status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DB-Only Subscriptions */}
      {dbOnly.length > 0 && (
        <div className="rounded-lg border border-red-800/30 bg-slate-900/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-semibold text-slate-100">
              In DB, No Stripe ID ({dbOnly.length})
            </h2>
          </div>
          <p className="text-sm text-slate-400 mb-4">
            These subscriptions are active in the database but have no Stripe subscription ID.
            May indicate manual subscriptions or webhook failures.
          </p>
          <div className="space-y-2">
            {dbOnly.slice(0, 10).map((sub: any, idx: number) => (
              <div
                key={idx}
                className="rounded border border-slate-800 bg-slate-900/30 p-3 text-sm"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono text-xs text-slate-400">
                      Org: {sub.organization_id?.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Plan: {sub.plan_key ?? 'unknown'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-400">
                      {formatMoney(sub.db_amount_cents ?? 0)}/mo
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {sub.db_status}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mismatched Subscriptions */}
      {mismatches.length > 0 && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Amount Mismatches ({mismatches.length})
          </h2>
          <p className="text-sm text-slate-400 mb-4">
            Subscriptions found in both systems but with different amounts or statuses.
          </p>
          <div className="space-y-2">
            {mismatches.slice(0, 10).map((sub: any, idx: number) => (
              <div
                key={idx}
                className="rounded border border-slate-800 bg-slate-900/30 p-3 text-sm"
              >
                <p className="font-mono text-xs text-slate-400 mb-2">
                  Org: {sub.organization_id?.slice(0, 8)}... • Plan: {sub.plan_key}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">DB</p>
                    <p className="font-semibold text-slate-300">
                      {formatMoney(sub.db_amount_cents ?? 0)}
                    </p>
                    <p className="text-xs text-slate-500">{sub.db_status}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Stripe</p>
                    <p className="font-semibold text-slate-300">
                      {formatMoney(sub.stripe_amount_cents ?? 0)}
                    </p>
                    <p className="text-xs text-slate-500">{sub.stripe_status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Clear */}
      {stripeOnly.length === 0 && dbOnly.length === 0 && mismatches.length === 0 && (
        <div className="rounded-lg border border-emerald-800/30 bg-emerald-900/10 p-8 text-center">
          <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-emerald-400">
            Perfect Sync
          </p>
          <p className="text-sm text-slate-400 mt-2">
            All subscriptions match between Stripe and database
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="rounded-lg bg-slate-900/30 border border-slate-800/50 p-4">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-500">Verified at:</span>
            <span className="ml-2 text-slate-400">
              {new Date(data.verified_at).toLocaleString('en-AU')}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Stripe mode:</span>
            <span className="ml-2 text-slate-400">{data.stripe_key_mode}</span>
          </div>
          <div>
            <span className="text-slate-500">Duration:</span>
            <span className="ml-2 text-slate-400">{data.duration_ms}ms</span>
          </div>
          {data.errors && data.errors.length > 0 && (
            <div className="col-span-2">
              <span className="text-red-400">Errors:</span>
              <span className="ml-2 text-slate-400">
                {data.errors.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
