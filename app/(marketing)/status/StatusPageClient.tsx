'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

// Audit 2026-05-27, client renderer for /status. Polls /api/health
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
      return 'bg-muted-foreground/50';
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium capitalize text-foreground">
      <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusColour(status)}`} aria-hidden />
      {status}
    </span>
  );
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  // Clamped: a provider clock running ahead of the browser would
  // otherwise render a negative age.
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
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
    <div className="mx-auto max-w-4xl px-6 pb-24">
      <section
        aria-label="overall status"
        className="rounded-2xl border border-border bg-card p-6"
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Overall</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">
              {overallStatus === 'healthy' && 'All systems operational'}
              {overallStatus === 'degraded' && 'Partial degradation'}
              {overallStatus === 'unhealthy' && 'Major incident in progress'}
              {overallStatus === 'unknown' && 'Status unavailable'}
            </p>
          </div>
          <StatusBadge status={overallStatus} />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Last refreshed: {fetchedAt ? formatRelative(fetchedAt) : '—'} ·
          Environment: {health?.environment ?? 'unknown'}
        </p>
      </section>

      {error && (
        <p className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          /api/health request failed: {error}
        </p>
      )}

      <section aria-label="subsystems" className="mt-10">
        <h2 className="text-lg font-semibold text-foreground">Subsystems</h2>
        <div className="mt-4 space-y-3">
          {subsystems.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Waiting for the first health sample.
            </p>
          )}
          {subsystems.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 text-sm"
            >
              <div>
                <div className="font-medium capitalize text-foreground">
                  {s.key}
                </div>
                {s.error && (
                  <div className="mt-1 text-xs text-red-300">{s.error}</div>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {typeof s.responseTime === 'number' && (
                  <span>{s.responseTime}ms</span>
                )}
                <StatusBadge status={s.status} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-label="audit chain integrity"
        className="mt-10 rounded-2xl border border-border bg-card p-6"
      >
        <h2 className="text-lg font-semibold text-foreground">
          Audit-chain external anchor
        </h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          The audit-log hash chain is periodically anchored to an external
          public transparency log, so a chain rewrite would require also
          forging a third-party-witnessed record.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Latest anchor</p>
            <p className="mt-1 font-medium text-foreground">
              {formatRelative(anchor?.latestAnchorAt)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Provider</p>
            <p className="mt-1 font-medium text-foreground">
              {anchor?.latestExternalProvider ?? '—'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
            <p className="mt-1 font-medium text-foreground">
              {anchor?.totalAnchorsLast30d ?? 0} anchors
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Public view</p>
            <p className="mt-1 font-medium text-foreground">
              {anchor?.latestExternalUrl ? (
                <a
                  className="text-primary hover:underline"
                  href={anchor.latestExternalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open
                </a>
              ) : (
                '—'
              )}
            </p>
          </div>
        </div>
      </section>

      <p className="mt-10 text-xs text-muted-foreground">
        Raw JSON:{' '}
        <a className="text-primary hover:underline" href="/api/health">
          /api/health
        </a>{' '}
        ·{' '}
        <a className="text-primary hover:underline" href="/api/health/integrity">
          /api/health/integrity
        </a>{' '}
        ·{' '}
        <a
          className="text-primary hover:underline"
          href="/api/status/audit-chain-anchor"
        >
          /api/status/audit-chain-anchor
        </a>
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-4 text-sm">
        <Link href="/trust" className="text-primary hover:underline">
          ← Back to Trust Center
        </Link>
        <Link href="/trust/sla" className="text-primary hover:underline">
          SLA and support terms →
        </Link>
        <Link
          href="/trust/incident-response"
          className="text-primary hover:underline"
        >
          Incident response →
        </Link>
      </div>
    </div>
  );
}
