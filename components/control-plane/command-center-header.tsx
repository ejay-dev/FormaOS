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
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Admin Control Plane
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Founder-only command center with live runtime control and immutable
            audit.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded border px-2 py-1 text-xs ${
              adminStreamStatus === 'connected'
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : adminStreamStatus === 'connecting'
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                  : 'border-rose-500/40 bg-rose-500/10 text-rose-200'
            }`}
          >
            Stream {adminStreamStatus}
          </span>
          <button
            type="button"
            onClick={() => void onRefresh()}
            className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-foreground/90 hover:bg-slate-700"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={onExportConfig}
            className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-foreground/90 hover:bg-slate-700"
          >
            <Download className="h-3.5 w-3.5" />
            Export Config
          </button>
        </div>
      </div>

      {latestAudit ? (
        <div className="mt-3 rounded border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs text-muted-foreground">
          Last updated by {latestAudit.actor_user_id ?? 'system'} at{' '}
          {new Date(latestAudit.created_at).toLocaleString()} (
          {latestAudit.event_type})
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded border border-red-800/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      ) : null}

      {bannerMessage ? (
        <div className="mt-4 rounded border border-emerald-700/30 bg-emerald-900/20 px-3 py-2 text-xs text-emerald-200">
          {bannerMessage}
        </div>
      ) : null}

      {undoState ? (
        <div className="mt-4 flex items-center justify-between gap-3 rounded border border-cyan-700/30 bg-cyan-900/20 px-3 py-2 text-xs text-cyan-100">
          <span>{undoState.label}</span>
          <button
            type="button"
            onClick={() => {
              void onPerformAction(undoState.action, undoState.payload, {
                successMessage: 'Undo applied.',
              });
              onClearUndo();
            }}
            className="rounded border border-cyan-500/50 px-2 py-1 text-cyan-100 hover:bg-cyan-700/30"
          >
            Undo
          </button>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
          <p className="text-xs text-muted-foreground/60">Feature flags</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {snapshot.featureFlags.length}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
          <p className="text-xs text-muted-foreground/60">Rollout flags</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {rolloutFlags}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
          <p className="text-xs text-muted-foreground/60">Queued jobs</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {snapshot.health.queue.queued}
          </p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
          <p className="text-xs text-muted-foreground/60">DB latency</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {snapshot.health.databaseLatencyMs}ms
          </p>
        </div>
      </div>
    </section>
  );
}
