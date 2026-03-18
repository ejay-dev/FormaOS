'use client';

import type { ReactNode } from 'react';
import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Clock3, Play, Settings2, Workflow } from 'lucide-react';

import type {
  WorkflowDefinition,
  WorkflowExecutionRecord,
  WorkflowExecutionSummary,
} from '@/lib/automation/workflow-types';
import { WorkflowBuilder } from '@/components/automation/workflow-builder';
import { WorkflowExecutionViewer } from '@/components/automation/workflow-execution-viewer';

interface WorkflowDetailClientProps {
  workflow: WorkflowDefinition;
  executions: WorkflowExecutionSummary[];
  latestExecution: WorkflowExecutionRecord | null;
}

type Tab = 'builder' | 'executions' | 'settings';

export function WorkflowDetailClient({
  workflow,
  executions,
  latestExecution,
}: WorkflowDetailClientProps) {
  const router = useRouter();
  const [currentWorkflow, setCurrentWorkflow] = useState(workflow);
  const [activeTab, setActiveTab] = useState<Tab>('builder');
  const [isPending, startTransition] = useTransition();

  const metrics = useMemo(() => {
    const total = executions.length;
    const success = executions.filter((execution) => execution.status === 'completed').length;
    return {
      total,
      successRate: total === 0 ? 100 : Math.round((success / total) * 100),
    };
  }, [executions]);

  async function saveWorkflow(next: WorkflowDefinition) {
    const response = await fetch(`/api/automation/workflows/${next.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });

    if (!response.ok) {
      return;
    }

    const saved = (await response.json()) as WorkflowDefinition;
    setCurrentWorkflow(saved);
    router.refresh();
  }

  async function runWorkflow() {
    startTransition(async () => {
      await fetch(`/api/automation/workflows/${currentWorkflow.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          manualRunAt: new Date().toISOString(),
        }),
      });
      router.refresh();
    });
  }

  async function saveSettings() {
    await saveWorkflow(currentWorkflow);
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-[32px] border border-white/10 bg-slate-950/70 p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Workflow Detail
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-100">
            {currentWorkflow.name}
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Triggered by <span className="text-slate-200">{currentWorkflow.trigger.type}</span> with{' '}
            {currentWorkflow.steps.length} configured steps.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
            onClick={runWorkflow}
            disabled={isPending}
          >
            <Play className="h-4 w-4" />
            Run Now
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={<Workflow className="h-5 w-5 text-cyan-300" />} label="Executions" value={String(metrics.total)} />
        <MetricCard icon={<Clock3 className="h-5 w-5 text-cyan-300" />} label="Success Rate" value={`${metrics.successRate}%`} />
        <MetricCard icon={<Settings2 className="h-5 w-5 text-cyan-300" />} label="Version" value={`v${currentWorkflow.version}`} />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          ['builder', 'Builder'],
          ['executions', 'Executions'],
          ['settings', 'Settings'],
        ].map(([tab, label]) => (
          <button
            type="button"
            key={tab}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab
                ? 'bg-cyan-500/15 text-cyan-100'
                : 'bg-slate-950/70 text-slate-300 hover:bg-white/[0.06]'
            }`}
            onClick={() => setActiveTab(tab as Tab)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'builder' ? (
        <WorkflowBuilder
          definition={currentWorkflow}
          onChange={setCurrentWorkflow}
          onSave={saveWorkflow}
        />
      ) : null}

      {activeTab === 'executions' ? (
        <div className="space-y-6">
          <WorkflowExecutionViewer
            workflow={currentWorkflow}
            execution={latestExecution}
            onRerun={runWorkflow}
          />
          <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
            <h2 className="text-lg font-semibold text-slate-100">Execution History</h2>
            <div className="mt-4 space-y-3">
              {executions.map((execution) => (
                <div
                  key={execution.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"
                >
                  <span>{execution.status}</span>
                  <span>{new Date(execution.startedAt).toLocaleString()}</span>
                  <span>{execution.stepsCompleted}/{execution.stepsTotal} steps</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'settings' ? (
        <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <SettingField label="Name">
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
                value={currentWorkflow.name}
                onChange={(event) =>
                  setCurrentWorkflow((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </SettingField>
            <SettingField label="Trigger Type">
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
                value={currentWorkflow.trigger.type}
                onChange={(event) =>
                  setCurrentWorkflow((current) => ({
                    ...current,
                    trigger: {
                      ...current.trigger,
                      type: event.target.value as WorkflowDefinition['trigger']['type'],
                    },
                  }))
                }
              />
            </SettingField>
            <SettingField label="Enabled">
              <label className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={currentWorkflow.enabled}
                  onChange={(event) =>
                    setCurrentWorkflow((current) => ({
                      ...current,
                      enabled: event.target.checked,
                      status: event.target.checked ? 'active' : 'paused',
                    }))
                  }
                />
                Workflow is enabled
              </label>
            </SettingField>
            <SettingField label="Updated">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
                {new Date(currentWorkflow.updated_at).toLocaleString()}
              </div>
            </SettingField>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
              Description
            </p>
            <textarea
              className="mt-3 min-h-28 w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60"
              value={currentWorkflow.description}
              onChange={(event) =>
                setCurrentWorkflow((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </div>
          <div className="mt-6 flex justify-end">
            <button
              type="button"
              className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
              onClick={saveSettings}
            >
              Save Settings
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p>
        </div>
      </div>
    </div>
  );
}

function SettingField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{label}</dt>
      <dd className="mt-2 text-sm text-slate-200">{children}</dd>
    </div>
  );
}
