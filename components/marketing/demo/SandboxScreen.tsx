'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare, Lock, Activity, Zap, Shield, FileText,
  Clock, AlertTriangle, Check, Circle, TrendingUp,
  Upload, Eye, Building2, BarChart3,
} from 'lucide-react';
import { easing, duration } from '@/config/motion';
import { demoTenant, resolveUserName, resolveFramework } from './demo-tenant-seed';
import { TaskDetailDrawer, EvidenceDetailDrawer, AuditTimelineDrawer, WorkflowActionDrawer } from './SandboxDrawers';
import { trackDemoEvent } from './demo-analytics';
import type { PhaseId } from './phase-demo-data';
import type { TenantTask, TenantEvidence } from './demo-tenant-seed';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DrawerState =
  | { type: 'none' }
  | { type: 'task'; task: TenantTask }
  | { type: 'evidence'; evidence: TenantEvidence }
  | { type: 'audit'; filter?: string }
  | { type: 'workflow' };

// Sandbox navigation tabs matching the 4 phases
type SandboxTab = 'overview' | 'tasks' | 'evidence' | 'controls' | 'reports';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: duration.fast, ease: easing.signature } },
};

// ---------------------------------------------------------------------------
// Helper Components
// ---------------------------------------------------------------------------

function AvatarBadge({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('');
  return (
    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
      <span className="text-[7px] font-bold text-slate-200">{initials}</span>
    </div>
  );
}

function TaskStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed': return <Check className="h-2.5 w-2.5 text-emerald-400" />;
    case 'in-progress': return <Clock className="h-2.5 w-2.5 text-blue-400" />;
    case 'overdue': return <AlertTriangle className="h-2.5 w-2.5 text-red-400" />;
    default: return <Circle className="h-2.5 w-2.5 text-slate-500" />;
  }
}

// ---------------------------------------------------------------------------
// Main Sandbox Screen
// ---------------------------------------------------------------------------

interface SandboxScreenProps {
  activePhase: PhaseId;
}

