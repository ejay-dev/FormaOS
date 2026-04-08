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
      {/* Dark background with subtle texture */}
      <div className="absolute inset-0 bg-[#080b14]" />
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 lg:mb-20"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-red-400 mb-6">
            The Compliance Gap
          </span>
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
              className="group relative rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-red-500/20 hover:bg-red-500/[0.03]"
            >
              <div className="mb-4 inline-flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-red-400">
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
