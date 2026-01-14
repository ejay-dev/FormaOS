import { getAdminFetchConfig } from "@/app/admin/lib";
import { BillingActionButtons } from "@/app/admin/components/billing-action-buttons";
import { CreditCard, Calendar, AlertCircle, Zap } from "lucide-react";

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
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getStatusIcon(status?: string | null) {
  switch (status?.toLowerCase()) {
    case "active":
      return <span className="text-emerald-400">●</span>;
    case "trialing":
      return <span className="text-amber-400">●</span>;
    case "past_due":
    case "payment_failed":
      return <span className="text-red-400">●</span>;
    default:
      return <span className="text-slate-400">●</span>;
  }
}

async function fetchSubscriptions(status?: string, page?: string) {
  const { base, headers } = await getAdminFetchConfig();
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page) params.set("page", page);
  const res = await fetch(`${base}/api/admin/subscriptions?${params.toString()}`, {
    cache: "no-store",
    headers,
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

  const activeCount = rows.filter((r) => r.status === "active").length;
  const trialsCount = rows.filter((r) => r.status === "trialing").length;
  const failedCount = rows.filter((r) =>
    ["past_due", "payment_failed"].includes(r.status?.toLowerCase() || "")
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Billing</h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage subscriptions, payments, and trial extensions
        </p>
      </div>

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
                  Stripe ID
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
                        {row.status ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-slate-600/10 text-slate-300">
                      <Zap className="h-3 w-3" />
                      {row.plan_key?.charAt(0).toUpperCase() +
                        row.plan_key?.slice(1) || "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-400">
                      {formatDate(row.trial_expires_at)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs text-slate-500 bg-slate-900/50 px-2 py-1 rounded">
                      {row.stripe_subscription_id?.slice(0, 8)}... || "—"
                    </code>
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
    </div>
  );
}
