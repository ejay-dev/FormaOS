'use client';

import { motion, useReducedMotion } from 'framer-motion';

export interface HeroStatsBarProps {
  stats: string[];
}

export function HeroStatsBar({ stats }: HeroStatsBarProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="mt-10 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3"
    >
      <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] font-mono tracking-wide text-slate-500">
        {stats.map((stat, i) => (
          <span key={stat} className="flex items-center gap-2 whitespace-nowrap">
            {i > 0 && <span className="text-white/10">·</span>}
            {stat}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