export default function SandboxScreen({ activePhase }: SandboxScreenProps) {
  const [drawer, setDrawer] = useState<DrawerState>({ type: 'none' });
  const [activeTab, setActiveTab] = useState<SandboxTab>('overview');
  const [firedTriggers, setFiredTriggers] = useState<Set<string>>(new Set());
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const closeDrawer = useCallback(() => setDrawer({ type: 'none' }), []);

  const handleTaskAction = useCallback((action: string) => {
    if (drawer.type === 'task') {
      trackDemoEvent({ type: 'demo_sandbox_action', action: `task_${action}`, target: drawer.task.id, phase: activePhase });
      if (action === 'complete' || action === 'start') {
        setCompletedTasks((prev) => new Set(prev).add(drawer.task.id));
      }
    }
    closeDrawer();
  }, [drawer, activePhase, closeDrawer]);

  const handleEvidenceAction = useCallback((action: string) => {
    if (drawer.type === 'evidence') {
      trackDemoEvent({ type: 'demo_sandbox_action', action: `evidence_${action}`, target: drawer.evidence.id, phase: activePhase });
    }
    if (action === 'view-audit-trail') {
      setDrawer({ type: 'audit', filter: 'evidence' });
    } else {
      closeDrawer();
    }
  }, [drawer, activePhase, closeDrawer]);

  const handleFireTrigger = useCallback((triggerId: string) => {
    setFiredTriggers((prev) => new Set(prev).add(triggerId));
  }, []);

  const tabs: { id: SandboxTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'evidence', label: 'Evidence', icon: Lock },
    { id: 'controls', label: 'Controls', icon: Eye },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <div className="relative h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 pt-2 pb-1 border-b border-white/[0.04]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/[0.06] text-white'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
              }`}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}

        {/* Quick-action buttons */}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              trackDemoEvent({ type: 'demo_drawer_opened', drawer: 'workflow', itemId: '' });
              setDrawer({ type: 'workflow' });
            }}
            className="flex items-center gap-1 rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-1 text-[9px] text-blue-300 font-medium hover:bg-blue-500/20 transition-colors"
          >
            <Zap className="h-2.5 w-2.5" /> Triggers
          </button>
          <button
            type="button"
            onClick={() => {
              trackDemoEvent({ type: 'demo_drawer_opened', drawer: 'audit', itemId: '' });
              setDrawer({ type: 'audit' });
            }}
            className="flex items-center gap-1 rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-1 text-[9px] text-slate-400 font-medium hover:text-slate-200 transition-colors"
          >
            <Activity className="h-2.5 w-2.5" /> Audit Log
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: easing.signature }}
          >
            {activeTab === 'overview' && (
              <OverviewPanel
                onOpenTask={(t) => {
                  trackDemoEvent({ type: 'demo_drawer_opened', drawer: 'task', itemId: t.id });
                  setDrawer({ type: 'task', task: t });
                }}
                completedTasks={completedTasks}
              />
            )}
            {activeTab === 'tasks' && (
              <TasksPanel
                onOpenTask={(t) => {
                  trackDemoEvent({ type: 'demo_drawer_opened', drawer: 'task', itemId: t.id });
                  setDrawer({ type: 'task', task: t });
                }}
                completedTasks={completedTasks}
              />
            )}
            {activeTab === 'evidence' && (
              <EvidencePanel
                onOpenEvidence={(e) => {
                  trackDemoEvent({ type: 'demo_drawer_opened', drawer: 'evidence', itemId: e.id });
                  setDrawer({ type: 'evidence', evidence: e });
                }}
              />
            )}
            {activeTab === 'controls' && <ControlsPanel />}
            {activeTab === 'reports' && <ReportsPanel />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Drawers (portaled inside the demo viewport) */}
      <TaskDetailDrawer
        task={drawer.type === 'task' ? drawer.task : null}
        isOpen={drawer.type === 'task'}
        onClose={closeDrawer}
        onAction={handleTaskAction}
      />
      <EvidenceDetailDrawer
        evidence={drawer.type === 'evidence' ? drawer.evidence : null}
        isOpen={drawer.type === 'evidence'}
        onClose={closeDrawer}
        onAction={handleEvidenceAction}
      />
      <AuditTimelineDrawer
        isOpen={drawer.type === 'audit'}
        onClose={closeDrawer}
        filter={drawer.type === 'audit' ? drawer.filter : undefined}
      />
      <WorkflowActionDrawer
        isOpen={drawer.type === 'workflow'}
        onClose={closeDrawer}
        onFire={handleFireTrigger}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Panel: Overview (mini-dashboard)
// ---------------------------------------------------------------------------

function OverviewPanel({ onOpenTask, completedTasks }: { onOpenTask: (t: TenantTask) => void; completedTasks: Set<string> }) {
  const { org, frameworks, kpis } = demoTenant;
  const score = org.plan === 'enterprise' ? 87 : 72;
  const circumference = 2 * Math.PI * 30;
  const offset = circumference - (score / 100) * circumference;

  const urgentTasks = demoTenant.tasks
    .filter((t) => (t.status === 'overdue' || t.status === 'in-progress') && !completedTasks.has(t.id))
    .slice(0, 4);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
      {/* Score + KPIs */}
      <div className="flex gap-3">
        <motion.div variants={fadeUp} className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex-shrink-0">
          <div className="relative h-[64px] w-[64px]">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 68 68">
              <circle cx="34" cy="34" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <circle cx="34" cy="34" r="30" fill="none" stroke="url(#sandboxScoreGrad)" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset} />
              <defs>
                <linearGradient id="sandboxScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-bold text-white">{score}%</span>
              <span className="text-[7px] text-slate-500 uppercase">Score</span>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Compliance</p>
            <p className="text-[10px] font-medium text-white">124/142 controls</p>
          </div>
        </motion.div>

        <div className="flex-1 grid grid-cols-2 gap-2">
          {kpis.map((kpi) => (
            <motion.div key={kpi.id} variants={fadeUp} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5">
              <p className="text-[9px] text-slate-500 uppercase tracking-wider truncate">{kpi.label}</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-white">{kpi.value}</span>
                {kpi.trend !== 'neutral' && (
                  <TrendingUp className={`h-2.5 w-2.5 ${kpi.trend === 'up' ? 'text-emerald-400' : 'text-red-400 rotate-180'}`} />
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Framework Health */}
      <motion.div variants={fadeUp} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Shield className="h-3 w-3 text-cyan-400" />
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Framework Health</span>
        </div>
        <div className="space-y-2">
          {frameworks.map((fw) => (
            <div key={fw.id} className="flex items-center gap-2.5">
              <span className="text-[10px] text-slate-400 w-16 truncate">{fw.shortName}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full" style={{ backgroundColor: fw.color, width: `${fw.score}%` }} />
              </div>
              <span className="text-[10px] font-medium text-slate-300 w-8 text-right">{fw.score}%</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Urgent Tasks (clickable) */}
      {urgentTasks.length > 0 && (
        <motion.div variants={fadeUp} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
          <div className="flex items-center gap-1.5 mb-2.5">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Needs Attention</span>
          </div>
          <div className="space-y-1.5">
            {urgentTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                onClick={() => onOpenTask(task)}
                className="w-full flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.04] px-2.5 py-1.5 text-[10px] text-left hover:bg-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer"
              >
                <TaskStatusIcon status={task.status} />
                <span className="text-slate-200 truncate flex-1">{task.title}</span>
                <span className={`text-[9px] ${task.status === 'overdue' ? 'text-red-400' : 'text-slate-500'}`}>{task.due}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Panel: Tasks
// ---------------------------------------------------------------------------

function TasksPanel({ onOpenTask, completedTasks }: { onOpenTask: (t: TenantTask) => void; completedTasks: Set<string> }) {
  const tasks = demoTenant.tasks.map((t) =>
    completedTasks.has(t.id) ? { ...t, status: 'completed' as const } : t,
  );
  const statusOrder = ['overdue', 'in-progress', 'pending', 'completed'] as const;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Tasks</h2>
          <span className="text-[10px] text-slate-500">{tasks.length} total</span>
        </div>
      </motion.div>

      {/* Status summary */}
      <motion.div variants={fadeUp} className="flex gap-3">
        {statusOrder.map((status) => {
          const count = tasks.filter((t) => t.status === status).length;
          return (
            <div key={status} className="flex items-center gap-1.5 text-[10px]">
              <TaskStatusIcon status={status} />
              <span className="text-slate-400">{count}</span>
              <span className="text-slate-600 hidden sm:inline">{status.replace('-', ' ')}</span>
            </div>
          );
        })}
      </motion.div>

      {/* Task list */}
      <motion.div variants={fadeUp} className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        {tasks.map((task) => (
          <button
            key={task.id}
            type="button"
            onClick={() => onOpenTask(task)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 border-b border-white/[0.03] text-[10px] text-left hover:bg-white/[0.03] transition-colors cursor-pointer ${
              task.status === 'overdue' ? 'bg-red-500/[0.03]' : ''
            }`}
          >
            <TaskStatusIcon status={task.status} />
            <span className={`truncate flex-1 font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
              {task.title}
            </span>
            <AvatarBadge name={resolveUserName(task.assigneeId)} />
            <span className={`text-[9px] flex-shrink-0 ${task.status === 'overdue' ? 'text-red-400' : 'text-slate-500'}`}>{task.due}</span>
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Panel: Evidence
// ---------------------------------------------------------------------------

function EvidencePanel({ onOpenEvidence }: { onOpenEvidence: (e: TenantEvidence) => void }) {
  const items = demoTenant.evidence;
  const categories = [...new Set(items.map((e) => e.category))];

  const statusStyles: Record<string, string> = {
    approved: 'bg-emerald-500/15 text-emerald-400',
    'pending-review': 'bg-amber-500/15 text-amber-400',
    rejected: 'bg-red-500/15 text-red-400',
    expired: 'bg-slate-500/15 text-slate-400',
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-purple-400" />
          <h2 className="text-sm font-semibold text-white">Evidence Vault</h2>
          <span className="text-[10px] text-slate-500">{items.length} items</span>
        </div>
        <button
          type="button"
          className="flex items-center gap-1 rounded-md bg-purple-500/20 px-2 py-1 text-[10px] text-purple-300 border border-purple-500/30"
        >
          <Upload className="h-2.5 w-2.5" /> Upload
        </button>
      </motion.div>

      <motion.div variants={fadeUp} className="flex gap-1.5 flex-wrap">
        <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[9px] text-white font-medium">All</span>
        {categories.map((cat) => (
          <span key={cat} className="rounded-full bg-white/[0.03] px-2 py-0.5 text-[9px] text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
            {cat}
          </span>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item) => (
          <motion.button
            key={item.id}
            type="button"
            variants={fadeUp}
            onClick={() => onOpenEvidence(item)}
            className="text-left rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 cursor-pointer hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-200 truncate">{item.name}</p>
                <p className="text-[9px] text-slate-500">{item.category}</p>
              </div>
              <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium flex-shrink-0 ${statusStyles[item.status] || ''}`}>
                {item.status.replace('-', ' ')}
              </span>
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-500">
              <span>{resolveUserName(item.uploadedById)}</span>
              <span>{item.size} · {item.date}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Panel: Controls
