'use client';

import { useState, useTransition } from 'react';

type Props = {
  orgId: string;
  initialScans: Array<Record<string, any>>;
  initialClassificationReport: {
    totalFields: number;
    breakdown: Record<string, number>;
  };
};

export function PiiDashboard({
  orgId,
  initialScans,
  initialClassificationReport,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [scans, setScans] = useState(initialScans);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runScan = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch('/api/governance/pii', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? 'PII scan failed');
        return;
      }

      const refreshed = await fetch(`/api/governance/pii?orgId=${encodeURIComponent(orgId)}`, {
        cache: 'no-store',
      });
      const latest = await refreshed.json();
      if (refreshed.ok && latest.ok) {
        setScans(latest.scans ?? []);
      }

      setMessage('PII scan completed.');
    });
  };

  return (
    <section className="rounded-3xl border border-glass-border bg-glass-subtle p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground">PII Inventory</h2>
          <p className="text-sm text-muted-foreground">
            Scan sampled records, classify exposure hotspots, and export inventory evidence.
          </p>
        </div>
        <button
          type="button"
          onClick={runScan}
          disabled={isPending}
          className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-50"
        >
          Trigger Scan
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(initialClassificationReport.breakdown ?? {}).map(([key, value]) => (
          <div key={key} className="rounded-2xl border border-glass-border bg-slate-950/50 p-4">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground/60">{key}</div>
            <div className="mt-2 text-2xl font-black text-foreground">{value}</div>
          </div>
        ))}
      </div>

      {error ? <div className="text-sm text-rose-300">{error}</div> : null}
      {message ? <div className="text-sm text-emerald-300">{message}</div> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {scans.map((scan) => (
          <div key={scan.id} className="rounded-2xl border border-glass-border bg-slate-950/50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-foreground">{scan.table_name}</div>
              <div className="text-xs text-muted-foreground">{new Date(scan.created_at).toLocaleString()}</div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Sample size {scan.sample_size} • Findings {(scan.findings ?? []).length}
            </div>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-slate-950 p-3 text-[11px] text-foreground/70">
              {JSON.stringify(scan.findings ?? [], null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
}
