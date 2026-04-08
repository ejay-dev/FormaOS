'use client';

import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Gauge,
  Lock,
  PlayCircle,
  Shield,
} from 'lucide-react';
import { VirtualizedList } from '@/components/control-plane/virtualized-list';
import { ADMIN_AUTOMATION_ACTIONS } from '@/lib/control-plane/defaults';
import type { CommandCenterOpsProps } from './command-center-types';
import { labelFromJobType } from './command-center-types';

export function CommandCenterOps({
  maintenanceMode,
  readOnlyMode,
  emergencyLockdown,
  rateLimitMultiplier,
  health,
  jobs,
  audit,
  pendingAction,
  onUpdateOpsToggle,
  onUpdateRateLimitMultiplier,
  onEnqueueJob,
}: CommandCenterOpsProps) {
  return (
    <>
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Shield className="h-4 w-4 text-rose-300" />
          <h2 className="text-lg font-semibold text-foreground">
            Ops & Security
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <button
            type="button"
            onClick={() =>
              onUpdateOpsToggle('maintenance_mode', !maintenanceMode, true)
            }
            className={`rounded-lg border p-3 text-left ${
              maintenanceMode
                ? 'border-amber-700/50 bg-amber-900/20'
                : 'border-slate-800 bg-slate-950/50'
            }`}
          >
            <div className="text-sm text-foreground">Maintenance mode</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Block customer operations during controlled maintenance windows.
            </div>
            <div className="mt-2 text-xs text-amber-200">
              {maintenanceMode ? 'Enabled' : 'Disabled'}
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateOpsToggle('read_only_mode', !readOnlyMode, true)
            }
            className={`rounded-lg border p-3 text-left ${
              readOnlyMode
                ? 'border-cyan-700/50 bg-cyan-900/20'
                : 'border-slate-800 bg-slate-950/50'
            }`}
          >
            <div className="text-sm text-foreground">Read-only mode</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Freeze mutating writes while preserving read access.
            </div>
            <div className="mt-2 text-xs text-cyan-200">
              {readOnlyMode ? 'Enabled' : 'Disabled'}
            </div>
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdateOpsToggle('emergency_lockdown', !emergencyLockdown, true)
            }
            className={`rounded-lg border p-3 text-left ${
              emergencyLockdown
                ? 'border-rose-700/50 bg-rose-900/20'
                : 'border-slate-800 bg-slate-950/50'
            }`}
          >
            <div className="text-sm text-foreground">Emergency lock-down</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Immediate incident response gate across app and marketing
              surfaces.
            </div>
            <div className="mt-2 text-xs text-rose-200">
              {emergencyLockdown ? 'Enabled' : 'Disabled'}
            </div>
          </button>

          <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
            <div className="text-sm text-foreground">Rate limit multiplier</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Increase or reduce API throttle globally.
            </div>
            <input
              type="number"
              step="0.1"
              min="0.1"
              defaultValue={rateLimitMultiplier}
              onBlur={(event) =>
                onUpdateRateLimitMultiplier(Number(event.target.value || 1))
              }
              className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-foreground"
            />
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded border border-slate-800 bg-slate-950/50 p-3">
            <div className="flex items-center gap-2 text-sm text-foreground/90">
              <Database className="h-4 w-4 text-cyan-300" />
              DB Latency
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {health.databaseLatencyMs}ms
            </p>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950/50 p-3">
            <div className="flex items-center gap-2 text-sm text-foreground/90">
              <Gauge className="h-4 w-4 text-emerald-300" />
              API Health
            </div>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {health.apiHealthy ? 'Healthy' : 'Degraded'}
            </p>
          </div>
          <div className="rounded border border-slate-800 bg-slate-950/50 p-3">
            <div className="flex items-center gap-2 text-sm text-foreground/90">
              <Shield className="h-4 w-4 text-amber-300" />
              Queue status
            </div>
            <p className="mt-2 text-sm text-foreground/70">
              queued: {health.queue.queued} · running: {health.queue.running} ·
              failed: {health.queue.failed}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2">
          <PlayCircle className="h-4 w-4 text-emerald-300" />
          <h2 className="text-lg font-semibold text-foreground">
            Admin Automation
          </h2>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {ADMIN_AUTOMATION_ACTIONS.map((action) => (
            <button
              key={action}
              type="button"
              disabled={pendingAction !== null}
              onClick={() => onEnqueueJob(action)}
              className="rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-foreground/90 hover:bg-slate-800 disabled:opacity-60"
            >
              {labelFromJobType(action)}
            </button>
          ))}
        </div>

        <VirtualizedList
          items={jobs}
          itemHeight={94}
          height={360}
          getKey={(item) => item.id}
          renderItem={(job) => (
            <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{labelFromJobType(job.job_type)}</span>
                <span>
                  {job.status} • {job.progress}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded bg-slate-800">
                <div
                  className="h-1.5 rounded bg-cyan-500"
                  style={{ width: `${job.progress}%` }}
                />
              </div>
              <div className="mt-2 truncate text-xs text-foreground/70">
                {job.logs[job.logs.length - 1]?.message || 'No logs yet'}
              </div>
              {job.status === 'failed' && job.error_message ? (
                <div className="mt-1 text-xs text-rose-300">
                  {job.error_message}
                </div>
              ) : null}
            </div>
          )}
        />
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Lock className="h-4 w-4 text-foreground/90" />
          <h2 className="text-lg font-semibold text-foreground">
            Live Audit Stream
          </h2>
        </div>

        <VirtualizedList
          items={audit}
          itemHeight={86}
          height={420}
          getKey={(item) => item.id}
          renderItem={(entry) => (
            <div className="rounded border border-slate-800 bg-slate-950/40 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-mono text-foreground/90">
                  {entry.event_type}
                </span>
                <span>{new Date(entry.created_at).toLocaleString()}</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {entry.target_type}
                {entry.target_id ? `:${entry.target_id}` : ''}
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground/60">
                actor: {entry.actor_user_id ?? 'system'}
              </div>
            </div>
          )}
        />
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
          Every write is persisted to Supabase and appended to immutable
          `audit_log`.
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
          Destructive actions require confirmation; toggles expose undo for 10
          seconds.
        </div>
      </section>
    </>
  );
}
