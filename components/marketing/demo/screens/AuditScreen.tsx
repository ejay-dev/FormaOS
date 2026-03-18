'use client';

import { motion } from 'framer-motion';
import { History, Shield, FileText, Upload, CheckSquare, Users, Settings } from 'lucide-react';
import { demoAuditLog } from '../demo-data';
import { easing, duration } from '@/config/motion';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: duration.fast, ease: easing.signature } },
};

const typeConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  policy: { color: 'text-cyan-400 bg-cyan-500/15', icon: FileText },
  evidence: { color: 'text-blue-400 bg-blue-500/15', icon: Upload },
  task: { color: 'text-emerald-400 bg-emerald-500/15', icon: CheckSquare },
  user: { color: 'text-purple-400 bg-purple-500/15', icon: Users },
  system: { color: 'text-slate-400 bg-slate-500/15', icon: Settings },
  compliance: { color: 'text-amber-400 bg-amber-500/15', icon: Shield },
};

export default function AuditScreen() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-cyan-400" />
          <h2 className="text-sm font-semibold text-white">Audit Trail</h2>
          <span className="text-[10px] text-slate-500">{demoAuditLog.length} entries</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] text-emerald-400 font-medium">
            Immutable
          </span>
          <span className="rounded-full bg-white/[0.04] px-2 py-0.5 text-[9px] text-slate-400">
            Export CSV
          </span>
        </div>
      </motion.div>

      {/* Timeline table */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden"
      >
        {/* Header */}
        <div className="grid grid-cols-[28px_1fr_100px_70px] gap-2 px-3 py-2 bg-white/[0.02] border-b border-white/[0.06] text-[9px] font-semibold text-slate-500 uppercase tracking-wider">
          <span></span>
          <span>Event</span>
          <span>User</span>
          <span>Time</span>
        </div>

        {/* Rows */}
        {demoAuditLog.map((entry) => {
          const config = typeConfig[entry.type] || typeConfig.system;
          const Icon = config.icon;

          return (
            <motion.div
              key={entry.id}
              variants={fadeUp}
              className="grid grid-cols-[28px_1fr_100px_70px] gap-2 px-3 py-2 items-center border-b border-white/[0.03] text-[10px] hover:bg-white/[0.02] transition-colors"
            >
              <div className={`h-5 w-5 rounded flex items-center justify-center ${config.color}`}>
                <Icon className="h-2.5 w-2.5" />
              </div>
              <div className="min-w-0">
                <span className="text-slate-300 truncate block">
                  {entry.action}
                </span>
                <span className="text-[9px] text-slate-500 truncate block">{entry.target}</span>
              </div>
              <span className="text-slate-400 truncate">{entry.user}</span>
              <span className="text-slate-500 text-[9px]">{entry.timestamp}</span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Integrity notice */}
      <motion.div
        variants={fadeUp}
        className="flex items-center gap-2 rounded-xl bg-white/[0.02] border border-white/[0.06] px-3 py-2"
      >
        <Shield className="h-3 w-3 text-emerald-400 flex-shrink-0" />
        <span className="text-[10px] text-slate-400">
          All entries are cryptographically timestamped and tamper-evident. Audit trail cannot be modified or deleted.
        </span>
      </motion.div>
    </motion.div>
  );
}
