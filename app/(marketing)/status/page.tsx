import type { Metadata } from 'next';
import { CheckCircle2, XCircle, Clock, Activity } from 'lucide-react';
import { fetchPublicUptimeChecks } from '@/lib/status/public-uptime';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.formaos.com.au';

export const metadata: Metadata = {
  title: 'FormaOS | Status',
  description: 'Public uptime checks and status for FormaOS.',
  alternates: { canonical: `${siteUrl}/status` },
};

type Row = {
  checked_at: string;
  ok: boolean;
  latency_ms: number | null;
  source: string;
};

function pct(ok: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((ok / total) * 10000) / 100;
}

export default async function StatusPage() {
  const now = new Date();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const rows = (await fetchPublicUptimeChecks({
    sinceIso: since7d,
    limit: 4000,
  })) as Row[];
  const last24 = rows.filter((r) => r.checked_at >= since24h);

  const ok7 = rows.filter((r) => r.ok).length;
  const ok24 = last24.filter((r) => r.ok).length;

  const uptime7 = pct(ok7, rows.length);
  const uptime24 = pct(ok24, last24.length);

  const latest = rows[0] ?? null;

  const latencyAvgMs = (() => {
    const values = rows.map((r) => r.latency_ms).filter((v): v is number => typeof v === 'number');
    if (values.length === 0) return null;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round(sum / values.length);
  })();

  return (
    <main className="bg-background min-h-screen">
      <div className="mx-auto max-w-5xl px-6 py-24">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-8 w-8 text-primary" aria-hidden="true" />
            <h1 className="text-3xl font-bold text-foreground">Status</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Uptime checks are published from a scheduled health probe. This page
            reports platform availability signals, not contractual SLAs.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Updated: {now.toLocaleString()}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Latest Check
              </p>
              {latest?.ok ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden="true" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-500" aria-hidden="true" />
              )}
            </div>
            <div className="mt-3 text-sm text-foreground">
              {latest ? (latest.ok ? 'Operational' : 'Degraded') : 'No data'}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {latest ? new Date(latest.checked_at).toLocaleString() : 'N/A'}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Uptime (24h)
            </p>
            <div className="mt-3 text-3xl font-bold text-foreground">{uptime24}%</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Checks: {last24.length}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Uptime (7d)
            </p>
            <div className="mt-3 text-3xl font-bold text-foreground">{uptime7}%</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Avg latency: {latencyAvgMs !== null ? `${latencyAvgMs}ms` : 'N/A'}
            </div>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-card overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-6 py-4">
            <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">Recent Checks</h2>
          </div>
          <div className="divide-y divide-border">
            {(rows ?? []).slice(0, 40).map((r) => (
              <div key={r.checked_at} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  {r.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-500" aria-hidden="true" />
                  )}
                  <div className="text-sm text-foreground">
                    {new Date(r.checked_at).toLocaleString()}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {typeof r.latency_ms === 'number' ? `${r.latency_ms}ms` : 'N/A'} · {r.source}
                </div>
              </div>
            ))}
            {rows.length === 0 ? (
              <div className="px-6 py-6 text-sm text-muted-foreground">
                No uptime data has been published yet.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
