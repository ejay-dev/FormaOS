'use client';

import { motion } from 'framer-motion';
import { Eye, TrendingDown, TrendingUp, ShieldCheck, AlertTriangle, XCircle, Activity } from 'lucide-react';
import { easing, duration } from '@/config/motion';
import { validateControlChecks, validateRiskIndicators, validateAuditEntries } from '../phase-demo-data';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.signature } },
};

function AnimatedNumber({ value, delay }: { value: number; delay: number }) {
  return (
    <motion.span
      className="text-lg font-bold text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
    >
      {value}
    </motion.span>
  );
}

const statusConfig = {
  verified: { icon: ShieldCheck, color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Verified' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Warning' },
  failed: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Failed' },
} as const;

export default function ValidateScreen() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
      {/* Risk Indicator Cards */}
      <div className="grid grid-cols-3 gap-2">
        {validateRiskIndicators.map((indicator, i) => {
          const colorMap: Record<string, { text: string; bg: string }> = {
            red: { text: 'text-red-400', bg: 'bg-red-500/15' },
            amber: { text: 'text-amber-400', bg: 'bg-amber-500/15' },
            emerald: { text: 'text-emerald-400', bg: 'bg-emerald-500/15' },
          };
          const colors = colorMap[indicator.color];
          const TrendIcon = indicator.trend === 'down' ? TrendingDown : TrendingUp;
          const trendColor = indicator.color === 'emerald' ? 'text-emerald-400' : 'text-emerald-400';

          return (
            <motion.div
              key={indicator.label}
              variants={fadeUp}
              className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5"
            >
              <p className="text-[9px] text-slate-500 uppercase tracking-wider truncate">{indicator.label}</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <AnimatedNumber value={indicator.value} delay={0.6 + i * 0.2} />
                <span className={`flex items-center gap-0.5 text-[9px] ${trendColor}`}>
                  <TrendIcon className="h-2.5 w-2.5" />
                  <span>{indicator.trend === 'down' ? '↓' : '↑'}</span>
                </span>
              </div>
              <motion.div
                className={`mt-1.5 h-1 rounded-full ${colors.bg}`}
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.8 + i * 0.2, duration: 0.6, ease: easing.signature }}
              >
                <motion.div
                  className={`h-full rounded-full ${indicator.color === 'emerald' ? 'bg-emerald-400' : indicator.color === 'amber' ? 'bg-amber-400' : 'bg-red-400'}`}
                  initial={{ width: 0 }}
                  animate={{ width: indicator.color === 'emerald' ? '97%' : indicator.color === 'amber' ? '40%' : '10%' }}
                  transition={{ delay: 1.0 + i * 0.2, duration: 0.6, ease: easing.signature }}
                />
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Control Verification */}
      <motion.div variants={fadeUp} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Eye className="h-3 w-3 text-purple-400" />
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Control Verification</span>
        </div>
        <div className="space-y-1.5">
          {validateControlChecks.map((check, i) => {
            const config = statusConfig[check.status];
            const StatusIcon = config.icon;
            return (
              <motion.div
                key={check.control}
                className="flex items-center gap-2 text-[10px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 + i * 0.4, duration: 0.4, ease: easing.signature }}
              >
                <motion.div
                  className={`h-5 w-5 rounded-md flex items-center justify-center flex-shrink-0 ${config.bg}`}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.8 + i * 0.4, duration: 0.3, type: 'spring' }}
                >
                  <StatusIcon className={`h-2.5 w-2.5 ${config.color}`} />
                </motion.div>
                <span className="text-slate-300 truncate flex-1">{check.control}</span>
                <span className="text-[9px] text-slate-500 flex-shrink-0 hidden sm:block">{check.framework}</span>
                <span className="text-[9px] text-slate-500 flex-shrink-0">
                  {check.evidenceCount} evidence
                </span>
                <span className={`text-[9px] font-medium ${config.color} flex-shrink-0`}>{config.label}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Live Audit Trail */}
      <motion.div variants={fadeUp} className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Activity className="h-3 w-3 text-cyan-400" />
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Live Audit Trail</span>
          <motion.div
            className="ml-auto flex items-center gap-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[9px] text-emerald-400">Live</span>
          </motion.div>
        </div>
        <div className="space-y-1.5">
          {validateAuditEntries.map((entry, i) => {
            const typeColor: Record<string, string> = {
              compliance: 'text-amber-400',
              evidence: 'text-blue-400',
              task: 'text-emerald-400',
            };
            return (
              <motion.div
                key={entry.id}
                className="flex items-center gap-2 text-[10px]"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3.5 + i * 0.3, duration: 0.4, ease: easing.signature }}
              >
                <span className={`flex-shrink-0 ${typeColor[entry.type] || 'text-slate-400'}`}>●</span>
                <span className="text-slate-300 truncate flex-1">
                  <span className="font-medium text-white">{entry.user}</span>{' '}
                  {entry.action.toLowerCase()}{' '}
                  <span className="text-slate-400">{entry.target}</span>
                </span>
                <span className="text-slate-600 flex-shrink-0 text-[9px]">{entry.timestamp}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
