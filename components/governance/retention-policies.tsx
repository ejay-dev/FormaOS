'use client';

import { useState, useTransition } from 'react';

type Props = {
  orgId: string;
  initialPolicies: Array<Record<string, any>>;
  initialExecutions: Array<Record<string, any>>;
};

export function RetentionPolicies({
  orgId,
  initialPolicies,
  initialExecutions,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [policies, setPolicies] = useState(initialPolicies);
  const [executions, setExecutions] = useState(initialExecutions);
  const [resourceType, setResourceType] = useState('identity_audit');
  const [retentionDays, setRetentionDays] = useState(365);
  const [action, setAction] = useState<'archive' | 'delete' | 'anonymize'>('archive');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const response = await fetch(`/api/governance/retention?orgId=${encodeURIComponent(orgId)}`, {
      cache: 'no-store',
    });
    const payload = await response.json();
    if (response.ok && payload.ok) {
      setPolicies(payload.policies ?? []);
      setExecutions(payload.executions ?? []);
    }
  };

  const savePolicy = () => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch('/api/governance/retention', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          resourceType,
          retentionDays,
          action,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? 'Failed to save retention policy');
        return;
      }
      await refresh();
      setMessage('Retention policy saved.');
    });
  };

  const runRetention = (dryRun: boolean) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const response = await fetch('/api/governance/retention/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, dryRun }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? 'Retention execution failed');
        return;
      }
      await refresh();
      setMessage(dryRun ? 'Dry-run completed.' : 'Retention execution completed.');
    });
  };

  return (
    <section className="rounded-3xl border border-glass-border bg-glass-subtle p-6 space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-black text-foreground">Retention Policies</h2>
          <p className="text-sm text-muted-foreground">
            Configure record lifecycles, preview impact, and execute dry-runs.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => runRetention(true)}
            disabled={isPending}
            className="rounded-xl border border-glass-border bg-glass-subtle px-4 py-2 text-sm text-foreground/90 disabled:opacity-50"
          >
            Dry Run
          </button>
          <button
            type="button"
            onClick={() => runRetention(false)}
            disabled={isPending}
            className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100 disabled:opacity-50"
          >
            Execute
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <input
          value={resourceType}
          onChange={(event) => setResourceType(event.target.value)}
          className="rounded-xl border border-glass-border bg-slate-950 px-3 py-2 text-sm text-foreground"
          placeholder="resource_type"
        />
        <input
          type="number"
          value={retentionDays}
          onChange={(event) => setRetentionDays(Number(event.target.value || 365))}
          className="rounded-xl border border-glass-border bg-slate-950 px-3 py-2 text-sm text-foreground"
        />
        <select
          value={action}
          onChange={(event) => setAction(event.target.value as typeof action)}
          className="rounded-xl border border-glass-border bg-slate-950 px-3 py-2 text-sm text-foreground"
        >
          <option value="archive">archive</option>
          <option value="delete">delete</option>
          <option value="anonymize">anonymize</option>
        </select>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-sm">
          {error ? <span className="text-rose-300">{error}</span> : null}
          {message ? <span className="text-emerald-300">{message}</span> : null}
        </div>
        <button
          type="button"
          onClick={savePolicy}
          disabled={isPending}
          className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-50"
        >
          Save Policy
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-glass-border bg-slate-950/50 p-4">
          <div className="mb-3 text-sm font-semibold text-foreground">Configured Policies</div>
          <div className="space-y-3 text-sm text-foreground/70">
            {policies.map((policy) => (
              <div key={policy.id} className="rounded-xl border border-glass-border bg-glass-subtle p-3">
                <div className="font-semibold text-foreground">{policy.resource_type}</div>
                <div className="text-xs text-muted-foreground">
                  {policy.retention_days} days • {policy.action}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-glass-border bg-slate-950/50 p-4">
          <div className="mb-3 text-sm font-semibold text-foreground">Execution History</div>
          <div className="space-y-3 text-sm text-foreground/70">
            {executions.map((execution) => (
              <div key={execution.id} className="rounded-xl border border-glass-border bg-glass-subtle p-3">
                <div className="font-semibold text-foreground">{execution.resource_type}</div>
                <div className="text-xs text-muted-foreground">
                  {execution.action} • {execution.affected_count} records •{' '}
                  {new Date(execution.executed_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
