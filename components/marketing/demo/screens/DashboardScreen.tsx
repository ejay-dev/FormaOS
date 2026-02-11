'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Minus, Activity, Shield, AlertTriangle } from 'lucide-react';
import { demoOrg, demoKpis, demoFrameworks, demoAuditLog } from '../demo-data';
import { easing, duration } from '@/config/motion';

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: duration.normal, ease: easing.signature } },
};

function ComplianceRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-24 w-24 flex-shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <motion.circle
          cx="40" cy="40" r="36" fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: easing.signature, delay: 0.3 }}
        />
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-xl font-bold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {score}%
        </motion.span>
        <span className="text-[8px] text-slate-500 uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
}

export default function DashboardScreen() {
  const trendIcons = {
    up: <TrendingUp className="h-2.5 w-2.5 text-emerald-400" />,
    neutral: <Minus className="h-2.5 w-2.5 text-slate-500" />,
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-3">
      {/* Top row: Compliance Score + KPIs */}
      <div className="flex gap-3">
        {/* Compliance Score Card */}
        <motion.div
          variants={fadeUp}
          className="flex items-center gap-3 rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 flex-shrink-0"
        >
          <ComplianceRing score={demoOrg.complianceScore} />
          <div className="min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Compliance</p>
            <p className="text-xs font-semibold text-white">
              {demoOrg.compliantControls}/{demoOrg.totalControls} controls
            </p>
            <p className="text-[10px] text-emerald-400 mt-0.5">+3% this month</p>
          </div>
        </motion.div>

        {/* KPI Cards */}
        <div className="flex-1 grid grid-cols-2 gap-2 min-w-0">
          {demoKpis.map((kpi) => (
            <motion.div
              key={kpi.label}
              variants={fadeUp}
              className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5"
            >
              <p className="text-[9px] text-slate-500 uppercase tracking-wider truncate">{kpi.label}</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-lg font-bold text-white">{kpi.value}</span>
                <span className="flex items-center gap-0.5 text-[9px]">
                  {trendIcons[kpi.trend]}
                  <span className={kpi.trend === 'up' ? 'text-emerald-400' : 'text-slate-500'}>
                    {kpi.change}
                  </span>
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Framework Health */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3"
      >
        <div className="flex items-center gap-1.5 mb-2.5">
          <Shield className="h-3 w-3 text-cyan-400" />
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Framework Health</span>
        </div>
        <div className="space-y-2">
          {demoFrameworks.map((fw, i) => (
            <div key={fw.name} className="flex items-center gap-2.5">
              <span className="text-[10px] text-slate-400 w-16 truncate">{fw.name}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: fw.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${fw.score}%` }}
                  transition={{ duration: 0.8, ease: easing.signature, delay: 0.4 + i * 0.1 }}
                />
              </div>
              <span className="text-[10px] font-medium text-slate-300 w-8 text-right">{fw.score}%</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Activity Feed */}
      <motion.div
        variants={fadeUp}
        className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3"
      >
        <div className="flex items-center gap-1.5 mb-2.5">
          <Activity className="h-3 w-3 text-cyan-400" />
          <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">Recent Activity</span>
        </div>
        <div className="space-y-1.5">
          {demoAuditLog.slice(0, 5).map((entry) => {
            const typeColor = {
              policy: 'text-cyan-400',
              evidence: 'text-blue-400',
              task: 'text-emerald-400',
              user: 'text-purple-400',
              system: 'text-slate-400',
              compliance: 'text-amber-400',
            }[entry.type];

            return (
              <div key={entry.id} className="flex items-center gap-2 text-[10px]">
                <span className={`flex-shrink-0 ${typeColor}`}>●</span>
                <span className="text-slate-300 truncate flex-1">
                  <span className="font-medium text-white">{entry.user}</span>{' '}
                  {entry.action.toLowerCase()}{' '}
                  <span className="text-slate-400">{entry.target}</span>
                </span>
                <span className="text-slate-600 flex-shrink-0 text-[9px]">{entry.timestamp}</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