// ---------------------------------------------------------------------------

function ControlsPanel() {
  const { controls } = demoTenant;

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    compliant: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Compliant' },
    'non-compliant': { color: 'text-red-400', bg: 'bg-red-400/10', label: 'Non-compliant' },
    partial: { color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Partial' },
    'not-assessed': { color: 'text-slate-400', bg: 'bg-slate-400/10', label: 'Not Assessed' },
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
      <motion.div variants={fadeUp} className="flex items-center gap-2">
        <Eye className="h-4 w-4 text-purple-400" />
        <h2 className="text-sm font-semibold text-white">Control Register</h2>
        <span className="text-[10px] text-slate-500">{controls.length} controls</span>
      </motion.div>

      <motion.div variants={fadeUp} className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        {controls.map((ctrl) => {
          const fw = resolveFramework(ctrl.frameworkId);
          const owner = resolveUserName(ctrl.ownerId);
          const cfg = statusConfig[ctrl.status];
          return (
            <motion.div
              key={ctrl.id}
              variants={fadeUp}
              className="flex items-center gap-2.5 px-3 py-2 border-b border-white/[0.03] text-[10px] hover:bg-white/[0.02] transition-colors"
            >
              <div className={`h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                <Shield className={`h-2.5 w-2.5 ${cfg.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-200 truncate font-medium">{ctrl.code} {ctrl.title}</p>
              </div>
              <span className="text-[9px] text-slate-500 hidden sm:block">{fw?.shortName}</span>
              <span className="text-[9px] text-slate-600">{ctrl.evidenceCount} evidence</span>
              <span className={`text-[9px] font-medium ${cfg.color}`}>{cfg.label}</span>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Panel: Reports
// ---------------------------------------------------------------------------

function ReportsPanel() {
  const { reports } = demoTenant;

  const statusConfig: Record<string, { color: string; icon: React.ReactNode }> = {
    ready: { color: 'text-emerald-400', icon: <Check className="h-2.5 w-2.5 text-emerald-400" /> },
    generating: { color: 'text-amber-400', icon: <Clock className="h-2.5 w-2.5 text-amber-400 animate-spin" /> },
    draft: { color: 'text-slate-400', icon: <FileText className="h-2.5 w-2.5 text-slate-400" /> },
    exported: { color: 'text-blue-400', icon: <Check className="h-2.5 w-2.5 text-blue-400" /> },
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
      <motion.div variants={fadeUp} className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-pink-400" />
        <h2 className="text-sm font-semibold text-white">Reports</h2>
        <span className="text-[10px] text-slate-500">{reports.length} reports</span>
      </motion.div>

      <div className="space-y-2">
        {reports.map((report) => {
          const cfg = statusConfig[report.status];
          return (
            <motion.div
              key={report.id}
              variants={fadeUp}
              className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 hover:bg-white/[0.04] transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-white truncate">{report.name}</p>
                  <p className="text-[9px] text-slate-500">
                    {report.pages > 0 ? `${report.pages} pages` : 'Not generated'}{' '}
                    {report.generatedAt && `· ${report.generatedAt}`}
                  </p>
                </div>
                <span className={`text-[9px] font-medium ${cfg.color}`}>{report.status}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
