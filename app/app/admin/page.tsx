import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { PLAN_CATALOG, resolvePlanKey } from "@/lib/plans";
import { requireFounderAccess } from "@/app/app/admin/access";
import {
  extendTrial,
  resyncStripeSubscription,
  setOrgStatus,
  updateOrgPlan,
} from "@/app/app/admin/actions";

export const dynamic = 'force-dynamic';

type AdminUser = {
  id: string;
  email?: string | null;
  last_sign_in_at?: string | null;
  email_confirmed_at?: string | null;
};

type OrgMember = {
  organization_id: string;
  user_id: string;
  role: string | null;
  created_at?: string | null;
};

type OrgSubscription = {
  organization_id: string;
  status?: string | null;
  current_period_end?: string | null;
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan_key?: string | null;
};

type Organization = {
  id: string;
  name?: string | null;
  plan_key?: string | null;
  onboarding_completed?: boolean | null;
  created_at?: string | null;
};

type OrganizationRow = {
  id: string;
  name?: string | null;
  ownerEmail: string;
  planKey?: string | null;
  status?: string | null;
  trialEnd?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  created_at?: string | null;
};

type SubscriptionRow = OrgSubscription & {
  organizationName: string;
  isAttention: boolean;
};

type UserRow = {
  id: string;
  email: string;
  role: string;
  organization: string;
  lastLogin?: string | null;
  status: string;
};

async function fetchAllUsers(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const users: AdminUser[] = [];
  let page = 1;
  const perPage = 1000;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("Admin user list failed:", error);
      break;
    }
    users.push(...(data?.users ?? []));
    if (!data?.users || data.users.length < perPage) {
      break;
    }
    page += 1;
  }

  return users;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

function formatDaysRemaining(value?: string | null) {
  if (!value) return "—";
  const end = new Date(value).getTime();
  if (Number.isNaN(end)) return "—";
  const diffMs = end - Date.now();
  const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  return `${days} day${Math.abs(days) === 1 ? "" : "s"}`;
}

