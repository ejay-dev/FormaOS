import Link from 'next/link';
import { getAdminFetchConfig } from '@/app/admin/lib';
import { BillingActionButtons } from '@/app/admin/components/billing-action-buttons';
import { Clock, AlertTriangle, CheckCircle, CalendarDays } from 'lucide-react';

type Trial = {
  id: string;
  organization_id: string;
  organization_name: string;
  trial_ends_at: string;
  status: 'active' | 'expiring' | 'expired';
  subscription_status: string | null;
  owner_email: string;
  days_remaining: number;
};

type TrialsResponse = {
  page: number;
  pageSize: number;
  total: number;
  trials: Trial[];
};

async function fetchTrials(query?: string, page?: string, status?: string) {
  const { base, headers } = await getAdminFetchConfig();
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (page) params.set('page', page);
  if (status) params.set('status', status);

  const res = await fetch(`${base}/api/admin/trials?${params.toString()}`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function statusBadge(trial: Trial) {
  if (trial.status === 'expired') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium bg-red-500/10 text-red-300">
        <AlertTriangle className="h-3 w-3" />
        Expired
      </span>
    );
  }

  if (trial.status === 'expiring') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium bg-amber-500/10 text-amber-300">
        <Clock className="h-3 w-3" />
        Expiring soon
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-300">
      <CheckCircle className="h-3 w-3" />
      Active
    </span>
  );
}

export default async function AdminTrialsPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string; page?: string; status?: string }>;
}) {
  const resolved = await searchParams;
  const data: TrialsResponse | null = await fetchTrials(
    resolved?.query,
    resolved?.page,
    resolved?.status,
  );
  const trials: Trial[] = data?.trials ?? [];

  const activeCount = trials.filter((trial) => trial.status === 'active').length;
  const expiringCount = trials.filter((trial) => trial.status === 'expiring').length;
  const expiredCount = trials.filter((trial) => trial.status === 'expired').length;

  const requestedPage = Number(resolved?.page ?? '1');
  const fallbackPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const currentPage = data?.page ?? fallbackPage;
  const pageSize = data?.pageSize ?? (trials.length > 0 ? trials.length : 25);
  const total = data?.total ?? trials.length;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (resolved?.query) params.set('query', resolved.query);
    if (resolved?.status) params.set('status', resolved.status);
    params.set('page', String(page));
    return `/admin/trials?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Trial Management</h1>
        <p className="mt-2 text-sm text-slate-400">
          Live trial lifecycle data with extension controls.
        </p>
      </div>

      <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          name="query"
          defaultValue={resolved?.query ?? ''}
          placeholder="Search by org name, owner email, or org ID"
          className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-slate-600 focus:outline-none"
        />
        <select
          name="status"
          defaultValue={resolved?.status ?? ''}
          className="rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-sm text-slate-200 focus:border-slate-600 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="trialing">Trialing subscriptions</option>
          <option value="active">Active subscriptions</option>
          <option value="past_due">Past due</option>
        </select>
        <button
          type="submit"
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/50"
        >
          Filter
        </button>
      </form>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active Trials</p>
              <p className="text-2xl font-bold text-slate-100">{activeCount}</p>
            </div>
            <CheckCircle className="h-6 w-6 text-emerald-500/50" />
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Expiring Soon</p>
              <p className="text-2xl font-bold text-slate-100">{expiringCount}</p>
            </div>
            <Clock className="h-6 w-6 text-amber-500/50" />
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Expired</p>
              <p className="text-2xl font-bold text-slate-100">{expiredCount}</p>
            </div>
            <AlertTriangle className="h-6 w-6 text-red-500/50" />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-6 py-3 text-left font-semibold text-slate-300">
                  Organization
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-300">
                  Owner
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-300">
                  Trial Status
                </th>
                <th className="px-6 py-3 text-left font-semibold text-slate-300">
                  Trial Ends
                </th>
                <th className="px-6 py-3 text-right font-semibold text-slate-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {trials.map((trial) => (
                <tr key={trial.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/orgs/${trial.organization_id}`}
                      className="font-medium text-slate-100 hover:text-sky-300"
                    >
                      {trial.organization_name}
                    </Link>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {trial.organization_id}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{trial.owner_email}</td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      {statusBadge(trial)}
                      <p className="text-xs text-slate-500 capitalize">
                        Subscription: {trial.subscription_status ?? 'N/A'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-300">
                      <CalendarDays className="h-4 w-4 text-slate-500" />
                      <div>
                        <p className="text-sm">{formatDate(trial.trial_ends_at)}</p>
                        <p className="text-xs text-slate-500">
                          {trial.days_remaining >= 0
                            ? `${trial.days_remaining} day(s) remaining`
                            : `${Math.abs(trial.days_remaining)} day(s) overdue`}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <BillingActionButtons orgId={trial.organization_id} />
                  </td>
                </tr>
              ))}
              {trials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-500">
                    <Clock className="mx-auto mb-2 h-8 w-8 opacity-20" />
                    <p>No trial records found</p>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3">
          <p className="text-xs text-slate-400">
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, total)} of {total} trial records
          </p>
          <div className="flex items-center gap-2">
            <a
              href={pageHref(Math.max(1, currentPage - 1))}
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
              href={pageHref(Math.min(totalPages, currentPage + 1))}
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
