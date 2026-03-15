import { getAdminFetchConfig } from '@/app/admin/lib';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireAdminAccess } from '@/app/app/admin/access';
import { repairOrgProvisioning, repairUserProvisioning } from './actions';
import { SupportCaseActions } from '@/app/admin/components/support-case-actions';
import type { User } from '@supabase/supabase-js';

type SupportRow = {
  id: string;
  email: string;
  name: string | null;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};

type OrgSummary = {
  id: string;
  name: string | null;
  plan_key: string | null;
  onboarding_completed: boolean | null;
  created_at: string | null;
  role?: string | null;
  subscription_status?: string | null;
  trial_end?: string | null;
  entitlements_enabled?: number;
  entitlements_total?: number;
};

type UserSummary = {
  id: string;
  email: string | null;
  created_at: string | null;
  orgs: OrgSummary[];
};

type OrgRow = {
  id: string;
  name: string | null;
  plan_key: string | null;
  onboarding_completed: boolean | null;
  created_at: string | null;
  created_by: string | null;
};

type MembershipRow = {
  user_id: string;
  organization_id: string;
  role: string | null;
};

type SubscriptionRow = {
  organization_id: string;
  status: string | null;
  trial_expires_at: string | null;
  current_period_end: string | null;
};

type EntitlementRow = {
  organization_id: string;
  enabled: boolean | null;
};

type BillingTimelineResponse = {
  summary?: {
    totalEvents?: number;
    totalSubscriptions?: number;
    issuesCount?: number;
    statusCounts?: Record<string, number>;
  };
  issues?: Array<{
    type: string;
    message: string;
    orgId?: string;
    orgName?: string;
  }>;
};

type AutomationFailuresResponse = {
  summary?: {
    totalFailures?: number;
    uniqueJobs?: number;
    activeAlerts?: number;
    jobStats?: Array<{
      jobName: string;
      failures: number;
      failureRate: string;
      avgDuration: number;
    }>;
  };
  failures?: Array<{
    id: string;
    jobName: string;
    orgId?: string;
    errorCode: string;
    errorMessage: string;
    timestamp: string;
  }>;
};

function formatDate(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString();
}

