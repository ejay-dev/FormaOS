'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Search, Bell, Settings, Sun } from 'lucide-react';

interface MockTopbarProps {
  orgName?: string;
}

const actionVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.2, delay: 0.3 + i * 0.04 },
  }),
};

export function MockTopbar({ orgName = 'greenfield-care' }: MockTopbarProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className="flex-shrink-0"
    >
      {/* Main topbar h-9 (scaled for mockup) */}
      <div className="flex items-center justify-between h-8 px-3 bg-[#0a0f1e] border-b border-white/[0.08]">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-[7px] text-white/40 font-mono">
          <span className="uppercase tracking-wider">Organization</span>
          <span className="text-white/20">&rsaquo;</span>
          <span className="text-white/60">{orgName}</span>
          <span className="text-white/20">&rsaquo;</span>
          <span className="text-cyan-400/60 uppercase tracking-wider">
            Owner
          </span>
        </div>

        {/* Right actions — staggered entry */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <motion.div
            custom={0}
            variants={shouldReduceMotion ? undefined : actionVariants}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            whileInView="visible"
            viewport={{ once: true }}
            className="flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5"
          >
            <Search className="w-2 h-2 text-white/30" />
            <span className="text-[6px] text-white/20">Search...</span>
          </motion.div>
          {[
            { Icon: Bell, i: 1 },
            { Icon: Settings, i: 2 },
            { Icon: Sun, i: 3 },
          ].map(({ Icon, i }) => (
            <motion.div
              key={i}
              custom={i}
              variants={shouldReduceMotion ? undefined : actionVariants}
              initial={shouldReduceMotion ? undefined : 'hidden'}
              whileInView="visible"
              viewport={{ once: true }}
            >
              <Icon className="w-2.5 h-2.5 text-white/30" />
            </motion.div>
          ))}
          {/* Avatar */}
          <motion.div
            custom={4}
            variants={shouldReduceMotion ? undefined : actionVariants}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            whileInView="visible"
            viewport={{ once: true }}
            className="w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center"
          >
            <span className="text-[6px] font-bold text-white">E</span>
          </motion.div>
          {/* Trial badge */}
          <motion.span
            custom={5}
            variants={shouldReduceMotion ? undefined : actionVariants}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            whileInView="visible"
            viewport={{ once: true }}
            className="rounded bg-amber-500/15 border border-amber-500/25 px-1 py-0.5 text-[6px] font-medium text-amber-400"
          >
            14d left
          </motion.span>
        </div>
      </div>

      {/* Compliance strip */}
      <div className="flex items-center gap-3 h-5 px-3 bg-[#080c18] border-b border-white/[0.06]">
        <span className="flex items-center gap-1 text-[7px]">
          <span
            className="w-1.5 h-1.5 rounded-full bg-red-500"
            style={{
              animation: shouldReduceMotion
                ? 'none'
                : 'mockup-pulse-dot 2s ease-in-out infinite',
            }}
          />
          <span className="text-white/40">0 Overdue</span>
        </span>
        <span className="flex items-center gap-1 text-[7px]">
          <span
            className="w-1.5 h-1.5 rounded-full bg-amber-500"
            style={{
              animation: shouldReduceMotion
                ? 'none'
                : 'mockup-pulse-dot 2s ease-in-out infinite 0.3s',
            }}
          />
          <span className="text-white/40">0 Due Soon</span>
        </span>
        <span className="flex items-center gap-1 text-[7px]">
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            style={{
              animation: shouldReduceMotion
                ? 'none'
                : 'mockup-pulse-dot 2s ease-in-out infinite 0.6s',
            }}
          />
          <span className="text-white/40">0 Completed</span>
        </span>
        <div className="flex-1" />
        <span className="flex items-center gap-1 text-[6px] text-white/20">
          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          Last synced 2 min ago
        </span>
      </div>
    </motion.div>
  );
}

export default MockTopbar;