export default async function AdminDashboardPage() {
  try {
    await requireFounderAccess();
  } catch (error) {
    console.error("Admin access denied:", error);
    redirect("/app");
  }

  const admin = createSupabaseAdminClient();
  const hasAdminAuth = typeof (admin as any).auth?.admin?.listUsers === "function";

  if (!hasAdminAuth) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Admin access requires `SUPABASE_SERVICE_ROLE_KEY`. Configure the service role key to load
        organization and user data.
      </div>
    );
  }
  const [{ data: organizations }, { data: members }, { data: subscriptions }] = await Promise.all([
    admin.from("organizations").select("id, name, plan_key, onboarding_completed, created_at"),
    admin.from("org_members").select("organization_id, user_id, role, created_at"),
    admin
      .from("org_subscriptions")
      .select("organization_id, status, current_period_end, stripe_customer_id, stripe_subscription_id, plan_key"),
  ]);

  const users = await fetchAllUsers(admin);
  const userMap = new Map<string, AdminUser>();
  users.forEach((user) => {
    userMap.set(user.id, user);
  });

  const ownerByOrg = new Map<string, string>();
  const membersByOrg = new Map<string, { user_id: string; role: string | null }[]>();
  (members ?? []).forEach((member: OrgMember) => {
    const list = membersByOrg.get(member.organization_id) ?? [];
    list.push({ user_id: member.user_id, role: member.role });
    membersByOrg.set(member.organization_id, list);
    if (!ownerByOrg.has(member.organization_id) && member.role === "owner") {
      ownerByOrg.set(member.organization_id, member.user_id);
    }
  });

  const subscriptionByOrg = new Map<string, typeof subscriptions extends Array<infer T> ? T : any>();
  (subscriptions ?? []).forEach((subscription: OrgSubscription) => {
    subscriptionByOrg.set(subscription.organization_id, subscription);
  });

  const organizationRows: OrganizationRow[] = (organizations ?? []).map((org: Organization) => {
    const subscription = subscriptionByOrg.get(org.id);
    const ownerId =
      ownerByOrg.get(org.id) ?? membersByOrg.get(org.id)?.[0]?.user_id ?? "";
    const ownerEmail = ownerId ? userMap.get(ownerId)?.email ?? "—" : "—";
    const planKey = resolvePlanKey(subscription?.plan_key ?? org.plan_key ?? null);
    const status = subscription?.status ?? "pending";

    return {
      ...org,
      ownerEmail,
      planKey,
      status,
      trialEnd: subscription?.current_period_end ?? null,
      stripeCustomerId: subscription?.stripe_customer_id ?? null,
      stripeSubscriptionId: subscription?.stripe_subscription_id ?? null,
    };
  });

  const trialRows = organizationRows.filter((org) => org.status === "trialing");

  const subscriptionRows: SubscriptionRow[] = (subscriptions ?? []).map((subscription: OrgSubscription) => {
    const org = organizationRows.find((row) => row.id === subscription.organization_id);
    const statusValue = (subscription.status ?? "").toLowerCase();
    const isAttention = ["unpaid", "past_due", "cancelled", "canceled", "incomplete", "incomplete_expired"].includes(
      statusValue
    );
    return {
      ...subscription,
      organizationName: org?.name ?? "Unknown",
      isAttention,
    };
  });

  const userRows: UserRow[] = (members ?? []).map((member: OrgMember) => {
    const user = userMap.get(member.user_id);
    const org = organizationRows.find((row) => row.id === member.organization_id);
    const confirmed = Boolean(user?.email_confirmed_at);
    return {
      id: member.user_id,
      email: user?.email ?? "—",
      role: member.role ?? "—",
      organization: org?.name ?? "—",
      lastLogin: user?.last_sign_in_at ?? null,
      status: confirmed ? "confirmed" : "pending",
    };
  });

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Founder Admin</h1>
        <p className="mt-2 text-sm text-slate-400">
          Operator console for monitoring organizations, subscriptions, trials, and users.
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">Organizations</h2>
            <p className="text-sm text-slate-400">All active organizations with owner and billing status.</p>
          </div>
          <div className="text-xs text-slate-500">Total: {organizationRows.length}</div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Organization</th>
                <th className="py-2">Owner</th>
                <th className="py-2">Plan</th>
                <th className="py-2">Status</th>
                <th className="py-2">Trial End</th>
                <th className="py-2">Stripe Customer</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {organizationRows.map((org) => (
                <tr key={org.id}>
                  <td className="py-3 font-semibold text-slate-100">{org.name}</td>
                  <td className="py-3">{org.ownerEmail}</td>
                  <td className="py-3">{org.planKey ?? "—"}</td>
                  <td className="py-3">{org.status ?? "—"}</td>
                  <td className="py-3">{formatDate(org.trialEnd)}</td>
                  <td className="py-3">{org.stripeCustomerId ?? "—"}</td>
                  <td className="py-3">
                    <div className="flex flex-col gap-2">
                      <form action={updateOrgPlan} className="flex items-center gap-2">
                        <input type="hidden" name="orgId" value={org.id} />
                        <select
                          name="plan"
                          defaultValue={org.planKey ?? "basic"}
                          className="rounded-lg border border-white/10 bg-[#05080f] px-2 py-1 text-xs text-slate-200"
                        >
                          {Object.values(PLAN_CATALOG).map((plan) => (
                            <option key={plan.key} value={plan.key}>
                              {plan.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                        >
                          Update
                        </button>
                      </form>
                      <form action={extendTrial} className="flex items-center gap-2">
                        <input type="hidden" name="orgId" value={org.id} />
                        <input
                          name="days"
                          type="number"
                          min={1}
                          max={90}
                          defaultValue={14}
                          className="w-16 rounded-lg border border-white/10 bg-[#05080f] px-2 py-1 text-xs text-slate-200"
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                        >
                          Extend trial
                        </button>
                      </form>
                      <form action={setOrgStatus}>
                        <input type="hidden" name="orgId" value={org.id} />
                        <input
                          type="hidden"
                          name="action"
                          value={org.status === "blocked" ? "unblock" : "block"}
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                        >
                          {org.status === "blocked" ? "Unblock" : "Block"}
                        </button>
                      </form>
                      <Link
                        href={`/app/admin/orgs/${org.id}`}
                        className="text-xs text-sky-300 hover:text-sky-200"
                      >
                        Open admin view
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {organizationRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-slate-500">
                    No organizations found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-slate-100">Subscriptions</h2>
          <p className="text-sm text-slate-400">Stripe subscription health and resync controls.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Organization</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Stripe Sub</th>
                  <th className="py-2">Trial End</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {subscriptionRows.map((row) => (
                  <tr key={row.organization_id}>
                    <td className="py-3">{row.organizationName}</td>
                    <td className={`py-3 ${row.isAttention ? "text-rose-300" : ""}`}>
                      {row.status ?? "—"}
                    </td>
                    <td className="py-3">{row.stripe_subscription_id ?? "—"}</td>
                    <td className="py-3">{formatDate(row.current_period_end)}</td>
                    <td className="py-3">
                      <form action={resyncStripeSubscription}>
                        <input type="hidden" name="orgId" value={row.organization_id} />
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                        >
                          Resync
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {subscriptionRows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                      No subscriptions found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-slate-100">Trials</h2>
          <p className="text-sm text-slate-400">Active trials and remaining days.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-2">Organization</th>
                  <th className="py-2">Plan</th>
                  <th className="py-2">Trial Ends</th>
                  <th className="py-2">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {trialRows.map((org) => (
                  <tr key={org.id}>
                    <td className="py-3">{org.name}</td>
                    <td className="py-3">{org.planKey ?? "—"}</td>
                    <td className="py-3">{formatDate(org.trialEnd)}</td>
                    <td className="py-3">{formatDaysRemaining(org.trialEnd)}</td>
                  </tr>
                ))}
                {trialRows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-slate-500">
                      No trial accounts found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-slate-100">Users</h2>
        <p className="text-sm text-slate-400">User roster across organizations.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Organization</th>
                <th className="py-2">Last Login</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {userRows.map((row) => (
                <tr key={`${row.id}-${row.organization}`}>
                  <td className="py-3">{row.email}</td>
                  <td className="py-3">{row.role}</td>
                  <td className="py-3">{row.organization}</td>
                  <td className="py-3">{formatDate(row.lastLogin)}</td>
                  <td className="py-3">{row.status}</td>
                </tr>
              ))}
              {userRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                    No users found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
