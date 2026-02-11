'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { TrendingUp, Shield, Activity } from 'lucide-react';
import { easing } from '@/config/motion';

/**
 * DemoDashboardPreview — Mini compliance dashboard KPI card.
 * Shows score ring, framework bars, and key metrics.
 * Lighter-weight than the full InteractiveDemo.
 */

interface DemoDashboardPreviewProps {
  complianceScore?: number;
  frameworks?: { name: string; score: number; color: string }[];
  kpis?: { label: string; value: string | number; trend: 'up' | 'neutral' }[];
  glowColor?: string;
}

const defaultFrameworks = [
  { name: 'ISO 27001', score: 91, color: '#06b6d4' },
  { name: 'SOC 2', score: 84, color: '#3b82f6' },
  { name: 'HIPAA', score: 88, color: '#8b5cf6' },
];

const defaultKpis = [
  { label: 'Controls', value: 124, trend: 'up' as const },
  { label: 'Tasks', value: 8, trend: 'up' as const },
  { label: 'Evidence', value: 47, trend: 'up' as const },
  { label: 'Team', value: 6, trend: 'neutral' as const },
];

export default function DemoDashboardPreview({
  complianceScore = 87,
  frameworks = defaultFrameworks,
  kpis = defaultKpis,
  glowColor = 'from-cyan-500/15 to-blue-500/15',
}: DemoDashboardPreviewProps) {
  const prefersReducedMotion = useReducedMotion();
  const circumference = 2 * Math.PI * 32;
  const offset = circumference - (complianceScore / 100) * circumference;

  return (
    <div className="relative">
      <div className={`absolute -inset-px rounded-2xl bg-gradient-to-b ${glowColor} blur-sm`} />

      <div className="relative rounded-2xl border border-white/[0.08] bg-[#0b1022] p-4 sm:p-5 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <span className="text-[7px] font-bold text-white">F</span>
            </div>
            <span className="text-[10px] font-medium text-slate-400">Compliance Dashboard</span>
          </div>
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-emerald-400" />
            <span className="text-[9px] text-emerald-400">Live</span>
          </div>
        </div>

        {/* Score + KPIs row */}
        <div className="flex gap-3 mb-4">
          {/* Score ring */}
          <div className="relative h-[72px] w-[72px] flex-shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <motion.circle
                cx="36" cy="36" r="32" fill="none"
                stroke="url(#dashGrad)"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: prefersReducedMotion ? offset : circumference }}
                whileInView={{ strokeDashoffset: offset }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: easing.signature, delay: 0.2 }}
              />
              <defs>
                <linearGradient id="dashGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold text-white">{complianceScore}%</span>
              <span className="text-[7px] text-slate-500 uppercase">Score</span>
            </div>
          </div>

          {/* KPI grid */}
          <div className="flex-1 grid grid-cols-2 gap-1.5">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-2 py-1.5">
                <p className="text-[8px] text-slate-500 uppercase">{kpi.label}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold text-white">{kpi.value}</span>
                  {kpi.trend === 'up' && <TrendingUp className="h-2 w-2 text-emerald-400" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Framework bars */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Shield className="h-3 w-3 text-cyan-400" />
            <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Frameworks</span>
          </div>
          {frameworks.map((fw, i) => (
            <div key={fw.name} className="flex items-center gap-2">
              <span className="text-[9px] text-slate-400 w-14 truncate">{fw.name}</span>
              <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: fw.color }}
                  initial={{ width: prefersReducedMotion ? `${fw.score}%` : 0 }}
                  whileInView={{ width: `${fw.score}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: easing.signature, delay: 0.3 + i * 0.1 }}
                />
              </div>
              <span className="text-[9px] font-medium text-slate-300 w-7 text-right">{fw.score}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
