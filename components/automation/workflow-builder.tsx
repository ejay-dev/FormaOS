'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  Minus,
  MousePointer2,
  Plus,
  Redo2,
  Save,
  Undo2,
} from 'lucide-react';

import type {
  WorkflowDefinition,
  WorkflowStep,
  WorkflowStepType,
} from '@/lib/automation/workflow-types';
import { cn } from '@/lib/utils';
import {
  cloneWorkflowDefinition,
  createNewStep,
  flattenSteps,
  STEP_TYPE_LABELS,
  validateWorkflow,
} from './workflow-builder-shared';
import { WorkflowStepConfig } from './workflow-step-config';
import { WorkflowStepNode } from './workflow-step-node';

const palette: WorkflowStepType[] = [
  'action',
  'condition',
  'approval',
  'parallel',
  'delay',
  'loop',
];

function updateStepTree(
  steps: WorkflowStep[],
  stepId: string,
  updater: (step: WorkflowStep) => WorkflowStep,
): WorkflowStep[] {
  return steps.map((step) => {
    if (step.id === stepId) {
      return updater(step);
    }

    if (step.type === 'condition') {
      return {
        ...step,
        thenSteps: updateStepTree(step.thenSteps, stepId, updater),
        elseSteps: updateStepTree(step.elseSteps ?? [], stepId, updater),
      };
    }

    if (step.type === 'parallel') {
      return {
        ...step,
        branches: step.branches.map((branch) => updateStepTree(branch, stepId, updater)),
      };
    }

    if (step.type === 'loop') {
      return {
        ...step,
        steps: updateStepTree(step.steps, stepId, updater),
      };
    }

    return step;
  });
}

function removeStepTree(steps: WorkflowStep[], stepId: string): WorkflowStep[] {
  return steps
    .filter((step) => step.id !== stepId)
    .map((step) => {
      if (step.type === 'condition') {
        return {
          ...step,
          thenSteps: removeStepTree(step.thenSteps, stepId),
          elseSteps: removeStepTree(step.elseSteps ?? [], stepId),
        };
      }

      if (step.type === 'parallel') {
        return {
          ...step,
          branches: step.branches.map((branch) => removeStepTree(branch, stepId)),
        };
      }

      if (step.type === 'loop') {
        return {
          ...step,
          steps: removeStepTree(step.steps, stepId),
        };
      }

      return step;
    });
}

function findStep(steps: WorkflowStep[], stepId: string): WorkflowStep | null {
  for (const step of steps) {
    if (step.id === stepId) return step;
    if (step.type === 'condition') {
      const nested = findStep(step.thenSteps, stepId) ?? findStep(step.elseSteps ?? [], stepId);
      if (nested) return nested;
    }
    if (step.type === 'parallel') {
      for (const branch of step.branches) {
        const nested = findStep(branch, stepId);
        if (nested) return nested;
      }
    }
    if (step.type === 'loop') {
      const nested = findStep(step.steps, stepId);
      if (nested) return nested;
    }
  }
  return null;
}

function reorderRootSteps(
  steps: WorkflowStep[],
  stepId: string,
  direction: 'up' | 'down',
): WorkflowStep[] {
  const index = steps.findIndex((step) => step.id === stepId);
  if (index < 0) return steps;
  const nextIndex = direction === 'up' ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= steps.length) return steps;
  const copy = [...steps];
  const [item] = copy.splice(index, 1);
  copy.splice(nextIndex, 0, item);
  return copy;
}

interface WorkflowBuilderProps {
  definition: WorkflowDefinition;
  readOnly?: boolean;
  onChange?: (definition: WorkflowDefinition) => void;
  onSave?: (definition: WorkflowDefinition) => Promise<void> | void;
}

