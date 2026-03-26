import Link from 'next/link';
import { getAdminFetchConfig } from '@/app/admin/lib';
import { OrgActionButtons } from '@/app/admin/components/org-action-buttons';
import { Building2, Calendar, Zap } from 'lucide-react';

type OrgRow = {
  id: string;
  name: string | null;
  owner_email: string;
  plan_key: string | null;
  status: string;
  lifecycle_status: string;
  subscription_status: string;
  created_at: string | null;
  trial_expires_at: string | null;
};

type OrgsResponse = {
  page: number;
  pageSize: number;
  total: number;
  data: OrgRow[];
};

async function fetchOrganizations(query?: string, page?: string) {
  const { base, headers } = await getAdminFetchConfig();
  const params = new URLSearchParams();
  if (query) params.set('query', query);
  if (page) params.set('page', page);

  const res = await fetch(`${base}/api/admin/orgs?${params.toString()}`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

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

function getPlanColor(plan?: string | null) {
  switch (plan?.toLowerCase()) {
    case 'starter':
    case 'basic':
      return 'bg-purple-500/10 text-purple-300';
    case 'pro':
      return 'bg-emerald-500/10 text-emerald-300';
    case 'enterprise':
      return 'bg-blue-500/10 text-blue-300';
    default:
      return 'bg-muted/40 text-muted-foreground';
  }
}

function getStatusColor(status?: string) {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-emerald-500/10 text-emerald-300';
    case 'trialing':
      return 'bg-amber-500/10 text-amber-300';
    case 'suspended':
      return 'bg-red-500/10 text-red-300';
    case 'retired':
      return 'bg-slate-500/20 text-slate-200';
    default:
      return 'bg-muted/40 text-muted-foreground';
  }
}

export default async function AdminOrgsPage({
  searchParams,
}: {
  searchParams?: Promise<{ query?: string; page?: string }>;
}) {
  const resolved = await searchParams;
  const data: OrgsResponse | null = await fetchOrganizations(
    resolved?.query,
    resolved?.page,
  );
  const rows: OrgRow[] = data?.data ?? [];
  const requestedPage = Number(resolved?.page ?? '1');
  const fallbackPage =
    Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const currentPage = data?.page ?? fallbackPage;
  const pageSize = data?.pageSize ?? (rows.length > 0 ? rows.length : 25);
  const total = data?.total ?? rows.length;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(pageSize, 1)));
  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  const pageHref = (page: number) => {
    const params = new URLSearchParams();
    if (resolved?.query) params.set('query', resolved.query);
    params.set('page', String(page));
    return `/admin/orgs?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Organizations</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage tenant subscriptions, plans, and account status
        </p>
      </div>

      {/* Search */}
      <form className="flex items-center gap-2">
        <input
          name="query"
          defaultValue={resolved?.query ?? ''}
          placeholder="Search by organization name or owner"
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg border border-border bg-muted/50 px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/50"
        >
          Search
        </button>
      </form>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card/80">
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">
                  Organization
                </th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">
                  Owner
                </th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">
                  Plan
                </th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">
                  Lifecycle / Billing
                </th>
                <th className="px-6 py-3 text-left font-semibold text-muted-foreground">
                  Trial Expires
                </th>
                <th className="px-6 py-3 text-right font-semibold text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((org) => (
                <tr
                  key={org.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-border flex items-center justify-center">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <Link
                        href={`/admin/orgs/${org.id}`}
                        className="text-sm font-medium text-foreground hover:text-sky-300 transition-colors"
                      >
                        {org.name ?? 'Untitled Organization'}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-muted-foreground text-sm">
                      {org.owner_email}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${getPlanColor(
                        org.plan_key,
                      )}`}
                    >
                      <Zap className="h-3 w-3" />
                      {org.plan_key
                        ? org.plan_key.charAt(0).toUpperCase() +
                          org.plan_key.slice(1)
                        : 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <span
                        className={`inline-flex w-fit items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${getStatusColor(
                          org.status,
                        )}`}
                      >
                        {org.status
                          ? org.status.charAt(0).toUpperCase() +
                            org.status.slice(1)
                          : 'N/A'}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        Billing: {org.subscription_status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      {formatDate(org.trial_expires_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <OrgActionButtons
                      orgId={org.id}
                      currentPlan={org.plan_key}
                      currentSubscriptionStatus={org.subscription_status}
                      currentLifecycleStatus={org.lifecycle_status}
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Building2 className="h-8 w-8 opacity-20" />
                      <p className="text-muted-foreground">No organizations found</p>
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
        <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, total)} of {total} organizations
          </p>
          <div className="flex items-center gap-2">
            <a
              href={pageHref(previousPage)}
              aria-disabled={currentPage <= 1}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                currentPage <= 1
                  ? 'pointer-events-none border-border text-muted-foreground'
                  : 'border-border text-foreground hover:bg-muted/70'
              }`}
            >
              Previous
            </a>
            <span className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <a
              href={pageHref(nextPage)}
              aria-disabled={currentPage >= totalPages}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                currentPage >= totalPages
                  ? 'pointer-events-none border-border text-muted-foreground'
                  : 'border-border text-foreground hover:bg-muted/70'
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
