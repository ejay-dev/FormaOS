'use client';

import { useState, useTransition } from 'react';

type Props = {
  orgId: string;
  initialProvider: 'azure-ad' | 'okta' | 'google-workspace' | '';
  initialIntervalMinutes: number;
  initialConfig: Record<string, unknown>;
  initialStatus: {
    configs: Array<Record<string, any>>;
    runs: Array<Record<string, any>>;
  };
};

export function DirectorySyncPanel({
  orgId,
  initialProvider,
  initialIntervalMinutes,
  initialConfig,
  initialStatus,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [provider, setProvider] = useState<Props['initialProvider']>(initialProvider);
  const [intervalMinutes, setIntervalMinutes] = useState(initialIntervalMinutes);
  const [configText, setConfigText] = useState(JSON.stringify(initialConfig, null, 2));
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runSync = (enabled: boolean) => {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        const config = JSON.parse(configText || '{}');
        const response = await fetch('/api/sso/directory-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orgId,
            provider,
            intervalMinutes,
            config,
            enabled,
          }),
        });
        const payload = await response.json();
        if (!response.ok || !payload.ok) {
          setError(payload.error ?? 'Directory sync failed');
          return;
        }

        const refresh = await fetch(`/api/sso/directory-sync?orgId=${encodeURIComponent(orgId)}`, {
          cache: 'no-store',
        });
        const latest = await refresh.json();
        if (refresh.ok && latest.ok) {
          setStatus({ configs: latest.configs ?? [], runs: latest.runs ?? [] });
        }
        setMessage('Directory sync finished.');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Directory sync failed');
      }
    });
  };

  return (
    <section className="rounded-3xl border border-glass-border bg-glass-subtle p-6 space-y-5">
      <div>
        <h2 className="text-xl font-black text-foreground">Directory Sync</h2>
        <p className="text-sm text-muted-foreground">
          Pull users and groups from Azure AD, Okta, or Google Workspace on demand.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_180px_1fr]">
        <label className="space-y-2 text-sm text-foreground/90">
          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
            Provider
          </span>
          <select
            value={provider}
            onChange={(event) => setProvider(event.target.value as Props['initialProvider'])}
            className="w-full rounded-xl border border-glass-border bg-slate-950 px-3 py-2 text-sm text-foreground"
          >
            <option value="">Select provider</option>
            <option value="azure-ad">Azure AD</option>
            <option value="okta">Okta</option>
            <option value="google-workspace">Google Workspace</option>
          </select>
        </label>
        <label className="space-y-2 text-sm text-foreground/90">
          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
            Schedule Minutes
          </span>
          <input
            type="number"
            min={15}
            value={intervalMinutes}
            onChange={(event) => setIntervalMinutes(Number(event.target.value || 60))}
            className="w-full rounded-xl border border-glass-border bg-slate-950 px-3 py-2 text-sm text-foreground"
          />
        </label>
        <label className="space-y-2 text-sm text-foreground/90">
          <span className="block text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground/60">
            Connection Config JSON
          </span>
          <textarea
            value={configText}
            onChange={(event) => setConfigText(event.target.value)}
            rows={8}
            className="w-full rounded-xl border border-glass-border bg-slate-950 px-3 py-2 font-mono text-xs text-foreground"
            placeholder='{"accessToken":"...","tenantId":"..."}'
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => runSync(true)}
          disabled={isPending || !provider}
          className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 disabled:opacity-50"
        >
          Save + Sync Now
        </button>
        <button
          type="button"
          onClick={() => runSync(false)}
          disabled={isPending || !provider}
          className="rounded-xl border border-glass-border bg-glass-subtle px-4 py-2 text-sm font-semibold text-foreground/90 disabled:opacity-50"
        >
          Run One-Off Sync
        </button>
        {error ? <span className="text-sm text-rose-300">{error}</span> : null}
        {message ? <span className="text-sm text-emerald-300">{message}</span> : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-glass-border bg-slate-950/50 p-4">
          <div className="mb-3 text-sm font-semibold text-foreground">Configured Providers</div>
          <div className="space-y-3 text-sm text-foreground/70">
            {(status.configs ?? []).length === 0 ? (
              <div className="text-muted-foreground/60">No directory sync providers configured yet.</div>
            ) : (
              status.configs.map((config) => (
                <div key={config.id} className="rounded-xl border border-glass-border bg-glass-subtle p-3">
                  <div className="font-semibold text-foreground">{config.provider}</div>
                  <div className="text-xs text-muted-foreground">
                    Interval: {config.interval_minutes} min
                    {config.last_sync_at ? ` • Last sync ${new Date(config.last_sync_at).toLocaleString()}` : ''}
                  </div>
                  {config.last_error ? (
                    <div className="mt-2 text-xs text-rose-300">{config.last_error}</div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-glass-border bg-slate-950/50 p-4">
          <div className="mb-3 text-sm font-semibold text-foreground">Recent Sync Runs</div>
          <div className="space-y-3 text-sm text-foreground/70">
            {(status.runs ?? []).length === 0 ? (
              <div className="text-muted-foreground/60">No sync runs yet.</div>
            ) : (
              status.runs.map((run) => (
                <div key={run.id} className="rounded-xl border border-glass-border bg-glass-subtle p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-foreground">{run.provider}</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{run.status}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Started {new Date(run.started_at).toLocaleString()}
                  </div>
                  {run.summary ? (
                    <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-950/70 p-2 text-[11px] text-foreground/70">
                      {JSON.stringify(run.summary, null, 2)}
                    </pre>
                  ) : null}
                  {run.error_message ? (
                    <div className="mt-2 text-xs text-rose-300">{run.error_message}</div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