export function WorkflowBuilder({
  definition,
  readOnly,
  onChange,
  onSave,
}: WorkflowBuilderProps) {
  const [draft, setDraft] = useState(() => cloneWorkflowDefinition(definition));
  const [selectedStepId, setSelectedStepId] = useState<string | null>(definition.steps[0]?.id ?? null);
  const [history, setHistory] = useState<WorkflowDefinition[]>([]);
  const [future, setFuture] = useState<WorkflowDefinition[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [draggingType, setDraggingType] = useState<WorkflowStepType | null>(null);

  useEffect(() => {
    setDraft(cloneWorkflowDefinition(definition));
  }, [definition]);

  const validationErrors = useMemo(() => validateWorkflow(draft), [draft]);
  const selectedStep = selectedStepId ? findStep(draft.steps, selectedStepId) : null;

  const commit = (updater: (current: WorkflowDefinition) => WorkflowDefinition) => {
    setDraft((current) => {
      const next = updater(current);
      setHistory((prev) => [...prev.slice(-24), cloneWorkflowDefinition(current)]);
      setFuture([]);
      onChange?.(next);
      return next;
    });
  };

  const flattened = useMemo(() => flattenSteps(draft.steps), [draft.steps]);

  const addStep = (type: WorkflowStepType) => {
    const step = createNewStep(type);
    commit((current) => ({
      ...current,
      steps: [...current.steps, step],
    }));
    setSelectedStepId(step.id);
  };

  const addNestedStep = (parent: WorkflowStep, branch: 'then' | 'else' | 'loop' | 'parallel') => {
    const step = createNewStep('action');
    commit((current) => ({
      ...current,
      steps: updateStepTree(current.steps, parent.id, (node) => {
        if (node.type === 'condition') {
          if (branch === 'then') {
            return { ...node, thenSteps: [...node.thenSteps, step] };
          }
          if (branch === 'else') {
            return { ...node, elseSteps: [...(node.elseSteps ?? []), step] };
          }
        }
        if (node.type === 'loop' && branch === 'loop') {
          return { ...node, steps: [...node.steps, step] };
        }
        if (node.type === 'parallel' && branch === 'parallel') {
          const branches = [...node.branches];
          branches[0] = [...(branches[0] ?? []), step];
          return { ...node, branches };
        }
        return node;
      }),
    }));
    setSelectedStepId(step.id);
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
      <aside className="space-y-4 rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Palette</p>
          <h3 className="mt-2 text-lg font-semibold text-slate-100">Drag Step Types</h3>
        </div>
        <div className="space-y-3">
          {palette.map((type) => (
            <button
              key={type}
              type="button"
              draggable={!readOnly}
              onDragStart={() => setDraggingType(type)}
              onDragEnd={() => setDraggingType(null)}
              onClick={() => !readOnly && addStep(type)}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-sm text-slate-200 transition hover:border-white/20 hover:bg-white/[0.06]"
            >
              <span>{STEP_TYPE_LABELS[type]}</span>
              <Plus className="h-4 w-4 text-slate-400" />
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
          <p className="font-semibold text-slate-200">Validation</p>
          <p className="mt-2">{Object.keys(validationErrors).length} issues detected</p>
        </div>
      </aside>

      <section className="space-y-4 rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Canvas</p>
            <h3 className="mt-2 text-lg font-semibold text-slate-100">Visual Workflow Builder</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-white/10 p-2 text-slate-200 hover:bg-white/10 disabled:opacity-40"
              onClick={() =>
                setHistory((currentHistory) => {
                  const previous = currentHistory[currentHistory.length - 1];
                  if (!previous) return currentHistory;
                  setFuture((currentFuture) => [cloneWorkflowDefinition(draft), ...currentFuture]);
                  setDraft(previous);
                  onChange?.(previous);
                  return currentHistory.slice(0, -1);
                })
              }
              disabled={history.length === 0 || readOnly}
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-xl border border-white/10 p-2 text-slate-200 hover:bg-white/10 disabled:opacity-40"
              onClick={() =>
                setFuture((currentFuture) => {
                  const next = currentFuture[0];
                  if (!next) return currentFuture;
                  setHistory((currentHistory) => [...currentHistory, cloneWorkflowDefinition(draft)]);
                  setDraft(next);
                  onChange?.(next);
                  return currentFuture.slice(1);
                })
              }
              disabled={future.length === 0 || readOnly}
            >
              <Redo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-xl border border-white/10 p-2 text-slate-200 hover:bg-white/10"
              onClick={() => setZoom((current) => Math.max(0.7, current - 0.1))}
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="rounded-xl border border-white/10 p-2 text-slate-200 hover:bg-white/10"
              onClick={() => setZoom((current) => Math.min(1.6, current + 0.1))}
            >
              <Plus className="h-4 w-4" />
            </button>
            {!readOnly ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
                onClick={() => onSave?.(draft)}
              >
                <Save className="h-4 w-4" />
                Save
              </button>
            ) : null}
          </div>
        </div>

        <div className="rounded-[24px] border border-dashed border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.14),transparent_30%)] p-5">
          <div className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-slate-400">
            <MousePointer2 className="h-3.5 w-3.5" />
            Drag a step here or click a palette item to add one
          </div>
          <div
            role="list"
            className={cn(
              'min-h-[640px] rounded-[24px] border border-white/10 bg-slate-950/70 p-4 transition',
              draggingType ? 'border-cyan-400/50 bg-cyan-500/5' : '',
            )}
            onDragOver={(event) => {
              if (!readOnly) event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              if (!readOnly && draggingType) {
                addStep(draggingType);
              }
              setDraggingType(null);
            }}
          >
            <div
              className="space-y-3 origin-top-left"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              {flattened.length === 0 ? (
                <div className="flex min-h-[480px] items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.02] text-sm text-slate-400">
                  No steps yet.
                </div>
              ) : (
                flattened.map(({ step, depth, branchLabel }, index) => (
                  <div key={`${step.id}-${branchLabel ?? 'root'}`} className="space-y-2">
                    <WorkflowStepNode
                      step={step}
                      depth={depth}
                      branchLabel={branchLabel}
                      selected={selectedStepId === step.id}
                      validationErrors={validationErrors[step.id]}
                      onSelect={setSelectedStepId}
                      onDelete={
                        readOnly
                          ? undefined
                          : (stepId) => {
                              commit((current) => ({
                                ...current,
                                steps: removeStepTree(current.steps, stepId),
                              }));
                              if (selectedStepId === stepId) {
                                setSelectedStepId(null);
                              }
                            }
                      }
                      onMove={
                        readOnly
                          ? undefined
                          : (stepId, direction) => {
                              commit((current) => ({
                                ...current,
                                steps: reorderRootSteps(current.steps, stepId, direction),
                              }));
                            }
                      }
                    />
                    {index < flattened.length - 1 ? (
                      <div
                        className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500"
                        style={{ marginLeft: depth * 28 + 16 }}
                      >
                        <div className="h-6 w-px bg-white/10" />
                        <ArrowDown className="h-3.5 w-3.5" />
                        <span>Flow</span>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              ['←', -40, 0],
              ['→', 40, 0],
              ['↑', 0, -40],
              ['↓', 0, 40],
            ].map(([label, x, y]) => (
              <button
                type="button"
                key={label}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/10"
                onClick={() =>
                  setPan((current) => ({
                    x: current.x + Number(x),
                    y: current.y + Number(y),
                  }))
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <WorkflowStepConfig
          step={selectedStep}
          onChange={(nextStep) =>
            commit((current) => ({
              ...current,
              steps: updateStepTree(current.steps, nextStep.id, () => nextStep),
            }))
          }
        />
        {!readOnly && selectedStep ? (
          <div className="space-y-3 rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Structure
            </p>
            <div className="space-y-2">
              {selectedStep.type === 'condition' ? (
                <>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                    onClick={() => addNestedStep(selectedStep, 'then')}
                  >
                    Add step to THEN branch
                  </button>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                    onClick={() => addNestedStep(selectedStep, 'else')}
                  >
                    Add step to ELSE branch
                  </button>
                </>
              ) : null}
              {selectedStep.type === 'loop' ? (
                <button
                  type="button"
                  className="w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                  onClick={() => addNestedStep(selectedStep, 'loop')}
                >
                  Add loop child step
                </button>
              ) : null}
              {selectedStep.type === 'parallel' ? (
                <button
                  type="button"
                  className="w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10"
                  onClick={() => addNestedStep(selectedStep, 'parallel')}
                >
                  Add to first branch
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
