import { getAdminApiBase } from "@/app/admin/lib";

async function fetchOverview() {
  const base = await getAdminApiBase();
  const res = await fetch(`${base}/api/admin/overview`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function AdminRevenuePage() {
  const data = await fetchOverview();

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Revenue data unavailable right now.
      </div>
    );
  }

  const formatMoney = (cents: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Revenue</h1>
        <p className="mt-2 text-sm text-slate-400">Estimated monthly recurring revenue by plan.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Estimated MRR</div>
        <div className="mt-3 text-3xl font-semibold text-slate-100">
          {formatMoney(data.mrrCents ?? 0)}
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {Object.entries(data.activeByPlan ?? {}).map(([plan, count]) => (
            <div key={plan} className="rounded-xl border border-white/10 bg-[hsl(var(--card))] p-4">
              <div className="text-xs uppercase text-slate-500">{plan}</div>
              <div className="mt-2 text-2xl font-semibold text-slate-100">{String(count)}</div>
            </div>
          ))}
          {Object.keys(data.activeByPlan ?? {}).length === 0 ? (
            <div className="text-sm text-slate-500">No active subscriptions yet.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
