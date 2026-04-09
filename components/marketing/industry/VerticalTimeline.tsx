'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export interface TimelineStep {
  number: string;
  title: string;
  description: string;
  visual: ReactNode;
  gradient: string;
}

export interface VerticalTimelineProps {
  steps: TimelineStep[];
}

export function VerticalTimeline({ steps }: VerticalTimelineProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-gradient-to-b from-[#080b14] via-[#0d1117] to-[#0a0e1a]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-cyan-400 mb-6">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[var(--font-display)] leading-[1.1]">
            Three Steps to Audit-Ready
          </h2>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute left-[50%] top-0 bottom-0 w-px">
            <motion.div
              className="h-full w-full bg-gradient-to-b from-cyan-500/30 via-violet-500/20 to-emerald-500/30"
              initial={shouldReduceMotion ? false : { scaleY: 0 }}
              whileInView={shouldReduceMotion ? undefined : { scaleY: 1 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'top' }}
            />
          </div>

          <div className="space-y-16 lg:space-y-24">
            {steps.map((step, i) => {
              const isEven = i % 2 === 0;
              return (
                <motion.div
                  key={step.number}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 30 }}
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={`relative grid lg:grid-cols-2 gap-8 lg:gap-16 items-center ${
                    !isEven ? 'lg:[direction:rtl]' : ''
                  }`}
                >
                  {/* Text */}
                  <div className={!isEven ? 'lg:[direction:ltr]' : ''}>
                    <div className={`inline-flex items-center gap-3 mb-4`}>
                      <span
                        className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl font-bold bg-gradient-to-br ${step.gradient}`}
                      >
                        {step.number}
                      </span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3 font-[var(--font-display)]">
                      {step.title}
                    </h3>
                    <p className="text-base text-slate-400 leading-relaxed max-w-lg">
                      {step.description}
                    </p>
                  </div>

                  {/* Visual */}
                  <div className={!isEven ? 'lg:[direction:ltr]' : ''}>
                    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                      {step.visual}
                    </div>
                  </div>

                  {/* Node on timeline */}
                  <div className="hidden lg:flex absolute left-1/2 top-6 -translate-x-1/2 h-4 w-4 rounded-full border-2 border-cyan-500/40 bg-[#0d1117]">
                    <div className="m-auto h-2 w-2 rounded-full bg-cyan-500/60" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
