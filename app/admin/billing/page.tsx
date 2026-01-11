import { getAdminApiBase } from "@/app/admin/lib";

type SubscriptionRow = {
  organization_id: string;
  organization_name: string;
  status: string | null;
  plan_key: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  trial_expires_at: string | null;
};

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

async function fetchSubscriptions(status?: string, page?: string) {
  const base = await getAdminApiBase();
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page) params.set("page", page);
  const res = await fetch(`${base}/api/admin/subscriptions?${params.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminBillingPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; page?: string }>;
}) {
  const resolved = await searchParams;
  const data = await fetchSubscriptions(resolved?.status, resolved?.page);
  const rows: SubscriptionRow[] = data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Billing</h1>
        <p className="mt-2 text-sm text-slate-400">Subscriptions and trial oversight.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-2">Organization</th>
                <th className="py-2">Status</th>
                <th className="py-2">Plan</th>
                <th className="py-2">Trial Ends</th>
                <th className="py-2">Stripe Sub</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row) => (
                <tr key={row.organization_id}>
                  <td className="py-3">{row.organization_name}</td>
                  <td className="py-3">{row.status ?? "—"}</td>
                  <td className="py-3">{row.plan_key ?? "—"}</td>
                  <td className="py-3">{formatDate(row.trial_expires_at)}</td>
                  <td className="py-3">{row.stripe_subscription_id ?? "—"}</td>
                  <td className="py-3">
                    <div className="flex flex-col gap-2">
                      <form
                        method="post"
                        action={`/api/admin/orgs/${row.organization_id}/trial/extend`}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="number"
                          name="days"
                          min={1}
                          max={90}
                          defaultValue={14}
                          className="w-16 rounded-lg border border-white/10 bg-[hsl(var(--card))] px-2 py-1 text-xs text-slate-200"
                        />
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                        >
                          Extend trial
                        </button>
                      </form>
                      <form method="post" action={`/api/admin/orgs/${row.organization_id}/trial/reset`}>
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                        >
                          Reset trial
                        </button>
                      </form>
                      <form
                        method="post"
                        action={`/api/admin/subscriptions/${row.organization_id}/resync-stripe`}
                      >
                        <button
                          type="submit"
                          className="rounded-lg border border-white/10 px-2 py-1 text-xs text-slate-200 hover:bg-white/5"
                        >
                          Resync Stripe
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                    No subscriptions found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
