'use client';

import { motion } from 'framer-motion';
import { CheckSquare, Plus, Filter, AlertTriangle, Clock, Check, Circle } from 'lucide-react';
import { demoTasks, demoUsers } from '../demo-data';
import { easing, duration } from '@/config/motion';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: duration.fast, ease: easing.signature } },
};

function TaskStatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <Check className="h-2.5 w-2.5 text-emerald-400" />;
    case 'in-progress':
      return <Clock className="h-2.5 w-2.5 text-blue-400" />;
    case 'overdue':
      return <AlertTriangle className="h-2.5 w-2.5 text-red-400" />;
    default:
      return <Circle className="h-2.5 w-2.5 text-slate-500" />;
  }
}

function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    high: 'bg-red-500/15 text-red-400',
    medium: 'bg-amber-500/15 text-amber-400',
    low: 'bg-slate-500/15 text-slate-400',
  };
  return (
    <span className={`inline-flex items-center rounded px-1 py-0.5 text-[8px] font-medium uppercase ${styles[priority]}`}>
      {priority}
    </span>
  );
}

function AvatarBadge({ name }: { name: string }) {
  const initials = name.split(' ').map((n) => n[0]).join('');
  return (
    <div className="h-4.5 w-4.5 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center">
      <span className="text-[7px] font-bold text-slate-200">{initials}</span>
    </div>
  );
}

const statusOrder = ['overdue', 'in-progress', 'pending', 'completed'] as const;

export default function TasksScreen() {
  const grouped = statusOrder.map((status) => ({
    status,
    tasks: demoTasks.filter((t) => t.status === status),
  }));

  const statusLabels: Record<string, { label: string; color: string; count: number }> = {
    overdue: { label: 'Overdue', color: 'text-red-400', count: grouped.find(g => g.status === 'overdue')?.tasks.length || 0 },
    'in-progress': { label: 'In Progress', color: 'text-blue-400', count: grouped.find(g => g.status === 'in-progress')?.tasks.length || 0 },
    pending: { label: 'Pending', color: 'text-slate-400', count: grouped.find(g => g.status === 'pending')?.tasks.length || 0 },
    completed: { label: 'Completed', color: 'text-emerald-400', count: grouped.find(g => g.status === 'completed')?.tasks.length || 0 },
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Tasks</h2>
          <span className="text-[10px] text-slate-500">{demoTasks.length} total</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-1 text-[10px] text-slate-400 border border-white/[0.06]">
            <Filter className="h-2.5 w-2.5" />
            Filter
          </button>
          <button className="flex items-center gap-1 rounded-md bg-blue-500/20 px-2 py-1 text-[10px] text-blue-300 border border-blue-500/30">
            <Plus className="h-2.5 w-2.5" />
            New Task
          </button>
        </div>
      </motion.div>

      {/* Status summary bar */}
      <motion.div variants={fadeUp} className="flex gap-3">
        {statusOrder.map((status) => {
          const info = statusLabels[status];
          return (
            <div key={status} className="flex items-center gap-1.5 text-[10px]">
              <TaskStatusIcon status={status} />
              <span className={info.color}>{info.count}</span>
              <span className="text-slate-600">{info.label}</span>
            </div>
          );
        })}
      </motion.div>

      {/* Task list */}
      <motion.div variants={fadeUp} className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
        {demoTasks.map((task, i) => (
          <motion.div
            key={task.id}
            variants={fadeUp}
            className={`
              flex items-center gap-2.5 px-3 py-2 border-b border-white/[0.03] text-[10px]
              hover:bg-white/[0.02] transition-colors cursor-pointer
              ${task.status === 'overdue' ? 'bg-red-500/[0.03]' : ''}
              ${i === 5 ? 'ring-1 ring-blue-500/20' : ''}
            `}
          >
            <TaskStatusIcon status={task.status} />

            <div className="flex-1 min-w-0">
              <p className={`truncate font-medium ${task.status === 'completed' ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                {task.title}
              </p>
            </div>

            <span className="hidden sm:block text-[9px] text-slate-600 truncate max-w-[60px]">
              {task.framework}
            </span>

            <PriorityBadge priority={task.priority} />

            <div className="flex items-center gap-1">
              <AvatarBadge name={task.assignee} />
            </div>

            <span className={`text-[9px] flex-shrink-0 ${task.status === 'overdue' ? 'text-red-400' : 'text-slate-500'}`}>
              {task.due}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
