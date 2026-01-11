import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireFounderAccess } from "@/app/app/admin/access";

export const dynamic = 'force-dynamic';

type OrgPageProps = {
  params: Promise<{ orgId: string }>;
};

type OrgMemberRow = {
  user_id: string;
  role: string | null;
  created_at: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export default async function AdminOrganizationPage({ params }: OrgPageProps) {
  try {
    await requireFounderAccess();
  } catch (error) {
    console.error("Admin access denied:", error);
    redirect("/app");
  }

  const { orgId } = await params;
  const admin = createSupabaseAdminClient();
  const [{ data: organization }, { data: subscription }, { data: members }] = await Promise.all([
    admin.from("organizations").select("id, name, plan_key, onboarding_completed, created_at").eq("id", orgId).maybeSingle(),
    admin
      .from("org_subscriptions")
      .select("status, current_period_end, stripe_customer_id, stripe_subscription_id, plan_key")
      .eq("organization_id", orgId)
      .maybeSingle(),
    admin.from("org_members").select("user_id, role, created_at").eq("organization_id", orgId),
  ]);

  if (!organization?.id) {
    redirect("/app/admin");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">{organization.name}</h1>
          <p className="text-sm text-slate-400">Organization admin view.</p>
        </div>
        <Link href="/app/admin" className="text-sm text-sky-300 hover:text-sky-200">
          Back to admin
        </Link>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-slate-100">Overview</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#05080f] p-4 text-sm text-slate-300">
            <div className="text-xs uppercase text-slate-500">Plan</div>
            <div className="mt-2 text-base font-semibold text-slate-100">{organization.plan_key ?? "—"}</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#05080f] p-4 text-sm text-slate-300">
            <div className="text-xs uppercase text-slate-500">Onboarding</div>
            <div className="mt-2 text-base font-semibold text-slate-100">
              {organization.onboarding_completed ? "Completed" : "In progress"}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#05080f] p-4 text-sm text-slate-300">
            <div className="text-xs uppercase text-slate-500">Created</div>
            <div className="mt-2 text-base font-semibold text-slate-100">
              {formatDate(organization.created_at)}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#05080f] p-4 text-sm text-slate-300">
            <div className="text-xs uppercase text-slate-500">Subscription Status</div>
            <div className="mt-2 text-base font-semibold text-slate-100">{subscription?.status ?? "—"}</div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-slate-100">Subscription</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-[#05080f] p-4 text-sm text-slate-300">
            <div className="text-xs uppercase text-slate-500">Stripe Customer</div>
            <div className="mt-2 text-base font-semibold text-slate-100">
              {subscription?.stripe_customer_id ?? "—"}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#05080f] p-4 text-sm text-slate-300">
            <div className="text-xs uppercase text-slate-500">Stripe Subscription</div>
            <div className="mt-2 text-base font-semibold text-slate-100">
              {subscription?.stripe_subscription_id ?? "—"}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#05080f] p-4 text-sm text-slate-300">
            <div className="text-xs uppercase text-slate-500">Trial End</div>
            <div className="mt-2 text-base font-semibold text-slate-100">
              {formatDate(subscription?.current_period_end)}
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#05080f] p-4 text-sm text-slate-300">
            <div className="text-xs uppercase text-slate-500">Plan Key</div>
            <div className="mt-2 text-base font-semibold text-slate-100">
              {subscription?.plan_key ?? "—"}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-slate-100">Members</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">User ID</th>
                <th className="py-2">Role</th>
                <th className="py-2">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(members ?? []).map((member: OrgMemberRow) => (
                <tr key={member.user_id}>
                  <td className="py-3">{member.user_id}</td>
                  <td className="py-3">{member.role ?? "—"}</td>
                  <td className="py-3">{formatDate(member.created_at)}</td>
                </tr>
              ))}
              {(members ?? []).length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-sm text-slate-500">
                    No members found.
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
