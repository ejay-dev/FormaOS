'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  History, FileText, Upload, CheckSquare, Users, Shield, Settings,
} from 'lucide-react';
import { easing, duration } from '@/config/motion';

/**
 * DemoAuditTrailCard — Compact audit log timeline.
 * Shows recent entries with colored type indicators.
 */

interface AuditEntry {
  action: string;
  user: string;
  target: string;
  time: string;
  type: 'policy' | 'evidence' | 'task' | 'user' | 'system' | 'compliance';
}

const typeConfig: Record<string, { color: string; icon: React.ComponentType<{ className?: string }> }> = {
  policy: { color: 'text-cyan-400 bg-cyan-500/15', icon: FileText },
  evidence: { color: 'text-blue-400 bg-blue-500/15', icon: Upload },
  task: { color: 'text-emerald-400 bg-emerald-500/15', icon: CheckSquare },
  user: { color: 'text-purple-400 bg-purple-500/15', icon: Users },
  system: { color: 'text-slate-400 bg-slate-500/15', icon: Settings },
  compliance: { color: 'text-amber-400 bg-amber-500/15', icon: Shield },
};

const defaultEntries: AuditEntry[] = [
  { action: 'Policy approved', user: 'Sarah Chen', target: 'InfoSec Policy', time: '09:14', type: 'policy' },
  { action: 'Evidence uploaded', user: 'Marcus Rivera', target: 'Pen Test Q1', time: '08:42', type: 'evidence' },
  { action: 'Task completed', user: 'Marcus Rivera', target: 'Upload results', time: '08:38', type: 'task' },
  { action: 'Compliance updated', user: 'System', target: 'ISO 27001 — 91%', time: '07:00', type: 'compliance' },
  { action: 'Policy submitted', user: 'Marcus Rivera', target: 'Access Control', time: '06:12', type: 'policy' },
  { action: 'Task overdue', user: 'System', target: 'IR playbook update', time: '06:00', type: 'task' },
];

interface DemoAuditTrailCardProps {
  entries?: AuditEntry[];
  maxVisible?: number;
  glowColor?: string;
}

export default function DemoAuditTrailCard({
  entries = defaultEntries,
  maxVisible = 6,
  glowColor = 'from-cyan-500/15 to-blue-500/15',
}: DemoAuditTrailCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="relative">
      <div className={`absolute -inset-px rounded-2xl bg-gradient-to-b ${glowColor} blur-sm`} />

      <div className="relative rounded-2xl border border-white/[0.08] bg-[#0b1022] p-4 sm:p-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <History className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Audit Trail</span>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] text-emerald-400 font-medium">
            Immutable
          </span>
        </div>

        {/* Entries */}
        <div className="space-y-1">
          {entries.slice(0, maxVisible).map((entry, i) => {
            const config = typeConfig[entry.type] || typeConfig.system;
            const Icon = config.icon;

            return (
              <motion.div
                key={`${entry.action}-${i}`}
                initial={prefersReducedMotion ? undefined : { opacity: 0, x: -8 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: duration.fast, ease: easing.signature, delay: i * 0.04 }}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className={`h-5 w-5 rounded flex items-center justify-center flex-shrink-0 ${config.color}`}>
                  <Icon className="h-2.5 w-2.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-slate-300 block truncate">{entry.action}</span>
                  <span className="text-[9px] text-slate-500 block truncate">{entry.target}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[9px] text-slate-500 block">{entry.user.split(' ')[0]}</span>
                  <span className="text-[8px] text-slate-600 block">{entry.time}</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/[0.04]">
          <Shield className="h-3 w-3 text-emerald-400" />
          <span className="text-[9px] text-slate-500">Cryptographically timestamped • Tamper-evident</span>
        </div>
      </div>
    </div>
  );
}
