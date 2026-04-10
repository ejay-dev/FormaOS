'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Check, BookOpen } from 'lucide-react';

export interface FrameworkTab {
  id: string;
  name: string;
  body: string;
  updated: string;
  obligationCount: string;
  categories: { name: string; pct: number }[];
  requirements: string[];
}

export interface FrameworkExplorerProps {
  headline: string;
  description: string;
  frameworks: FrameworkTab[];
}

export function FrameworkExplorer({ headline, description, frameworks }: FrameworkExplorerProps) {
  const shouldReduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState(frameworks[0]?.id ?? '');
  const active = frameworks.find((f) => f.id === activeId) ?? frameworks[0];

  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0d1117] to-[#0a0e1a]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-violet-400 mb-6">
            <BookOpen className="h-3.5 w-3.5" />
            Framework Coverage
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[var(--font-display)] leading-[1.1] mb-4">
            {headline}
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">{description}</p>
        </motion.div>

        {/* Explorer */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-30px' }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid lg:grid-cols-[280px_1fr] gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.015] overflow-hidden"
        >
          {/* Tab list */}
          <div className="border-b lg:border-b-0 lg:border-r border-white/[0.06] p-3 lg:p-4 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible scrollbar-none">
            {frameworks.map((fw) => (
              <button
                key={fw.id}
                type="button"
                onClick={() => setActiveId(fw.id)}
                className={`text-left rounded-xl px-4 py-3 text-sm transition-all whitespace-nowrap lg:whitespace-normal shrink-0 ${
                  activeId === fw.id
                    ? 'bg-cyan-500/10 border border-cyan-500/20 text-white'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.03] border border-transparent'
                }`}
              >
                <div className="font-semibold text-[13px] leading-snug">{fw.name}</div>
                <div className="text-[10px] mt-0.5 opacity-60">{fw.body}</div>
              </button>
            ))}
          </div>

          {/* Detail panel */}
          <AnimatePresence mode="wait">
            {active && (
              <motion.div
                key={active.id}
                initial={shouldReduceMotion ? false : { opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, x: -12 }}
                transition={{ duration: 0.25 }}
                className="p-5 lg:p-8"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{active.name}</h3>
                    <p className="text-xs text-slate-500">
                      {active.body} · Last updated: {active.updated}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-400">{active.obligationCount}</div>
                      <div className="text-[9px] uppercase tracking-wider text-slate-600">Obligations</div>
                    </div>
                    <span className="rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                      Pre-built
                    </span>
                  </div>
                </div>

                {/* Coverage bars */}
                <div className="mb-6">
                  <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-3">Coverage by category</div>
                  <div className="space-y-2.5">
                    {active.categories.map((cat) => (
                      <div key={cat.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-slate-400">{cat.name}</span>
                          <span className="text-[10px] font-mono text-cyan-400">{cat.pct}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500/80 to-cyan-400/60"
                            initial={{ width: 0 }}
                            animate={{ width: `${cat.pct}%` }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key requirements */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-600 mb-3">Key requirements covered</div>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {active.requirements.map((req) => (
                      <div key={req} className="flex items-start gap-2 text-sm text-slate-400">
                        <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
                        <span className="leading-snug">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
