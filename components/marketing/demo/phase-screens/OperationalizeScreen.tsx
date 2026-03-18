'use client';

import { motion } from 'framer-motion';
import { Zap, Clock, AlertTriangle, Bell, ArrowRight, FileCheck, Upload } from 'lucide-react';
import { easing, duration } from '@/config/motion';
import { operationalizeWorkflowTriggers, operationalizeTaskAssignments, operationalizeEvidenceUpload } from '../phase-demo-data';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.signature } },
};

const triggerIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Clock,
  AlertTriangle,
  Bell,
};

function AvatarBadge({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('');
  return (
    <div className="h-5 w-5 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center flex-shrink-0">
      <span className="text-[7px] font-bold text-slate-200">{initials}</span>
    </div>
  );
}

export default function OperationalizeScreen() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
      {/* Workflow Triggers */}
      <motion.div variants={fadeUp} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Zap className="h-3 w-3 text-blue-400" />
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Workflow Triggers</span>
          <motion.span
            className="ml-auto text-[9px] text-emerald-400 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.5 }}
          >
            3 fired
          </motion.span>
        </div>
        <div className="space-y-2">
          {operationalizeWorkflowTriggers.map((trigger, i) => {
            const Icon = triggerIcons[trigger.iconName];
            const colors = ['text-amber-400 bg-amber-400/10', 'text-red-400 bg-red-400/10', 'text-blue-400 bg-blue-400/10'];
            return (
              <motion.div
                key={trigger.trigger}
                className="flex items-center gap-2 text-[10px]"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.8, duration: 0.5, ease: easing.signature }}
              >
                <motion.div
                  className={`h-6 w-6 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[i]}`}
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ delay: 0.8 + i * 0.8, duration: 0.4 }}
                >
                  <Icon className="h-3 w-3" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <span className="text-slate-300 font-medium">{trigger.trigger}</span>
                  <span className="text-slate-500 mx-1">→</span>
                  <span className="text-slate-400 truncate">{trigger.target}</span>
                </div>
                <motion.span
                  className="flex items-center gap-0.5 text-[9px] text-emerald-400 flex-shrink-0"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.0 + i * 0.8, duration: 0.3 }}
                >
                  <ArrowRight className="h-2 w-2" />
                  {trigger.action}
                </motion.span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Task Auto-Assignment */}
      <motion.div variants={fadeUp} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Task Assignments</span>
          <motion.span
            className="ml-auto text-[9px] text-blue-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1] }}
            transition={{ delay: 3.0, duration: 0.5 }}
          >
            Auto-assigned
          </motion.span>
        </div>
        <div className="space-y-1.5">
          {operationalizeTaskAssignments.map((task, i) => {
            const priorityStyles: Record<string, string> = {
              high: 'bg-red-500/15 text-red-400',
              medium: 'bg-amber-500/15 text-amber-400',
            };
            return (
              <motion.div
                key={task.id}
                className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.04] px-2.5 py-1.5 text-[10px]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.0 + i * 0.7, duration: 0.5, ease: easing.signature }}
              >
                <motion.div
                  className="h-1.5 w-1.5 rounded-full bg-slate-600 flex-shrink-0"
                  animate={{ backgroundColor: ['rgb(71,85,105)', 'rgb(71,85,105)', 'rgb(59,130,246)'] }}
                  transition={{ delay: 3.4 + i * 0.7, duration: 0.4 }}
                />
                <span className="text-slate-200 truncate flex-1">{task.title}</span>
                <span className={`hidden sm:inline-flex items-center rounded px-1 py-0.5 text-[8px] font-medium uppercase ${priorityStyles[task.priority]}`}>
                  {task.priority}
                </span>
                <motion.div
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 3.6 + i * 0.7, duration: 0.3 }}
                >
                  <AvatarBadge name={task.assignee} />
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Evidence Upload */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3"
      >
        <div className="flex items-center gap-1.5 mb-2.5">
          <Upload className="h-3 w-3 text-purple-400" />
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Evidence Upload</span>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-white truncate">{operationalizeEvidenceUpload.name}</p>
            <p className="text-[9px] text-slate-500">{operationalizeEvidenceUpload.category} · {operationalizeEvidenceUpload.size}</p>
            {/* Progress bar */}
            <div className="mt-2 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 5.5, duration: 1.5, ease: easing.smooth }}
              />
            </div>
            {/* Verified message */}
            <motion.div
              className="flex items-center gap-1 mt-1.5 text-[9px] text-emerald-400"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 7.2, duration: 0.3 }}
            >
              <FileCheck className="h-2.5 w-2.5" />
              <span>Upload verified — chain of custody recorded</span>
            </motion.div>
          </div>
          <motion.div
            className="flex-shrink-0 h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center"
            animate={{ borderColor: ['rgba(139,92,246,0.2)', 'rgba(139,92,246,0.2)', 'rgba(16,185,129,0.3)'] }}
            transition={{ delay: 7.0, duration: 0.5 }}
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 0, 360] }}
              transition={{ delay: 5.5, duration: 1.5, ease: 'linear' }}
            >
              <Upload className="h-4 w-4 text-purple-400" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