async function fetchSupport(status?: string) {
  const { base, headers } = await getAdminFetchConfig();
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const res = await fetch(`${base}/api/admin/support?${params.toString()}`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchBillingTimeline() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/support/billing-timeline?limit=25&days=30`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) return null;
  return (await res.json()) as BillingTimelineResponse;
}

async function fetchAutomationFailures() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(
    `${base}/api/admin/support/automation-failures?limit=25&hours=72`,
    {
      cache: 'no-store',
      headers,
    },
  );
  if (!res.ok) return null;
  return (await res.json()) as AutomationFailuresResponse;
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function fetchProvisioningLookup(query?: string) {
  const trimmed = (query ?? '').trim();
  if (!trimmed) {
    return { users: [] as UserSummary[], orgs: [] as OrgSummary[] };
  }

  await requireAdminAccess({ permission: 'support:view' });
  const admin = createSupabaseAdminClient();

  // GoTrue REST API supports `search` but @supabase/auth-js PageParams omits it.
  // Build params object separately so TS doesn't reject the excess property.
  const listParams: Record<string, unknown> = { page: 1, perPage: 8, search: trimmed };
  const { data: userList } = await admin.auth.admin.listUsers(listParams as { page?: number; perPage?: number });
  const users: User[] = userList?.users ?? [];

  const userIds = users.map((user) => user.id);
  const orgMatchesQuery = admin
    .from('organizations')
    .select('id, name, plan_key, onboarding_completed, created_at, created_by')
    .ilike('name', `%${trimmed}%`)
    .limit(8);

  if (isUuid(trimmed)) {
    orgMatchesQuery.eq('id', trimmed);
  }

  const { data: orgMatchesData } = await orgMatchesQuery;
  const orgMatches: OrgRow[] = orgMatchesData ?? [];

  const { data: membershipsData } = userIds.length
    ? await admin
        .from('org_members')
        .select('user_id, organization_id, role')
        .in('user_id', userIds)
    : { data: [] };
  const memberships: MembershipRow[] = membershipsData ?? [];

  const orgIds = Array.from(
    new Set([
      ...orgMatches.map((org) => org.id),
      ...memberships.map((membership) => membership.organization_id),
    ]),
  );

  const { data: orgsData } = orgIds.length
    ? await admin
        .from('organizations')
        .select('id, name, plan_key, onboarding_completed, created_at, created_by')
        .in('id', orgIds)
    : { data: [] };
  const orgs: OrgRow[] = orgsData ?? [];

  const { data: subscriptionsData } = orgIds.length
    ? await admin
        .from('org_subscriptions')
        .select('organization_id, status, trial_expires_at, current_period_end')
        .in('organization_id', orgIds)
    : { data: [] };
  const subscriptions: SubscriptionRow[] = subscriptionsData ?? [];

  const { data: entitlementsData } = orgIds.length
    ? await admin
        .from('org_entitlements')
        .select('organization_id, enabled')
        .in('organization_id', orgIds)
    : { data: [] };
  const entitlements: EntitlementRow[] = entitlementsData ?? [];

  const orgMap = new Map(orgs.map((org) => [org.id, org]));
  const subscriptionMap = new Map(
    subscriptions.map((sub) => [sub.organization_id, sub]),
  );
  const entitlementsMap = new Map<
    string,
    { total: number; enabled: number }
  >();

  for (const row of entitlements) {
    const entry =
      entitlementsMap.get(row.organization_id) ?? { total: 0, enabled: 0 };
    entry.total += 1;
    if (row.enabled) entry.enabled += 1;
    entitlementsMap.set(row.organization_id, entry);
  }

  const buildOrgSummary = (
    orgId: string,
    role?: string | null,
  ): OrgSummary => {
    const org = orgMap.get(orgId);
    const subscription = subscriptionMap.get(orgId);
    const entitlementCounts = entitlementsMap.get(orgId);
    const trialEnd =
      subscription?.trial_expires_at ?? subscription?.current_period_end ?? null;

    return {
      id: orgId,
      name: org?.name ?? null,
      plan_key: org?.plan_key ?? null,
      onboarding_completed: org?.onboarding_completed ?? null,
      created_at: org?.created_at ?? null,
      role: role ?? null,
      subscription_status: subscription?.status ?? null,
      trial_end: trialEnd,
      entitlements_enabled: entitlementCounts?.enabled ?? 0,
      entitlements_total: entitlementCounts?.total ?? 0,
    };
  };

  const userSummaries: UserSummary[] = users.map((user) => {
    const userMemberships =
      memberships?.filter((membership) => membership.user_id === user.id) ?? [];
    return {
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at ?? null,
      orgs: userMemberships.map((membership) =>
        buildOrgSummary(membership.organization_id, membership.role),
      ),
    };
  });

  const orgSummaries: OrgSummary[] = (orgMatches ?? []).map((org) =>
    buildOrgSummary(org.id),
  );

  return { users: userSummaries, orgs: orgSummaries };
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; q?: string }>;
}) {
  const resolved = await searchParams;
  const [data, provision, billingTimeline, automationFailures] =
    await Promise.all([
      fetchSupport(resolved?.status),
      fetchProvisioningLookup(resolved?.q),
      fetchBillingTimeline(),
      fetchAutomationFailures(),
    ]);
  const rows: SupportRow[] = data?.data ?? [];
  const billingSummary = billingTimeline?.summary;
  const billingIssues = billingTimeline?.issues ?? [];
  const automationSummary = automationFailures?.summary;
  const failureRows = automationFailures?.failures ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Support</h1>
        <p className="mt-2 text-sm text-slate-400">
          Inbound requests and contact queue.
        </p>
      </div>

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Billing Watch
          </div>
          <div className="mt-3 text-2xl font-semibold text-slate-100">
            {billingSummary?.issuesCount ?? 0}
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Open billing anomalies across{' '}
            {billingSummary?.totalSubscriptions ?? 0} subscriptions.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Automation Failures
          </div>
          <div className="mt-3 text-2xl font-semibold text-slate-100">
            {automationSummary?.totalFailures ?? 0}
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {automationSummary?.uniqueJobs ?? 0} failing job families in the last
            72 hours.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
            Active Alerts
          </div>
          <div className="mt-3 text-2xl font-semibold text-slate-100">
            {automationSummary?.activeAlerts ?? 0}
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Support and platform signals requiring follow-up.
          </p>
        </div>
      </section>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Requester</th>
                <th className="py-2">Subject</th>
                <th className="py-2">Status</th>
                <th className="py-2">Created</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="py-3">
                    <div className="text-slate-100">
                      {row.name ?? row.email}
                    </div>
                    <div className="text-xs text-slate-500">{row.email}</div>
                  </td>
                  <td className="py-3">
                    <div className="text-slate-100">{row.subject}</div>
                    <div className="text-xs text-slate-500 line-clamp-2">
                      {row.message}
                    </div>
                  </td>
                  <td className="py-3 capitalize">{row.status}</td>
                  <td className="py-3">{formatDate(row.created_at)}</td>
                  <td className="py-3">
                    <SupportCaseActions
                      requestId={row.id}
                      currentStatus={row.status}
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-6 text-center text-sm text-slate-500"
                  >
                    No support requests logged.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">
                Billing Timeline
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Subscription health and trial drift surfaced for support.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Events {billingSummary?.totalEvents ?? 0}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
            {Object.entries(billingSummary?.statusCounts ?? {}).map(
              ([status, count]) => (
                <span
                  key={status}
                  className="rounded-full border border-white/10 px-2 py-1"
                >
                  {status}: {count}
                </span>
              ),
            )}
          </div>
          <div className="mt-4 space-y-3">
            {billingIssues.slice(0, 6).map((issue) => (
              <div
                key={`${issue.type}:${issue.orgId ?? issue.message}`}
                className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4"
              >
                <p className="text-sm font-medium text-amber-100">
                  {issue.orgName ?? issue.orgId ?? issue.type}
                </p>
                <p className="mt-1 text-xs text-amber-100/80">{issue.message}</p>
              </div>
            ))}
            {billingIssues.length === 0 ? (
              <p className="text-sm text-slate-500">
                No billing anomalies detected in the last 30 days.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-100">
                Automation Failures
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Job failures and error signatures from the last 72 hours.
              </p>
            </div>
            <div className="text-xs text-slate-500">
              Alerts {automationSummary?.activeAlerts ?? 0}
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {failureRows.slice(0, 6).map((failure) => (
              <div
                key={failure.id}
                className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-rose-100">
                    {failure.jobName}
                  </p>
                  <span className="text-[11px] uppercase tracking-wide text-rose-200/80">
                    {failure.errorCode}
                  </span>
                </div>
                <p className="mt-1 text-xs text-rose-100/80">
                  {failure.errorMessage}
                </p>
                <p className="mt-2 text-[11px] text-rose-200/70">
                  {formatDate(failure.timestamp)}
                </p>
              </div>
            ))}
            {failureRows.length === 0 ? (
              <p className="text-sm text-slate-500">
                No automation failures recorded in the last 72 hours.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">Account Repair</h2>
          <p className="text-sm text-slate-400">
            Search by user email or organization name to verify subscription and entitlements.
          </p>
        </div>

        <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="text"
            name="q"
            defaultValue={resolved?.q ?? ''}
            placeholder="Search by email, org name, or ID"
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none"
          />
          {resolved?.status ? (
            <input type="hidden" name="status" value={resolved.status} />
          ) : null}
          <button className="rounded-lg bg-cyan-500/80 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400 transition-colors">
            Search
          </button>
        </form>

        {resolved?.q ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                User Matches
              </h3>
              {provision.users.length === 0 ? (
                <p className="text-sm text-slate-500">No users found.</p>
              ) : (
                <div className="space-y-4">
                  {provision.users.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-xl border border-white/10 bg-slate-900/40 p-4 space-y-3"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-100">
                            {user.email ?? 'Unknown user'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {user.id}
                          </div>
                        </div>
                        <form action={repairUserProvisioning}>
                          <input type="hidden" name="userId" value={user.id} />
                          <button className="rounded-lg border border-cyan-400/40 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/10">
                            Repair user
                          </button>
                        </form>
                      </div>

                      {user.orgs.length === 0 ? (
                        <p className="text-xs text-slate-500">
                          No organization memberships found.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {user.orgs.map((org) => (
                            <div
                              key={org.id}
                              className="rounded-lg border border-white/5 bg-white/5 px-3 py-2 text-xs text-slate-300"
                            >
                              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div className="font-semibold text-slate-100">
                                  {org.name ?? 'Unnamed organization'}
                                </div>
                                <form action={repairOrgProvisioning}>
                                  <input type="hidden" name="orgId" value={org.id} />
                                  <button className="text-[11px] font-semibold text-cyan-200 hover:text-cyan-100">
                                    Repair org
                                  </button>
                                </form>
                              </div>
                              <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 mt-1">
                                <span>Role: {org.role ?? 'unknown'}</span>
                                <span>Plan: {org.plan_key ?? 'unset'}</span>
                                <span>Status: {org.subscription_status ?? 'none'}</span>
                                <span>
                                  Entitlements: {org.entitlements_enabled ?? 0}/
                                  {org.entitlements_total ?? 0}
                                </span>
                                {org.trial_end ? (
                                  <span>Trial ends: {formatDate(org.trial_end)}</span>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">
                Organization Matches
              </h3>
              {provision.orgs.length === 0 ? (
                <p className="text-sm text-slate-500">No organizations found.</p>
              ) : (
                <div className="space-y-3">
                  {provision.orgs.map((org) => (
                    <div
                      key={org.id}
                      className="rounded-xl border border-white/10 bg-slate-900/40 p-4 text-sm text-slate-300"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-semibold text-slate-100">
                            {org.name ?? 'Unnamed organization'}
                          </div>
                          <div className="text-xs text-slate-500">{org.id}</div>
                        </div>
                        <form action={repairOrgProvisioning}>
                          <input type="hidden" name="orgId" value={org.id} />
                          <button className="rounded-lg border border-cyan-400/40 px-3 py-1.5 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/10">
                            Repair org
                          </button>
                        </form>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-2">
                        <span>Plan: {org.plan_key ?? 'unset'}</span>
                        <span>Status: {org.subscription_status ?? 'none'}</span>
                        <span>
                          Entitlements: {org.entitlements_enabled ?? 0}/
                          {org.entitlements_total ?? 0}
                        </span>
                        {org.trial_end ? (
                          <span>Trial ends: {formatDate(org.trial_end)}</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
