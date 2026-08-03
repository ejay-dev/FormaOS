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
      transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mt-8"
    >
      {/* Three at most: this is the hero's only proof line, and a fourth
          claim reads as a strip rather than a sentence. */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] leading-relaxed text-slate-400">
        {stats.slice(0, 3).map((stat, i) => (
          <span key={stat} className="flex items-center gap-2">
            {i > 0 && <span className="text-white/20">·</span>}
            {stat}
          </span>
        ))}
      </div>
    </motion.div>
  );
}
