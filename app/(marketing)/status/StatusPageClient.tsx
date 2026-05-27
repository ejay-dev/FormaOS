'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

// Audit 2026-05-27 — client renderer for /status. Polls /api/health
// every 30s and renders the per-subsystem status cards. No auth.

type HealthCheck = {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' | 'error';
  responseTime?: number | null;
  error?: string | null;
};

type HealthPayload = {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  environment?: string;
  checks: Record<string, HealthCheck>;
};

type ChainAnchorPublicPayload = {
  latestAnchorAt: string | null;
  latestExternalProvider: string | null;
  latestExternalUrl: string | null;
  totalAnchorsLast30d: number;
};

const POLL_INTERVAL_MS = 30_000;

function statusColour(status: string): string {
  switch (status) {
    case 'healthy':
      return 'bg-emerald-500';
    case 'degraded':
      return 'bg-amber-500';
    case 'unhealthy':
    case 'error':
      return 'bg-red-500';
    default:
      return 'bg-zinc-400';
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-zinc-700 dark:text-zinc-200">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusColour(status)}`} aria-hidden />
      {status}
    </span>
  );
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const seconds = Math.floor((Date.now() - then) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86_400)}d ago`;
}

export default function StatusPageClient() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [anchor, setAnchor] = useState<ChainAnchorPublicPayload | null>(null);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [healthRes, anchorRes] = await Promise.all([
        fetch('/api/health', { cache: 'no-store' }),
        fetch('/api/status/audit-chain-anchor', { cache: 'no-store' }),
      ]);
      if (healthRes.ok) {
        setHealth(await healthRes.json());
      } else {
        setHealth(null);
      }
      if (anchorRes.ok) {
        setAnchor(await anchorRes.json());
      } else {
        setAnchor(null);
      }
      setFetchedAt(new Date().toISOString());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'request_failed');
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  const subsystems = useMemo(() => {
    if (!health?.checks) return [];
    return Object.entries(health.checks).map(([key, value]) => ({
      key,
      ...value,
    }));
  }, [health]);

  const overallStatus = health?.status ?? 'unknown';

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 text-zinc-900 dark:text-zinc-100">
      <header className="mb-12">
        <h1 className="text-3xl font-semibold tracking-tight">FormaOS Status</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Live platform health, sampled every 30 seconds from the
          {' '}<a className="underline" href="/api/health">/api/health</a> endpoint.
          No auth required.
        </p>
      </header>

      <section
        aria-label="overall status"
        className="mb-10 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
              Overall
            </div>
            <div className="mt-1 text-2xl font-semibold">
              {overallStatus === 'healthy' && 'All systems operational'}
              {overallStatus === 'degraded' && 'Partial degradation'}
              {overallStatus === 'unhealthy' && 'Major incident in progress'}
              {overallStatus === 'unknown' && 'Status unavailable'}
            </div>
          </div>
          <StatusBadge status={overallStatus} />
        </div>
        <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Last refreshed: {fetchedAt ? formatRelative(fetchedAt) : '—'} ·
          Environment: {health?.environment ?? 'unknown'}
        </div>
      </section>

      {error && (
        <p className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200">
          /api/health request failed: {error}
        </p>
      )}

      <section aria-label="subsystems" className="mb-10 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Subsystems
        </h2>
        {subsystems.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No data yet…</p>
        )}
        {subsystems.map((s) => (
          <div
            key={s.key}
            className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div>
              <div className="font-medium capitalize">{s.key}</div>
              {s.error && (
                <div className="mt-1 text-xs text-red-600 dark:text-red-300">
                  {s.error}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
              {typeof s.responseTime === 'number' && (
                <span>{s.responseTime}ms</span>
              )}
              <StatusBadge status={s.status} />
            </div>
          </div>
        ))}
      </section>

      <section
        aria-label="audit chain integrity"
        className="mb-10 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Audit-chain external anchor
        </h2>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          The audit-log hash chain is periodically anchored to an
          external public transparency log so a chain rewrite would
          require also forging a third-party-witnessed record.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
              Latest anchor
            </div>
            <div className="mt-1 font-medium">
              {formatRelative(anchor?.latestAnchorAt)}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
              Provider
            </div>
            <div className="mt-1 font-medium">
              {anchor?.latestExternalProvider ?? '—'}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
              Last 30 days
            </div>
            <div className="mt-1 font-medium">
              {anchor?.totalAnchorsLast30d ?? 0} anchors
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
              Public view
            </div>
            <div className="mt-1 font-medium">
              {anchor?.latestExternalUrl ? (
                <a
                  className="underline"
                  href={anchor.latestExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open
                </a>
              ) : (
                '—'
              )}
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-12 text-xs text-zinc-500 dark:text-zinc-400">
        <p>
          Raw JSON: <a className="underline" href="/api/health">/api/health</a>{' '}
          · <a className="underline" href="/api/health/integrity">/api/health/integrity</a>{' '}
          · <a className="underline" href="/api/status/audit-chain-anchor">/api/status/audit-chain-anchor</a>
        </p>
        <p className="mt-2">
          Incidents history: filed under the <code>incidents</code>{' '}
          channel; subscribe via your account if you&apos;re a customer.
        </p>
      </footer>
    </main>
  );
}
