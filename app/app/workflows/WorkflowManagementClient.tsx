'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Play,
  Plus,
  Power,
  Sparkles,
  Workflow,
} from 'lucide-react';

import type {
  WorkflowDefinition,
  WorkflowExecutionSummary,
} from '@/lib/automation/workflow-types';
import type { WorkflowTemplateDefinition } from '@/lib/automation/workflow-types';
import { WorkflowTemplatePicker } from '@/components/automation/workflow-template-picker';

interface WorkflowManagementClientProps {
  initialWorkflows: WorkflowDefinition[];
  executionHistory: WorkflowExecutionSummary[];
  templates: WorkflowTemplateDefinition[];
}

function successRateForWorkflow(
  workflowId: string,
  history: WorkflowExecutionSummary[],
): number {
  const runs = history.filter((item) => item.workflowId === workflowId);
  if (runs.length === 0) {
    return 100;
  }

  const successes = runs.filter((item) => item.status === 'completed').length;
  return Math.round((successes / runs.length) * 100);
}

export function WorkflowManagementClient({
  initialWorkflows,
  executionHistory,
  templates,
}: WorkflowManagementClientProps) {
  const router = useRouter();
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [showTemplates, setShowTemplates] = useState(false);
  const [isPending, startTransition] = useTransition();

  const stats = useMemo(() => {
    const active = workflows.filter((workflow) => workflow.enabled).length;
    const lastRun = executionHistory[0]?.startedAt;
    return {
      total: workflows.length,
      active,
      lastRun,
    };
  }, [executionHistory, workflows]);

  async function createWorkflow(body: Record<string, unknown>) {
    const response = await fetch('/api/automation/workflows', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to create workflow');
    }

    return (await response.json()) as WorkflowDefinition;
  }

  async function toggleWorkflow(workflow: WorkflowDefinition) {
    startTransition(async () => {
      const response = await fetch(`/api/automation/workflows/${workflow.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: !workflow.enabled,
          status: workflow.enabled ? 'paused' : 'active',
        }),
      });

      if (!response.ok) {
        return;
      }

      const updated = (await response.json()) as WorkflowDefinition;
      setWorkflows((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    });
  }

  async function runWorkflow(workflow: WorkflowDefinition) {
    startTransition(async () => {
      await fetch(`/api/automation/workflows/${workflow.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manualRunAt: new Date().toISOString(),
        }),
      });
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Workflows" value={String(stats.total)} />
        <StatCard label="Enabled" value={String(stats.active)} />
        <StatCard
          label="Last Run"
          value={stats.lastRun ? new Date(stats.lastRun).toLocaleDateString() : 'No runs yet'}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">
            Build multi-step automations with conditions, approvals, delays, and parallel branches.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/[0.08]"
            onClick={() =>
              startTransition(async () => {
                const workflow = await createWorkflow({
                  name: 'Untitled Workflow',
                  description: '',
                  status: 'draft',
                  enabled: false,
                  trigger: { type: 'manual' },
                  steps: [],
                });
                router.push(`/app/workflows/${workflow.id}`);
              })
            }
          >
            <Plus className="h-4 w-4" />
            Blank Workflow
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
            onClick={() => setShowTemplates((current) => !current)}
          >
            <Sparkles className="h-4 w-4" />
            From Template
          </button>
        </div>
      </div>

      {showTemplates ? (
        <div className="space-y-4 rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Template Library
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-100">
                Install a workflow starter
              </h2>
            </div>
          </div>
          <WorkflowTemplatePicker
            templates={templates}
            onUseTemplate={(template) =>
              startTransition(async () => {
                const workflow = await createWorkflow({
                  ...template.definition,
                  enabled: false,
                  status: 'draft',
                });
                router.push(`/app/workflows/${workflow.id}`);
              })
            }
          />
        </div>
      ) : null}

      <div className="grid gap-4">
        {workflows.map((workflow) => {
          const successRate = successRateForWorkflow(workflow.id, executionHistory);
          const lastRun = executionHistory.find((item) => item.workflowId === workflow.id);

          return (
            <div
              key={workflow.id}
              className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-semibold text-slate-100">{workflow.name}</h3>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                      {workflow.trigger.type}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                        workflow.enabled
                          ? 'bg-emerald-500/15 text-emerald-200'
                          : 'bg-slate-500/15 text-slate-300'
                      }`}
                    >
                      {workflow.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{workflow.description || 'No description yet.'}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-300">
                    <span>{workflow.steps.length} steps</span>
                    <span>{successRate}% success rate</span>
                    <span>{lastRun ? `Last run ${new Date(lastRun.startedAt).toLocaleString()}` : 'No runs yet'}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-white/10 p-2 text-slate-200 hover:bg-white/10"
                    onClick={() => toggleWorkflow(workflow)}
                    disabled={isPending}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-2 text-cyan-100 hover:bg-cyan-500/20"
                    onClick={() => runWorkflow(workflow)}
                    disabled={isPending}
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <Link
                    href={`/app/workflows/${workflow.id}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-100 hover:bg-white/10"
                  >
                    <Workflow className="h-4 w-4" />
                    Open Builder
                  </Link>
                </div>
              </div>
              {workflow.tags?.length ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {workflow.tags.map((tag) => (
                    <span
                      key={`${workflow.id}-${tag}`}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {workflows.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/10 bg-slate-950/50 p-8 text-center">
          <CheckCircle2 className="mx-auto h-10 w-10 text-cyan-300" />
          <h3 className="mt-4 text-lg font-semibold text-slate-100">No workflows configured</h3>
          <p className="mt-2 text-sm text-slate-400">
            Start with a blank automation or install one of the compliance templates.
          </p>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}
