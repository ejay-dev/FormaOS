'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ChevronDown, Check, BookOpen } from 'lucide-react';

export interface Framework {
  name: string;
  body: string;
  obligationCount: string;
  areas: string[];
}

export interface FrameworkCoverageProps {
  headline: string;
  description: string;
  frameworks: Framework[];
}

export function FrameworkCoverage({ headline, description, frameworks }: FrameworkCoverageProps) {
  const shouldReduceMotion = useReducedMotion();
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e1a] via-[#0d1117] to-[#0a0e1a]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
          {/* Left: headline */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: -20 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-violet-400 mb-6">
              <BookOpen className="h-3.5 w-3.5" />
              Framework Coverage
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[var(--font-display)] leading-[1.1] mb-6">
              {headline}
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">{description}</p>

            <div className="mt-8 flex items-center gap-3 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-cyan-500" />
                Pre-built
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-violet-500" />
                Audit-mapped
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                Evidence-linked
              </div>
            </div>
          </motion.div>

          {/* Right: expandable framework cards */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: 20 }}
            whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="space-y-3"
          >
            {frameworks.map((fw, i) => {
              const isOpen = expanded === i;
              return (
                <div
                  key={fw.name}
                  className={`rounded-xl border transition-all ${
                    isOpen
                      ? 'border-cyan-500/30 bg-cyan-500/[0.04]'
                      : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : i)}
                    className="flex w-full items-center justify-between p-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-[15px] font-semibold text-white truncate">
                          {fw.name}
                        </h3>
                        <span className="shrink-0 inline-flex rounded-full bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-400">
                          Pre-built
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{fw.body}</p>
                    </div>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 ml-3 text-slate-500 transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={shouldReduceMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 border-t border-white/[0.06] pt-4">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-cyan-400">
                                {fw.obligationCount}
                              </div>
                              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                                Obligations
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {fw.areas.map((area) => (
                              <div key={area} className="flex items-start gap-2 text-sm text-slate-400">
                                <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
                                {area}
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
