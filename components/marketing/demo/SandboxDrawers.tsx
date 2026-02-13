'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckSquare, Clock, AlertTriangle, Circle, Check,
  FileText, Shield, Lock, Upload, Activity, ArrowRight,
  Zap, User, Calendar, Tag, ExternalLink, FileCheck,
} from 'lucide-react';
import { easing, duration } from '@/config/motion';
import { demoTenant, resolveUserName, resolveFramework } from './demo-tenant-seed';
import type { TenantTask, TenantEvidence, TenantAuditEntry } from './demo-tenant-seed';
import { trackDemoEvent } from './demo-analytics';

// ---------------------------------------------------------------------------
// Shared drawer shell
// ---------------------------------------------------------------------------

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function DrawerShell({ isOpen, onClose, title, icon, children }: DrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 z-30 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          {/* Drawer panel */}
          <motion.div
            className="absolute right-0 top-0 bottom-0 z-40 w-[85%] sm:w-[70%] md:w-[55%] lg:w-[45%] bg-[#0b1022] border-l border-white/[0.08] shadow-[0_0_60px_rgba(0,0,0,0.5)] overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: duration.normal, ease: easing.signature }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between bg-[#0b1022]/95 backdrop-blur-md border-b border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                {icon}
                <h3 className="text-sm font-semibold text-white">{title}</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="h-6 w-6 rounded-md flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
              >
                <X className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
            {/* Content */}
            <div className="p-4 space-y-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Shared mini-components
// ---------------------------------------------------------------------------

function AvatarBadge({ name, size = 'sm' }: { name: string; size?: 'sm' | 'md' }) {
  const initials = name.split(' ').map((n) => n[0]).join('');
  const sizeClass = size === 'md' ? 'h-8 w-8 text-[10px]' : 'h-5 w-5 text-[7px]';
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0`}>
      <span className="font-bold text-slate-200">{initials}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: 'bg-emerald-500/15 text-emerald-400',
    'in-progress': 'bg-blue-500/15 text-blue-400',
    overdue: 'bg-red-500/15 text-red-400',
    pending: 'bg-slate-500/15 text-slate-400',
    approved: 'bg-emerald-500/15 text-emerald-400',
    'pending-review': 'bg-amber-500/15 text-amber-400',
    rejected: 'bg-red-500/15 text-red-400',
    expired: 'bg-slate-500/15 text-slate-400',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status] || 'bg-slate-500/15 text-slate-400'}`}>
      {status.replace('-', ' ')}
    </span>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="flex items-center gap-1.5 text-slate-500">
        {icon}
        {label}
      </span>
      <span className="text-slate-300">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Task Detail Drawer
// ---------------------------------------------------------------------------

export function TaskDetailDrawer({
  task,
  isOpen,
  onClose,
  onAction,
}: {
  task: TenantTask | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}) {
  if (!task) return null;

  const framework = resolveFramework(task.frameworkId);
  const assigneeName = resolveUserName(task.assigneeId);
  const control = demoTenant.controls.find((c) => c.id === task.controlId);
  const linkedEvidence = demoTenant.evidence.filter((e) =>
    e.controlIds.includes(task.controlId),
  );

  const TaskStatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case 'completed': return <Check className="h-3 w-3 text-emerald-400" />;
      case 'in-progress': return <Clock className="h-3 w-3 text-blue-400" />;
      case 'overdue': return <AlertTriangle className="h-3 w-3 text-red-400" />;
      default: return <Circle className="h-3 w-3 text-slate-500" />;
    }
  };

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      title="Task Detail"
      icon={<CheckSquare className="h-4 w-4 text-blue-400" />}
    >
      {/* Task header */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
        <div className="flex items-start gap-3 mb-3">
          <TaskStatusIcon status={task.status} />
          <div className="flex-1">
            <h4 className="text-[13px] font-semibold text-white mb-1">{task.title}</h4>
            <StatusBadge status={task.status} />
          </div>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">{task.description}</p>
      </div>

      {/* Metadata */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-2.5">
        <InfoRow label="Assignee" value={assigneeName} icon={<User className="h-3 w-3" />} />
        <InfoRow label="Priority" value={task.priority} icon={<Tag className="h-3 w-3" />} />
        <InfoRow label="Due Date" value={task.due} icon={<Calendar className="h-3 w-3" />} />
        <InfoRow label="Framework" value={framework?.name ?? '—'} icon={<Shield className="h-3 w-3" />} />
        {control && <InfoRow label="Control" value={`${control.code} ${control.title}`} icon={<Lock className="h-3 w-3" />} />}
      </div>

      {/* Linked Evidence */}
      {linkedEvidence.length > 0 && (
        <div>
          <h5 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Linked Evidence</h5>
          <div className="space-y-1.5">
            {linkedEvidence.map((ev) => (
              <div key={ev.id} className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2 text-[11px]">
                <FileText className="h-3 w-3 text-purple-400 flex-shrink-0" />
                <span className="text-slate-300 truncate flex-1">{ev.name}</span>
                <StatusBadge status={ev.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {task.status === 'pending' && (
          <button
            type="button"
            onClick={() => onAction('start')}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-blue-500/15 border border-blue-500/25 px-3 py-2 text-[11px] font-medium text-blue-300 hover:bg-blue-500/25 transition-colors"
          >
            <ArrowRight className="h-3 w-3" /> Start Task
          </button>
        )}
        {task.status === 'in-progress' && (
          <button
            type="button"
            onClick={() => onAction('complete')}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 px-3 py-2 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/25 transition-colors"
          >
            <Check className="h-3 w-3" /> Mark Complete
          </button>
        )}
        {task.status === 'overdue' && (
          <button
            type="button"
            onClick={() => onAction('escalate')}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-500/15 border border-red-500/25 px-3 py-2 text-[11px] font-medium text-red-300 hover:bg-red-500/25 transition-colors"
          >
            <Zap className="h-3 w-3" /> Escalate
          </button>
        )}
        <button
          type="button"
          onClick={() => onAction('upload-evidence')}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
        >
          <Upload className="h-3 w-3" /> Attach Evidence
        </button>
      </div>
    </DrawerShell>
  );
}

// ---------------------------------------------------------------------------
// Evidence Detail Drawer
// ---------------------------------------------------------------------------

export function EvidenceDetailDrawer({
  evidence,
  isOpen,
  onClose,
  onAction,
}: {
  evidence: TenantEvidence | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (action: string) => void;
}) {
  if (!evidence) return null;

  const uploaderName = resolveUserName(evidence.uploadedById);
  const linkedControls = demoTenant.controls.filter((c) =>
    evidence.controlIds.includes(c.id),
  );

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      title="Evidence Detail"
      icon={<Lock className="h-4 w-4 text-purple-400" />}
    >
      {/* Evidence header */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
            <FileText className="h-5 w-5 text-purple-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-[13px] font-semibold text-white mb-1">{evidence.name}</h4>
            <StatusBadge status={evidence.status} />
          </div>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">{evidence.description}</p>
      </div>

      {/* Metadata */}
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-2.5">
        <InfoRow label="Category" value={evidence.category} icon={<Tag className="h-3 w-3" />} />
        <InfoRow label="Uploaded By" value={uploaderName} icon={<User className="h-3 w-3" />} />
        <InfoRow label="Upload Date" value={evidence.date} icon={<Calendar className="h-3 w-3" />} />
        <InfoRow label="File Size" value={evidence.size} icon={<FileText className="h-3 w-3" />} />
        <InfoRow label="Hash" value={evidence.hash} icon={<Lock className="h-3 w-3" />} />
      </div>

      {/* Linked Controls */}
      {linkedControls.length > 0 && (
        <div>
          <h5 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Linked Controls</h5>
          <div className="space-y-1.5">
            {linkedControls.map((ctrl) => {
              const fw = resolveFramework(ctrl.frameworkId);
              const statusColor = ctrl.status === 'compliant'
                ? 'text-emerald-400'
                : ctrl.status === 'partial'
                  ? 'text-amber-400'
                  : 'text-red-400';
              return (
                <div key={ctrl.id} className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.04] px-3 py-2 text-[11px]">
                  <Shield className={`h-3 w-3 ${statusColor} flex-shrink-0`} />
                  <span className="text-slate-300 truncate flex-1">{ctrl.code} {ctrl.title}</span>
                  <span className="text-[9px] text-slate-500">{fw?.shortName}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chain of custody */}
      <div className="rounded-xl bg-emerald-500/[0.04] border border-emerald-500/15 p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <FileCheck className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] font-semibold text-emerald-400">Chain of Custody Verified</span>
        </div>
        <p className="text-[10px] text-slate-500">
          Immutable record stored. Timestamp, uploader, hash, and linked controls logged to audit trail.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {evidence.status === 'pending-review' && (
          <>
            <button
              type="button"
              onClick={() => onAction('approve')}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 px-3 py-2 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/25 transition-colors"
            >
              <Check className="h-3 w-3" /> Approve
            </button>
            <button
              type="button"
              onClick={() => onAction('reject')}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-red-500/15 border border-red-500/25 px-3 py-2 text-[11px] font-medium text-red-300 hover:bg-red-500/25 transition-colors"
            >
              <X className="h-3 w-3" /> Reject
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onAction('view-audit-trail')}
          className="flex items-center justify-center gap-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] px-3 py-2 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
        >
          <ExternalLink className="h-3 w-3" /> Audit Trail
        </button>
      </div>
    </DrawerShell>
  );
}

// ---------------------------------------------------------------------------
// Audit Timeline Drawer
// ---------------------------------------------------------------------------

export function AuditTimelineDrawer({
  isOpen,
  onClose,
  filter,
}: {
  isOpen: boolean;
  onClose: () => void;
  filter?: string;
}) {
  const entries = filter
    ? demoTenant.auditLog.filter((e) => e.targetType === filter)
    : demoTenant.auditLog;

  const typeColors: Record<string, string> = {
    policy: 'text-cyan-400 bg-cyan-400/10',
    evidence: 'text-blue-400 bg-blue-400/10',
    task: 'text-emerald-400 bg-emerald-400/10',
    user: 'text-purple-400 bg-purple-400/10',
    framework: 'text-amber-400 bg-amber-400/10',
    system: 'text-slate-400 bg-slate-400/10',
    control: 'text-pink-400 bg-pink-400/10',
    report: 'text-indigo-400 bg-indigo-400/10',
  };

  const typeIcons: Record<string, React.ReactNode> = {
    policy: <FileText className="h-3 w-3" />,
    evidence: <Lock className="h-3 w-3" />,
    task: <CheckSquare className="h-3 w-3" />,
    user: <User className="h-3 w-3" />,
    framework: <Shield className="h-3 w-3" />,
    system: <Zap className="h-3 w-3" />,
  };

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Timeline"
      icon={<Activity className="h-4 w-4 text-cyan-400" />}
    >
      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {['all', 'policy', 'evidence', 'task', 'system'].map((f) => (
          <span
            key={f}
            className={`rounded-full px-2 py-0.5 text-[9px] font-medium cursor-pointer transition-colors ${
              (filter ?? 'all') === f
                ? 'bg-white/[0.08] text-white'
                : 'bg-white/[0.03] text-slate-500 hover:text-slate-300'
            }`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </span>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-0 bottom-0 w-px bg-white/[0.06]" />

        <div className="space-y-0.5">
          {entries.map((entry, i) => {
            const colors = typeColors[entry.targetType] || typeColors.system;
            const [colorText] = colors.split(' ');
            const icon = typeIcons[entry.targetType] || <Activity className="h-3 w-3" />;

            return (
              <motion.div
                key={entry.id}
                className="relative flex gap-3 pl-0 py-2"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
              >
                {/* Timeline dot */}
                <div className={`relative z-10 h-[22px] w-[22px] rounded-full flex items-center justify-center flex-shrink-0 ${colors}`}>
                  {icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-slate-300">
                    <span className="font-medium text-white">{resolveUserName(entry.userId)}</span>{' '}
                    {entry.action.toLowerCase()}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{entry.targetName}</div>
                  <div className="text-[9px] text-slate-600 mt-0.5">{entry.timestamp}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Immutability notice */}
      <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Shield className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] font-semibold text-emerald-400">Immutable Audit Log</span>
        </div>
        <p className="text-[9px] text-slate-500">
          All entries are tamper-proof, timestamped, and cryptographically linked. Full chain of custody maintained.
        </p>
      </div>
    </DrawerShell>
  );
}

// ---------------------------------------------------------------------------
// Workflow Trigger Action Drawer
// ---------------------------------------------------------------------------

export function WorkflowActionDrawer({
  isOpen,
  onClose,
  onFire,
}: {
  isOpen: boolean;
  onClose: () => void;
  onFire: (triggerId: string) => void;
}) {
  const triggers = demoTenant.workflowTriggers;

  const typeIcons: Record<string, React.ReactNode> = {
    'evidence-expiry': <Clock className="h-3.5 w-3.5 text-amber-400" />,
    'control-failure': <AlertTriangle className="h-3.5 w-3.5 text-red-400" />,
    'task-overdue': <CheckSquare className="h-3.5 w-3.5 text-blue-400" />,
    'policy-review-due': <FileText className="h-3.5 w-3.5 text-purple-400" />,
    'cert-expiring': <Shield className="h-3.5 w-3.5 text-cyan-400" />,
  };

  return (
    <DrawerShell
      isOpen={isOpen}
      onClose={onClose}
      title="Workflow Triggers"
      icon={<Zap className="h-4 w-4 text-blue-400" />}
    >
      <p className="text-[11px] text-slate-400">
        Manually fire workflow triggers to see how FormaOS automates compliance responses.
      </p>

      <div className="space-y-2">
        {triggers.map((trigger, i) => (
          <motion.div
            key={trigger.id}
            className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <div className="flex items-start gap-3 mb-2">
              <div className="h-8 w-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                {typeIcons[trigger.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-white">{trigger.name}</p>
                <p className="text-[10px] text-slate-500">{trigger.targetName}</p>
              </div>
              <div className={`h-2 w-2 rounded-full flex-shrink-0 mt-1.5 ${trigger.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>
            <p className="text-[10px] text-slate-400 mb-2.5">{trigger.action}</p>
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-slate-600">
                {trigger.lastFired ? `Last fired: ${trigger.lastFired}` : 'Never fired'}
              </span>
              <button
                type="button"
                onClick={() => {
                  trackDemoEvent({ type: 'demo_sandbox_action', action: 'fire_trigger', target: trigger.id, phase: 'operationalize' });
                  onFire(trigger.id);
                }}
                className="flex items-center gap-1 rounded-md bg-blue-500/15 border border-blue-500/25 px-2 py-1 text-[10px] font-medium text-blue-300 hover:bg-blue-500/25 transition-colors"
              >
                <Zap className="h-2.5 w-2.5" /> Fire Trigger
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </DrawerShell>
  );
}
