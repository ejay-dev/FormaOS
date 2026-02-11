import { getAdminFetchConfig } from '@/app/admin/lib';
import { BillingActionButtons } from '@/app/admin/components/billing-action-buttons';
import { CreditCard, Calendar, AlertCircle, Zap } from 'lucide-react';

type SubscriptionRow = {
  organization_id: string;
  organization_name: string;
  status: string | null;
  plan_key: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_expires_at: string | null;
  current_period_end: string | null;
  payment_failures: number | null;
  grace_period_end: string | null;
};

type SubscriptionResponse = {
  page: number;
  pageSize: number;
  total: number;
  data: SubscriptionRow[];
};

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getStatusIcon(status?: string | null) {
  switch (status?.toLowerCase()) {
    case 'active':
      return <span className="text-emerald-400">●</span>;
    case 'trialing':
      return <span className="text-amber-400">●</span>;
    case 'past_due':
    case 'payment_failed':
      return <span className="text-red-400">●</span>;
    default:
      return <span className="text-slate-400">●</span>;
  }
}

async function fetchSubscriptions(status?: string, page?: string, query?: string) {
  const { base, headers } = await getAdminFetchConfig();
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (page) params.set('page', page);
  if (query) params.set('query', query);
  const res = await fetch(
    `${base}/api/admin/subscriptions?${params.toString()}`,
    {
      cache: 'no-store',
      headers,
    },
  );
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminBillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; page?: string; query?: string }>;
}) {
  const resolved = await searchParams;
  const data: SubscriptionResponse | null = await fetchSubscriptions(
    resolved?.status,
    resolved?.page,
    resolved?.query,
  );
  const rows: SubscriptionRow[] = data?.data ?? [];
  const requestedPage = Number(resolved?.page ?? '1');
  const fallbackPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const currentPage = data?.page ?? fallbackPage;
  const pageSize = data?.pageSize ?? (rows.length > 0 ? rows.length : 25);
  const total = data?.total ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));
  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  const activeCount = rows.filter((r) => r.status === 'active').length;
  const trialsCount = rows.filter((r) => r.status === 'trialing').length;
  const failedCount = rows.filter((r) =>
    ['past_due', 'payment_failed'].includes(r.status?.toLowerCase() || ''),
  ).length;

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (resolved?.status) params.set('status', resolved.status);
    if (resolved?.query) params.set('query', resolved.query);
    params.set('page', String(page));
    return `/admin/billing?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Billing</h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage subscriptions, payments, and trial extensions
        </p>
      </div>

      {/* Search */}
      <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          name="query"
          defaultValue={resolved?.query ?? ''}
          placeholder="Search by org, plan, customer ID, subscription ID"
          className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-slate-600 focus:outline-none"
        />
        <select
          name="status"
          defaultValue={resolved?.status ?? ''}
          className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm text-slate-200 focus:border-slate-600 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="trialing">Trialing</option>
          <option value="past_due">Past Due</option>
          <option value="blocked">Blocked</option>
          <option value="canceled">Canceled</option>
          <option value="pending">Pending</option>
        </select>
        <button
          type="submit"
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/50"
        >
          Filter
        </button>
      </form>

      {/* Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active Subscriptions</p>
              <p className="text-2xl font-bold text-slate-100">{activeCount}</p>
            </div>
            <CreditCard className="h-6 w-6 text-emerald-500/50" />
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active Trials</p>
              <p className="text-2xl font-bold text-slate-100">{trialsCount}</p>
            </div>
            <Calendar className="h-6 w-6 text-amber-500/50" />
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Payment Issues</p>
              <p className="text-2xl font-bold text-slate-100">{failedCount}</p>
            </div>
            <AlertCircle className="h-6 w-6 text-red-500/50" />
          </div>
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="rounded-lg border border-slate-800 bg-slate-900/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-6 py-3 text-left font-semibold text-slate-300">
                  Organization
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-300">
                  Status
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-300">
                  Plan
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-300">
                  Trial Ends
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-300">
                  Billing Details
                </th>
                <th className="px-6 py-3 text-right font-semibold text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {rows.map((row) => (
                <tr
                  key={row.organization_id}
                  className="hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-slate-100">
                      {row.organization_name}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(row.status)}
                      <span className="text-sm text-slate-400 capitalize">
                        {row.status ?? 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-600/10 text-slate-300">
                      <Zap className="h-3 w-3" />
                      {row.plan_key
                        ? row.plan_key.charAt(0).toUpperCase() +
                          row.plan_key.slice(1)
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-400">
                      {formatDate(row.trial_expires_at)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <code className="block text-xs text-slate-500 bg-slate-900/50 px-2 py-1 rounded">
                        {row.stripe_subscription_id
                          ? row.stripe_subscription_id.slice(0, 12) + '...'
                          : 'No Stripe subscription'}
                      </code>
                      <p className="text-[11px] text-slate-500">
                        Next renewal: {formatDate(row.current_period_end)}
                      </p>
                      {Number(row.payment_failures ?? 0) > 0 ? (
                        <p className="text-[11px] text-red-300">
                          Payment failures: {row.payment_failures}
                        </p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <BillingActionButtons orgId={row.organization_id} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard className="h-8 w-8 opacity-20" />
                      <p className="text-slate-500">No subscriptions found</p>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3">
          <p className="text-xs text-slate-400">
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, total)} of {total} subscriptions
          </p>
          <div className="flex items-center gap-2">
            <a
              href={pageHref(previousPage)}
              aria-disabled={currentPage <= 1}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                currentPage <= 1
                  ? 'pointer-events-none border-slate-800 text-slate-600'
                  : 'border-slate-700 text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              Previous
            </a>
            <span className="text-xs text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <a
              href={pageHref(nextPage)}
              aria-disabled={currentPage >= totalPages}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                currentPage >= totalPages
                  ? 'pointer-events-none border-slate-800 text-slate-600'
                  : 'border-slate-700 text-slate-200 hover:bg-slate-800/70'
              }`}
            >
              Next
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
