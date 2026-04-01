'use client';

import type { ReactNode } from 'react';
import { useMemo } from 'react';

import type {
  ActionStep,
  ApprovalStep,
  Condition,
  ConditionStep,
  DelayStep,
  LoopStep,
  WorkflowActionType,
  WorkflowStep,
} from '@/lib/automation/workflow-types';
import { variableSuggestions } from './workflow-builder-shared';

const actionOptions: WorkflowActionType[] = [
  'send_notification',
  'send_email',
  'create_task',
  'assign_task',
  'update_status',
  'update_field',
  'escalate',
  'webhook',
  'log_activity',
  'calculate_compliance_score',
  'generate_report',
  'create_incident_room',
  'create_approval_task',
  'set_variable',
];

const operatorOptions: Condition['operator'][] = [
  'eq',
  'neq',
  'gt',
  'lt',
  'gte',
  'lte',
  'contains',
  'not_contains',
  'in',
  'not_in',
  'exists',
  'not_exists',
  'matches',
];

interface WorkflowStepConfigProps {
  step: WorkflowStep | null;
  onChange: (step: WorkflowStep) => void;
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function inputClassName() {
  return 'w-full rounded-xl border border-glass-border bg-slate-950/80 px-3 py-2 text-sm text-foreground outline-none transition focus:border-cyan-400/60';
}

export function WorkflowStepConfig({ step, onChange }: WorkflowStepConfigProps) {
  const datalistId = useMemo(
    () => `workflow-variable-suggestions-${step?.id ?? 'none'}`,
    [step?.id],
  );

  if (!step) {
    return (
      <div className="rounded-3xl border border-glass-border bg-slate-950/70 p-6 text-sm text-muted-foreground">
        Select a step to configure it.
      </div>
    );
  }

  const updateStep = (next: WorkflowStep) => onChange(next);

  return (
    <div className="space-y-5 rounded-3xl border border-glass-border bg-slate-950/70 p-6">
      <div className="space-y-3">
        <Field label="Step Name">
          <input
            list={datalistId}
            className={inputClassName()}
            value={step.name}
            onChange={(event) =>
              updateStep({
                ...step,
                name: event.target.value,
              })
            }
          />
        </Field>
        <Field label="Description">
          <textarea
            className={`${inputClassName()} min-h-24`}
            value={step.description ?? ''}
            onChange={(event) =>
              updateStep({
                ...step,
                description: event.target.value,
              })
            }
          />
        </Field>
      </div>

      {step.type === 'action' ? (
        <ActionConfig
          step={step}
          datalistId={datalistId}
          onChange={(next) => updateStep(next)}
        />
      ) : null}

      {step.type === 'condition' ? (
        <ConditionConfig
          step={step}
          datalistId={datalistId}
          onChange={(next) => updateStep(next)}
        />
      ) : null}

      {step.type === 'approval' ? (
        <ApprovalConfig
          step={step}
          datalistId={datalistId}
          onChange={(next) => updateStep(next)}
        />
      ) : null}

      {step.type === 'delay' ? (
        <DelayConfig
          step={step}
          onChange={(next) => updateStep(next)}
        />
      ) : null}

      {step.type === 'loop' ? (
        <LoopConfig
          step={step}
          datalistId={datalistId}
          onChange={(next) => updateStep(next)}
        />
      ) : null}

      {step.type === 'parallel' ? (
        <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-sm text-sky-100">
          Parallel steps are edited from the canvas structure. This step currently has {step.branches.length}{' '}
          branches.
        </div>
      ) : null}

      <div className="rounded-2xl border border-glass-border bg-white/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Variable Tokens
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {variableSuggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              className="rounded-full border border-glass-border px-3 py-1 text-xs text-foreground/70 hover:bg-glass-strong"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(suggestion);
                } catch {
                  // ignore clipboard failures in unsupported browsers
                }
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      <datalist id={datalistId}>
        {variableSuggestions.map((suggestion) => (
          <option value={suggestion} key={suggestion} />
        ))}
      </datalist>
    </div>
  );
}

function ActionConfig({
  step,
  datalistId,
  onChange,
}: {
  step: ActionStep;
  datalistId: string;
  onChange: (step: ActionStep) => void;
}) {
  const config = step.config ?? {};

  const updateConfig = (key: string, value: string) => {
    onChange({
      ...step,
      config: {
        ...config,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
      <Field label="Action Type">
        <select
          className={inputClassName()}
          value={step.action}
          onChange={(event) =>
            onChange({
              ...step,
              action: event.target.value as WorkflowActionType,
            })
          }
        >
          {actionOptions.map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        {['title', 'message', 'userId', 'assignedTo', 'recordId', 'table', 'status', 'url', 'reportType', 'name'].map(
          (field) => (
            <Field label={field} key={field}>
              <input
                list={datalistId}
                className={inputClassName()}
                value={String(config[field] ?? '')}
                onChange={(event) => updateConfig(field, event.target.value)}
              />
            </Field>
          ),
        )}
      </div>
      <Field label="On Error">
        <select
          className={inputClassName()}
          value={step.onError}
          onChange={(event) =>
            onChange({
              ...step,
              onError: event.target.value as ActionStep['onError'],
            })
          }
        >
          <option value="stop">Stop workflow</option>
          <option value="continue">Continue workflow</option>
          <option value="retry">Retry up to 3 times</option>
        </select>
      </Field>
      <Field label="Advanced Config JSON">
        <textarea
          className={`${inputClassName()} min-h-32 font-mono text-xs`}
          value={JSON.stringify(config, null, 2)}
          onChange={(event) => {
            try {
              onChange({
                ...step,
                config: JSON.parse(event.target.value) as Record<string, unknown>,
              });
            } catch {
              // Keep the UI permissive while the user is typing invalid JSON.
            }
          }}
        />
      </Field>
    </div>
  );
}

function ConditionConfig({
  step,
  datalistId,
  onChange,
}: {
  step: ConditionStep;
  datalistId: string;
  onChange: (step: ConditionStep) => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
      <Field label="Combinator">
        <select
          className={inputClassName()}
          value={step.combinator ?? 'and'}
          onChange={(event) =>
            onChange({
              ...step,
              combinator: event.target.value as 'and' | 'or',
            })
          }
        >
          <option value="and">All conditions must match</option>
          <option value="or">Any condition may match</option>
        </select>
      </Field>
      <div className="space-y-3">
        {step.conditions.map((condition, index) => (
          <div key={`${step.id}-condition-${index}`} className="grid gap-3 md:grid-cols-3">
            <input
              list={datalistId}
              className={inputClassName()}
              value={condition.field}
              onChange={(event) => {
                const conditions = [...step.conditions];
                conditions[index] = { ...condition, field: event.target.value };
                onChange({ ...step, conditions });
              }}
              placeholder="trigger.data.score"
            />
            <select
              className={inputClassName()}
              value={condition.operator}
              onChange={(event) => {
                const conditions = [...step.conditions];
                conditions[index] = {
                  ...condition,
                  operator: event.target.value as Condition['operator'],
                };
                onChange({ ...step, conditions });
              }}
            >
              {operatorOptions.map((option) => (
                <option value={option} key={option}>
                  {option}
                </option>
              ))}
            </select>
            <input
              list={datalistId}
              className={inputClassName()}
              value={String(condition.value ?? '')}
              onChange={(event) => {
                const conditions = [...step.conditions];
                conditions[index] = { ...condition, value: event.target.value };
                onChange({ ...step, conditions });
              }}
              placeholder="Expected value"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="rounded-xl border border-glass-border px-3 py-2 text-sm text-foreground/90 hover:bg-glass-strong"
        onClick={() =>
          onChange({
            ...step,
            conditions: [
              ...step.conditions,
              {
                field: 'trigger.data.value',
                operator: 'eq',
                value: '',
              },
            ],
          })
        }
      >
        Add condition
      </button>
    </div>
  );
}

function ApprovalConfig({
  step,
  datalistId,
  onChange,
}: {
  step: ApprovalStep;
  datalistId: string;
  onChange: (step: ApprovalStep) => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4">
      <Field label="Approvers">
        <input
          list={datalistId}
          className={inputClassName()}
          value={step.approvers.join(', ')}
          onChange={(event) =>
            onChange({
              ...step,
              approvers: event.target.value
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean),
            })
          }
          placeholder="{{trigger.data.managerId}}, compliance-lead"
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Timeout">
          <input
            className={inputClassName()}
            value={String(step.timeout)}
            onChange={(event) =>
              onChange({
              ...step,
              timeout: event.target.value as typeof step.timeout,
              })
            }
            placeholder="3d"
          />
        </Field>
        <Field label="On Timeout">
          <select
            className={inputClassName()}
            value={step.onTimeout}
            onChange={(event) =>
              onChange({
                ...step,
                onTimeout: event.target.value as ApprovalStep['onTimeout'],
              })
            }
          >
            <option value="approve">Auto approve</option>
            <option value="reject">Auto reject</option>
            <option value="escalate">Escalate</option>
          </select>
        </Field>
      </div>
      <Field label="Escalate To">
        <input
          list={datalistId}
          className={inputClassName()}
          value={(step.timeoutEscalateTo ?? []).join(', ')}
          onChange={(event) =>
            onChange({
              ...step,
              timeoutEscalateTo: event.target.value
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean),
            })
          }
        />
      </Field>
    </div>
  );
}

function DelayConfig({
  step,
  onChange,
}: {
  step: DelayStep;
  onChange: (step: DelayStep) => void;
}) {
  return (
    <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 p-4">
      <Field label="Duration">
        <input
          className={inputClassName()}
          value={String(step.duration)}
          onChange={(event) =>
            onChange({
              ...step,
              duration: event.target.value as typeof step.duration,
            })
          }
          placeholder="7d"
        />
      </Field>
    </div>
  );
}

function LoopConfig({
  step,
  datalistId,
  onChange,
}: {
  step: LoopStep;
  datalistId: string;
  onChange: (step: LoopStep) => void;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4">
      <Field label="Collection">
        <input
          list={datalistId}
          className={inputClassName()}
          value={step.collection}
          onChange={(event) =>
            onChange({
              ...step,
              collection: event.target.value,
            })
          }
        />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Item Variable">
          <input
            className={inputClassName()}
            value={step.itemVariable}
            onChange={(event) =>
              onChange({
                ...step,
                itemVariable: event.target.value,
              })
            }
          />
        </Field>
        <Field label="Max Iterations">
          <input
            className={inputClassName()}
            type="number"
            min={1}
            value={step.maxIterations}
            onChange={(event) =>
              onChange({
                ...step,
                maxIterations: Number(event.target.value) || 1,
              })
            }
          />
        </Field>
      </div>
    </div>
  );
}
