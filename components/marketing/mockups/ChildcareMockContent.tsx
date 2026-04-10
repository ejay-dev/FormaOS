'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface QualityArea {
  label: string;
  short: string;
  pct: number;
}

const NQF_AREAS: QualityArea[] = [
  { label: 'QA1: Educational Program', short: 'QA1', pct: 78 },
  { label: 'QA2: Children\'s Health', short: 'QA2', pct: 92 },
  { label: 'QA3: Physical Environment', short: 'QA3', pct: 85 },
  { label: 'QA4: Staffing Arrangements', short: 'QA4', pct: 71 },
  { label: 'QA5: Relationships with Children', short: 'QA5', pct: 88 },
  { label: 'QA6: Collaborative Partnerships', short: 'QA6', pct: 65 },
  { label: 'QA7: Governance & Leadership', short: 'QA7', pct: 79 },
];

function barColor(pct: number): string {
  if (pct >= 85) return 'bg-emerald-500';
  if (pct >= 70) return 'bg-amber-500';
  return 'bg-red-500';
}

function barTextColor(pct: number): string {
  if (pct >= 85) return 'text-emerald-400';
  if (pct >= 70) return 'text-amber-400';
  return 'text-red-400';
}

export function ChildcareMockContent() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="flex-1 overflow-hidden p-3 space-y-3 bg-[#0a0f1e]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[8px] uppercase tracking-wider font-bold text-white/30">NQF Quality Areas</span>
        <span className="rounded bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 text-[7px] font-medium text-cyan-400">
          ACECQA NQF
        </span>
      </div>

      {/* Quality area bars */}
      <div className="rounded-lg border border-white/[0.08] bg-[#0d1428] p-3 space-y-2">
        {NQF_AREAS.map((area, i) => (
          <motion.div
            key={area.short}
            initial={shouldReduceMotion ? false : { opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: 0.3 + i * 0.05 }}
            className="space-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[7px] text-white/50 truncate">{area.label}</span>
              <span className={`text-[8px] font-bold font-mono ${barTextColor(area.pct)}`}>{area.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${barColor(area.pct)}`}
                initial={{ width: 0 }}
                whileInView={{ width: `${area.pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overall score */}
      <div className="rounded-lg border border-white/[0.08] bg-[#0d1428] p-2 flex items-center justify-between">
        <span className="text-[7px] uppercase tracking-wider font-bold text-white/30">Overall Rating</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-amber-400">Meeting NQS</span>
          <span className="text-[8px] font-mono text-white/40">79.7%</span>
        </div>
      </div>
    </div>
  );
}

export default ChildcareMockContent;
