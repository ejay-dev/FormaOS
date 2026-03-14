'use client';

import {
  AlertTriangle,
  ArrowDown,
  ArrowRightLeft,
  Clock3,
  Diamond,
  GitBranch,
  OctagonAlert,
  PlayCircle,
  Trash2,
} from 'lucide-react';

import type { ExecutionResult, WorkflowStep } from '@/lib/automation/workflow-types';
import { cn } from '@/lib/utils';
import { STEP_TYPE_LABELS, stepSummary } from './workflow-builder-shared';

const stepIcons = {
  action: PlayCircle,
  condition: Diamond,
  approval: OctagonAlert,
  parallel: ArrowRightLeft,
  delay: Clock3,
  loop: GitBranch,
} satisfies Record<WorkflowStep['type'], typeof PlayCircle>;

const executionTone: Record<string, string> = {
  success: 'border-emerald-400/60 bg-emerald-500/10',
  failed: 'border-rose-400/60 bg-rose-500/10',
  waiting_approval: 'border-amber-400/60 bg-amber-500/10',
  waiting_delay: 'border-sky-400/60 bg-sky-500/10',
  skipped: 'border-slate-600 bg-slate-900/40',
  running: 'border-cyan-400/60 bg-cyan-500/10',
};

interface WorkflowStepNodeProps {
  step: WorkflowStep;
  depth?: number;
  branchLabel?: string;
  selected?: boolean;
  readOnly?: boolean;
  validationErrors?: string[];
  execution?: ExecutionResult;
  onSelect?: (stepId: string) => void;
  onDelete?: (stepId: string) => void;
  onMove?: (stepId: string, direction: 'up' | 'down') => void;
}

export function WorkflowStepNode({
  step,
  depth = 0,
  branchLabel,
  selected,
  readOnly,
  validationErrors,
  execution,
  onSelect,
  onDelete,
  onMove,
}: WorkflowStepNodeProps) {
  const Icon = stepIcons[step.type];
  const hasErrors = Boolean(validationErrors?.length);

  return (
    <div
      className="relative"
      style={{ marginLeft: depth * 28 }}
    >
      {depth > 0 ? (
        <div className="absolute -left-5 top-5 h-px w-4 bg-white/15" />
      ) : null}
      <button
        type="button"
        onClick={() => onSelect?.(step.id)}
        className={cn(
          'group flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition',
          selected ? 'border-cyan-400/70 bg-cyan-500/10 shadow-[0_0_0_1px_rgba(34,211,238,0.25)]' : 'border-white/10 bg-slate-950/70 hover:border-white/20 hover:bg-white/[0.04]',
          hasErrors ? 'border-rose-400/70 bg-rose-500/10' : '',
          execution ? executionTone[execution.status] ?? '' : '',
        )}
      >
        <div
          className={cn(
            'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-slate-100',
            step.type === 'condition' ? 'rotate-45 rounded-[18px] bg-amber-500/20 border-amber-400/40' : '',
            step.type === 'approval' ? 'bg-rose-500/20 border-rose-400/40' : '',
            step.type === 'parallel' ? 'bg-sky-500/20 border-sky-400/40' : '',
            step.type === 'delay' ? 'bg-violet-500/20 border-violet-400/40' : '',
            step.type === 'loop' ? 'bg-emerald-500/20 border-emerald-400/40' : '',
            step.type === 'action' ? 'bg-cyan-500/20 border-cyan-400/40' : '',
          )}
        >
          <Icon className={cn('h-4 w-4', step.type === 'condition' ? '-rotate-45' : '')} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              {branchLabel ?? STEP_TYPE_LABELS[step.type]}
            </span>
            {execution ? (
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                {execution.status.replace('_', ' ')}
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-100">{step.name}</p>
            {hasErrors ? <AlertTriangle className="h-4 w-4 shrink-0 text-rose-300" /> : null}
          </div>
          <p className="mt-1 text-sm text-slate-400">{stepSummary(step)}</p>
          {validationErrors?.length ? (
            <p className="mt-2 text-xs text-rose-200">{validationErrors.join(' • ')}</p>
          ) : null}
          {execution?.error ? (
            <p className="mt-2 text-xs text-rose-200">{execution.error}</p>
          ) : null}
        </div>
        {!readOnly ? (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10"
              onClick={(event) => {
                event.stopPropagation();
                onMove?.(step.id, 'up');
              }}
              aria-label="Move step up"
            >
              <ArrowDown className="h-4 w-4 rotate-180" />
            </button>
            <button
              type="button"
              className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10"
              onClick={(event) => {
                event.stopPropagation();
                onMove?.(step.id, 'down');
              }}
              aria-label="Move step down"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-lg border border-rose-400/20 p-2 text-rose-200 hover:bg-rose-500/10"
              onClick={(event) => {
                event.stopPropagation();
                onDelete?.(step.id);
              }}
              aria-label="Delete step"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </button>
    </div>
  );
}
