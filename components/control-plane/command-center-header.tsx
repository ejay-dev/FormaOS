'use client';

import { Download, RefreshCcw } from 'lucide-react';
import type { CommandCenterHeaderProps } from './command-center-types';

export function CommandCenterHeader({
  snapshot,
  adminStreamStatus,
  error,
  bannerMessage,
  undoState,
  rolloutFlags,
  onRefresh,
  onExportConfig,
  onPerformAction,
  onClearUndo,
}: CommandCenterHeaderProps) {
  const latestAudit = snapshot.audit[0] ?? null;

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Control plane
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Runtime switches for the live platform. Every change is written to the
            audit trail.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded border px-2 py-1 text-xs ${
              adminStreamStatus === 'connected'
                ? 'border-success/20 bg-success/10 text-success'
                : adminStreamStatus === 'connecting'
                  ? 'border-warning/20 bg-warning/10 text-warning'
                  : 'border-destructive/20 bg-destructive/10 text-destructive'
            }`}
          >
            Stream {adminStreamStatus}
          </span>
          <button
            type="button"
            onClick={() => void onRefresh()}
            className="inline-flex items-center gap-1 rounded border border-border bg-muted px-3 py-1.5 text-xs text-foreground/90 hover:bg-accent"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={onExportConfig}
            className="inline-flex items-center gap-1 rounded border border-border bg-muted px-3 py-1.5 text-xs text-foreground/90 hover:bg-accent"
          >
            <Download className="h-3.5 w-3.5" />
            Export config
          </button>
        </div>
      </div>

      {latestAudit ? (
        <div className="mt-3 rounded border border-border bg-background/40 px-3 py-2 text-xs text-muted-foreground">
          Last updated by {latestAudit.actor_user_id ?? 'system'} at{' '}
          {new Date(latestAudit.created_at).toLocaleString()} (
          {latestAudit.event_type})
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </div>
      ) : null}

      {bannerMessage ? (
        <div className="mt-4 rounded border border-success/20 bg-success/10 px-3 py-2 text-xs text-success">
          {bannerMessage}
        </div>
      ) : null}

      {undoState ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded border border-border bg-muted px-3 py-2 text-xs text-foreground">
          <span>{undoState.label}</span>
          <button
            type="button"
            onClick={() => {
              void onPerformAction(undoState.action, undoState.payload, {
                successMessage: 'Undo applied.',
              });
              onClearUndo();
            }}
            className="rounded border border-border px-2 py-1 text-foreground hover:bg-muted"
          >
            Undo
          </button>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-background/50 p-3">
          <p className="text-xs text-muted-foreground/60">Feature flags</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {snapshot.featureFlags.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/50 p-3">
          <p className="text-xs text-muted-foreground/60">Rollout flags</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {rolloutFlags}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/50 p-3">
          <p className="text-xs text-muted-foreground/60">Queued jobs</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {snapshot.health.queue.queued}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-background/50 p-3">
          <p className="text-xs text-muted-foreground/60">DB latency</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {snapshot.health.databaseLatencyMs}ms
          </p>
        </div>
      </div>
    </section>
  );
}
