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
  success: 'border-success/20 bg-success/10',
  failed: 'border-destructive/20 bg-destructive/10',
  waiting_approval: 'border-warning/20 bg-warning/10',
  waiting_delay: 'border-info/20 bg-info/10',
  skipped: 'border-edge-2 bg-surface-1',
  running: 'border-info/20 bg-info/10',
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
        <div className="absolute -left-5 top-5 h-px w-4 bg-edge-2" />
      ) : null}
      <button
        type="button"
        onClick={() => onSelect?.(step.id)}
        className={cn(
          'group flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition',
          selected ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-edge-3 hover:bg-surface-1',
          hasErrors ? 'border-destructive/70 bg-destructive/10' : '',
          execution ? executionTone[execution.status] ?? '' : '',
        )}
      >
        <div
          className={cn(
            'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground',
            step.type === 'condition' ? 'rotate-45 rounded-[18px]' : '',
          )}
        >
          <Icon className={cn('h-4 w-4', step.type === 'condition' ? '-rotate-45' : '')} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {branchLabel ?? STEP_TYPE_LABELS[step.type]}
            </span>
            {execution ? (
              <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {execution.status.replace('_', ' ')}
              </span>
            ) : null}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{step.name}</p>
            {hasErrors ? <AlertTriangle className="h-4 w-4 shrink-0 text-destructive" /> : null}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{stepSummary(step)}</p>
          {validationErrors?.length ? (
            <p className="mt-2 text-xs text-destructive">{validationErrors.join(' • ')}</p>
          ) : null}
          {execution?.error ? (
            <p className="mt-2 text-xs text-destructive">{execution.error}</p>
          ) : null}
        </div>
        {!readOnly ? (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-surface-2"
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
              className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-surface-2"
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
              className="rounded-lg border border-destructive/20 p-2 text-destructive hover:bg-destructive/10"
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
