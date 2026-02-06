import { getAdminFetchConfig } from '@/app/admin/lib';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { requireFounderAccess } from '@/app/app/admin/access';
import { repairOrgProvisioning, repairUserProvisioning } from './actions';
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

  await requireFounderAccess();
  const admin = createSupabaseAdminClient();

  const { data: userList } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 8,
    search: trimmed,
  });
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
  const data = await fetchSupport(resolved?.status);
  const rows: SupportRow[] = data?.data ?? [];
  const provision = await fetchProvisioningLookup(resolved?.q);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Support</h1>
        <p className="mt-2 text-sm text-slate-400">
          Inbound requests and contact queue.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Requester</th>
                <th className="py-2">Subject</th>
                <th className="py-2">Status</th>
                <th className="py-2">Created</th>
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
                  <td className="py-3">{row.status}</td>
                  <td className="py-3">{formatDate(row.created_at)}</td>
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
