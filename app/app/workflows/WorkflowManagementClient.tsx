'use client';

import { useState } from 'react';
import {
  Plus,
  Zap,
  Play,
  Pause,
  Trash2,
  Settings,
  CheckCircle2,
} from 'lucide-react';
import { useComplianceAction } from '@/components/compliance-system';
import { motion } from 'framer-motion';

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  enabled: boolean;
  actions: any[];
  conditions?: any[];
  created_at: string;
}

export function WorkflowManagementClient({
  initialWorkflows,
  organizationId,
}: {
  initialWorkflows: Workflow[];
  organizationId: string;
}) {
  const [workflows, setWorkflows] = useState<Workflow[]>(initialWorkflows);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { reportSuccess, reportError } = useComplianceAction();

  const triggerTypes = [
    { value: 'member_added', label: 'New Member Added', icon: '👤' },
    { value: 'task_created', label: 'Task Created', icon: '📋' },
    { value: 'task_completed', label: 'Task Completed', icon: '✅' },
    {
      value: 'certificate_expiring',
      label: 'Certificate Expiring',
      icon: '⚠️',
    },
    { value: 'task_overdue', label: 'Task Overdue', icon: '🔴' },
  ];

  const actionTypes = [
    { value: 'send_notification', label: 'Send Notification', icon: '🔔' },
    { value: 'send_email', label: 'Send Email', icon: '📧' },
    { value: 'create_task', label: 'Create Task', icon: '✏️' },
    { value: 'assign_task', label: 'Assign Task', icon: '👥' },
    { value: 'escalate', label: 'Escalate', icon: '⬆️' },
  ];

  async function toggleWorkflow(workflowId: string) {
    const workflow = workflows.find((w) => w.id === workflowId);
    if (!workflow) return;

    try {
      const response = await fetch(`/api/workflows/${workflowId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to toggle workflow');

      setWorkflows((prev) =>
        prev.map((w) =>
          w.id === workflowId ? { ...w, enabled: !w.enabled } : w,
        ),
      );

      reportSuccess({
        title: workflow.enabled ? 'Workflow paused' : 'Workflow activated',
        message: workflow.name,
      });
    } catch (error) {
      reportError({
        title: 'Failed to toggle workflow',
        message: String(error),
      });
    }
  }

  async function deleteWorkflow(workflowId: string) {
    if (!confirm('Are you sure you want to delete this workflow?')) return;

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete workflow');

      setWorkflows((prev) => prev.filter((w) => w.id !== workflowId));

      reportSuccess({
        title: 'Workflow deleted',
        message: 'Automation removed successfully',
      });
    } catch (error) {
      reportError({
        title: 'Failed to delete workflow',
        message: String(error),
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {workflows.length} workflows configured
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Workflow
        </button>
      </div>

      {/* Workflow List */}
      <div className="grid grid-cols-1 gap-4">
        {workflows.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-white/10 rounded-2xl">
            <Zap className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-300 mb-2">
              No workflows yet
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              Create automated workflows to streamline your compliance processes
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-violet-500 hover:bg-violet-600 text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Your First Workflow
            </button>
          </div>
        ) : (
          workflows.map((workflow, idx) => (
            <motion.div
              key={workflow.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="border border-white/10 bg-white/5 rounded-2xl p-6 hover:bg-white/10 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-slate-100">
                      {workflow.name}
                    </h3>
                    {workflow.enabled ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-500/20 text-slate-400 text-xs font-semibold">
                        <Pause className="h-3 w-3" />
                        Paused
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-slate-400 mb-4">
                    {workflow.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Trigger:</span>
                      <span className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded">
                        {
                          triggerTypes.find((t) => t.value === workflow.trigger)
                            ?.label
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Actions:</span>
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded">
                        {workflow.actions?.length || 0} configured
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleWorkflow(workflow.id)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title={workflow.enabled ? 'Pause' : 'Activate'}
                  >
                    {workflow.enabled ? (
                      <Pause className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Play className="h-4 w-4 text-green-400" />
                    )}
                  </button>
                  <button
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Settings className="h-4 w-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => deleteWorkflow(workflow.id)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4 text-red-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pre-built Workflow Templates */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">
          Workflow Templates
        </h2>
        <p className="text-sm text-slate-400 mb-6">
          Quick-start templates for common compliance workflows
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              name: 'New Member Onboarding',
              description:
                'Automatically send welcome email and assign onboarding tasks when a new team member joins',
              trigger: 'member_added',
              actions: ['send_notification', 'create_task'],
            },
            {
              name: 'Certificate Expiry Reminder',
              description:
                'Send notification 30 days before certificate expires',
              trigger: 'certificate_expiring',
              actions: ['send_notification', 'send_email'],
            },
            {
              name: 'Overdue Task Escalation',
              description: 'Escalate overdue tasks to managers after 3 days',
              trigger: 'task_overdue',
              actions: ['send_email', 'escalate'],
            },
            {
              name: 'Task Completion Celebration',
              description:
                'Send positive reinforcement when tasks are completed',
              trigger: 'task_completed',
              actions: ['send_notification'],
            },
          ].map((template, idx) => (
            <div
              key={idx}
              className="border border-white/10 bg-white/5 rounded-2xl p-5 hover:bg-white/10 transition-all cursor-pointer group"
            >
              <h3 className="text-base font-bold text-slate-100 mb-2 group-hover:text-violet-300 transition-colors">
                {template.name}
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                {template.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="px-2 py-1 bg-violet-500/20 text-violet-300 rounded">
                    {
                      triggerTypes.find((t) => t.value === template.trigger)
                        ?.label
                    }
                  </span>
                </div>
                <button className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                  Use Template →
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
