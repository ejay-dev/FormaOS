'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export interface PainPoint {
  icon: ReactNode;
  title: string;
  description: string;
}

export interface PainPointsGridProps {
  headline: string;
  subheadline: string;
  painPoints: PainPoint[];
}

export function PainPointsGrid({ headline, subheadline, painPoints }: PainPointsGridProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-marketing-bg" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[var(--font-display)] leading-[1.1] mb-4">
            {headline}
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">{subheadline}</p>
        </motion.div>

        {/* Pain points grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {painPoints.map((pain, i) => (
            <motion.div
              key={pain.title}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-destructive/25 hover:bg-destructive/[0.03]"
            >
              <div className="mb-4 inline-flex items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-destructive">
                {pain.icon}
              </div>
              <h3 className="text-[15px] font-semibold text-white mb-2 leading-snug">
                {pain.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">{pain.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
