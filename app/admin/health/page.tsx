import { getAdminFetchConfig } from "@/app/admin/lib";

async function fetchHealth() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/health`, { cache: "no-store", headers });
  if (!res.ok) return null;
  return res.json();
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default async function AdminHealthPage() {
  const data = await fetchHealth();

  if (!data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
        Health checks unavailable.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">System Health</h1>
        <p className="mt-2 text-sm text-slate-400">Recent webhook and admin activity signals.</p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-slate-100">Billing Events</h2>
        <div className="mt-4 space-y-2 text-sm text-slate-300">
          {(data.billingEvents ?? []).map((event: any) => (
            <div key={event.id} className="flex items-center justify-between rounded-xl bg-[hsl(var(--card))] px-4 py-3">
              <span>{event.event_type}</span>
              <span className="text-xs text-slate-500">{formatDate(event.processed_at)}</span>
            </div>
          ))}
          {(data.billingEvents ?? []).length === 0 ? (
            <div className="text-sm text-slate-500">No recent billing events.</div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-xl font-semibold text-slate-100">Admin Activity</h2>
        <div className="mt-4 space-y-2 text-sm text-slate-300">
          {(data.adminAudit ?? []).map((event: any) => (
            <div key={event.id} className="flex items-center justify-between rounded-xl bg-[hsl(var(--card))] px-4 py-3">
              <span>
                {event.action} · {event.target_type}
              </span>
              <span className="text-xs text-slate-500">{formatDate(event.created_at)}</span>
            </div>
          ))}
          {(data.adminAudit ?? []).length === 0 ? (
            <div className="text-sm text-slate-500">No admin events yet.</div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
