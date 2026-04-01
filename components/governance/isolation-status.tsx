'use client';

import { useState, useTransition } from 'react';

type Props = {
  orgId: string;
  initialReport: {
    results: Array<Record<string, any>>;
  };
};

export function IsolationStatus({ orgId, initialReport }: Props) {
  const [isPending, startTransition] = useTransition();
  const [results, setResults] = useState(initialReport.results ?? []);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runVerification = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch('/api/governance/isolation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? 'Isolation verification failed');
        return;
      }

      const refreshed = await fetch(`/api/governance/isolation?orgId=${encodeURIComponent(orgId)}`, {
        cache: 'no-store',
      });
      const latest = await refreshed.json();
      if (refreshed.ok && latest.ok) {
        setResults(latest.report?.results ?? []);
      }
      setMessage('Isolation verification completed.');
    });
  };

  const latest = results[0];

  return (
    <section className="rounded-3xl border border-glass-border bg-glass-subtle p-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground">Tenant Isolation</h2>
          <p className="text-sm text-muted-foreground">
            Verify tenant-scoped tables, migration policy evidence, and cross-org exposure heuristics.
          </p>
        </div>
        <button
          type="button"
          onClick={runVerification}
          disabled={isPending}
          className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-50"
        >
          Run Verification
        </button>
      </div>

      {error ? <div className="text-sm text-rose-300">{error}</div> : null}
      {message ? <div className="text-sm text-emerald-300">{message}</div> : null}

      {latest ? (
        <div className="rounded-2xl border border-glass-border bg-slate-950/50 p-4">
          <div className="text-sm font-semibold text-foreground">
            Last verification {new Date(latest.created_at).toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Passed {latest.summary?.passed ?? 0} • Warnings {latest.summary?.warnings ?? 0}
          </div>
          <div className="mt-4 space-y-3">
            {(latest.checks ?? []).map((check: Record<string, any>) => (
              <div key={check.table} className="rounded-xl border border-glass-border bg-glass-subtle p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-foreground">{check.table}</div>
                  <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{check.status}</div>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  org column {check.orgColumn} • cross-org rows {check.crossOrgRows}
                </div>
                <div className="mt-2 text-xs text-foreground/70">{check.notes}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground/60">No isolation verification has been recorded yet.</div>
      )}
    </section>
  );
}
