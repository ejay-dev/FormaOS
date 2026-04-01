'use client';

import { useMemo, useState } from 'react';

import type {
  ExecutionResult,
  WorkflowDefinition,
  WorkflowExecutionRecord,
} from '@/lib/automation/workflow-types';
import { executionStatusByStep, flattenSteps } from './workflow-builder-shared';
import { WorkflowStepNode } from './workflow-step-node';

interface WorkflowExecutionViewerProps {
  workflow: WorkflowDefinition;
  execution: WorkflowExecutionRecord | null;
  onRerun?: () => void;
}

export function WorkflowExecutionViewer({
  workflow,
  execution,
  onRerun,
}: WorkflowExecutionViewerProps) {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const traceMap = useMemo(
    () => executionStatusByStep(execution?.execution_trace.steps),
    [execution?.execution_trace.steps],
  );

  const flattened = useMemo(() => flattenSteps(workflow.steps), [workflow.steps]);
  const selectedResult = selectedStepId ? traceMap[selectedStepId] : undefined;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-4 rounded-[28px] border border-glass-border bg-slate-950/70 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Execution Trace
            </p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">
              {execution ? execution.status.replace('_', ' ') : 'No execution selected'}
            </h3>
          </div>
          {onRerun ? (
            <button
              type="button"
              className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
              onClick={onRerun}
            >
              Re-run Workflow
            </button>
          ) : null}
        </div>
        <div className="space-y-3">
          {flattened.map(({ step, depth, branchLabel }) => (
            <WorkflowStepNode
              key={`${step.id}-${branchLabel ?? 'root'}`}
              step={step}
              depth={depth}
              branchLabel={branchLabel}
              readOnly
              selected={selectedStepId === step.id}
              execution={traceMap[step.id]}
              onSelect={setSelectedStepId}
            />
          ))}
        </div>
      </div>
      <div className="space-y-4 rounded-[28px] border border-glass-border bg-slate-950/70 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Timeline
          </p>
          <h3 className="mt-2 text-xl font-semibold text-foreground">
            {selectedStepId ?? 'Select a step'}
          </h3>
        </div>
        {selectedResult ? (
          <StepExecutionDetail result={selectedResult} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Click any step to inspect duration, output, and errors.
          </p>
        )}
        <div className="rounded-2xl border border-glass-border bg-white/[0.03] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Run Summary
          </p>
          <dl className="mt-3 space-y-2 text-sm text-foreground/70">
            <div className="flex items-center justify-between">
              <dt>Status</dt>
              <dd>{execution?.status ?? 'n/a'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Started</dt>
              <dd>{execution?.started_at ? new Date(execution.started_at).toLocaleString() : 'n/a'}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt>Completed</dt>
              <dd>
                {execution?.completed_at
                  ? new Date(execution.completed_at).toLocaleString()
                  : 'Pending'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function StepExecutionDetail({ result }: { result: ExecutionResult }) {
  return (
    <div className="space-y-4">
      <dl className="space-y-2 text-sm text-foreground/70">
        <div className="flex items-center justify-between">
          <dt>Status</dt>
          <dd>{result.status}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt>Duration</dt>
          <dd>{result.duration} ms</dd>
        </div>
      </dl>
      <div className="rounded-2xl border border-glass-border bg-white/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Output</p>
        <pre className="mt-3 overflow-auto text-xs text-foreground/90">
          {JSON.stringify(result.output ?? null, null, 2)}
        </pre>
      </div>
      {result.error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-rose-200">Error</p>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-rose-100">{result.error}</pre>
        </div>
      ) : null}
    </div>
  );
}
