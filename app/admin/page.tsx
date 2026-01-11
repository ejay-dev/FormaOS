import { getAdminApiBase } from "@/app/admin/lib";

async function fetchOverview() {
  const base = await getAdminApiBase();
  const res = await fetch(`${base}/api/admin/overview`, { cache: "no-store" });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export default async function AdminOverviewPage() {
  const data: any = await fetchOverview();

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Unable to load admin metrics right now.
      </div>
    );
  }

  const formatMoney = (cents: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Admin Overview</h1>
        <p className="mt-2 text-sm text-slate-400">Live operational health across FormaOS.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Organizations</div>
          <div className="mt-3 text-3xl font-semibold text-slate-100">{data.totalOrgs}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Trials Active</div>
          <div className="mt-3 text-3xl font-semibold text-slate-100">{data.trialsActive}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Trials Expiring (7d)</div>
          <div className="mt-3 text-3xl font-semibold text-slate-100">{data.trialsExpiring}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Estimated MRR</div>
          <div className="mt-3 text-3xl font-semibold text-slate-100">
            {formatMoney(data.mrrCents ?? 0)}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-slate-100">Active plans</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {Object.entries(data.activeByPlan ?? {}).map(([plan, count]) => (
            <div key={plan} className="rounded-xl border border-white/10 bg-[hsl(var(--card))] p-4">
              <div className="text-xs uppercase text-slate-500">{plan}</div>
              <div className="mt-2 text-2xl font-semibold text-slate-100">{String(count)}</div>
            </div>
          ))}
          {Object.keys(data.activeByPlan ?? {}).length === 0 ? (
            <div className="text-sm text-slate-400">No active subscriptions yet.</div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Failed payments flagged: <span className="font-semibold text-rose-300">{data.failedPayments}</span>
      </div>
    </div>
  );
}
