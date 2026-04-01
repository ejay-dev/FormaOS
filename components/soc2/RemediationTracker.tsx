'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, Clock, Circle, SkipForward, AlertTriangle } from 'lucide-react';
import type { Soc2RemediationAction } from '@/lib/soc2/types';
import { completeRemediationAction } from '@/app/app/actions/soc2-readiness';

interface RemediationTrackerProps {
  actions: Soc2RemediationAction[];
}

const PRIORITY_CONFIG = {
  critical: { color: 'bg-rose-400/15 text-rose-300 border-rose-400/20', icon: AlertTriangle },
  high: { color: 'bg-amber-400/15 text-amber-300 border-amber-400/20', icon: AlertTriangle },
  medium: { color: 'bg-sky-400/15 text-sky-300 border-sky-400/20', icon: Circle },
  low: { color: 'bg-slate-400/15 text-muted-foreground border-slate-400/20', icon: Circle },
} as const;

const STATUS_ICON = {
  pending: Clock,
  in_progress: Clock,
  completed: CheckCircle2,
  skipped: SkipForward,
} as const;

export function RemediationTracker({ actions }: RemediationTrackerProps) {
  const [localActions, setLocalActions] = useState(actions);
  const [isPending, startTransition] = useTransition();

  const handleComplete = (actionId: string) => {
    startTransition(async () => {
      const { success } = await completeRemediationAction(actionId);
      if (success) {
        setLocalActions((prev) =>
          prev.map((a) =>
            a.id === actionId
              ? { ...a, status: 'completed' as const, completedAt: new Date().toISOString() }
              : a,
          ),
        );
      }
    });
  };

  const pending = localActions.filter((a) => a.status === 'pending' || a.status === 'in_progress');
  const completed = localActions.filter((a) => a.status === 'completed' || a.status === 'skipped');

  return (
    <div className="rounded-2xl border border-glass-border bg-glass-subtle p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Remediation Actions</h3>
        <div className="flex gap-3 text-xs text-muted-foreground/60">
          <span>{pending.length} pending</span>
          <span>{completed.length} completed</span>
        </div>
      </div>

      {pending.length === 0 && completed.length === 0 && (
        <div className="mt-6 text-center text-sm text-muted-foreground/60">
          Run an assessment to generate remediation actions.
        </div>
      )}

      {pending.length > 0 && (
        <div className="mt-4 space-y-2">
          {pending.map((action) => {
            const priorityCfg = PRIORITY_CONFIG[action.priority];
            const StatusIcon = STATUS_ICON[action.status];

            return (
              <div
                key={action.id}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
              >
                <StatusIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground/90">{action.title}</span>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityCfg.color}`}>
                      {action.priority}
                    </span>
                    <span className="rounded border border-glass-border bg-glass-subtle px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/60">
                      {action.controlCode}
                    </span>
                  </div>
                  {action.description && (
                    <p className="mt-1 text-xs text-muted-foreground">{action.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleComplete(action.id)}
                  disabled={isPending}
                  className="shrink-0 rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-400/20 transition-colors disabled:opacity-50"
                >
                  Complete
                </button>
              </div>
            );
          })}
        </div>
      )}

      {completed.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-xs font-semibold text-muted-foreground/60 hover:text-foreground/70 transition-colors">
            Show {completed.length} completed action{completed.length !== 1 ? 's' : ''}
          </summary>
          <div className="mt-2 space-y-2">
            {completed.map((action) => (
              <div
                key={action.id}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.01] p-3 opacity-60"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="text-sm text-muted-foreground line-through">{action.title}</span>
                <span className="rounded border border-glass-border bg-glass-subtle px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground/40">
                  {action.controlCode}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
