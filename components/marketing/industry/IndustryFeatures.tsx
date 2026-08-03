'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

export interface IndustryFeature {
  title: string;
  description: string;
  details: string[];
  visual: ReactNode;
}

export interface IndustryFeaturesProps {
  headline: string;
  subheadline: string;
  features: IndustryFeature[];
}

export function IndustryFeatures({ headline, subheadline, features }: IndustryFeaturesProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-marketing-bg" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
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

        {/* Alternating feature blocks */}
        <div className="space-y-20 lg:space-y-28">
          {features.map((feature, i) => {
            const isReversed = i % 2 === 1;
            return (
              <div
                key={feature.title}
                className={`grid lg:grid-cols-2 gap-10 lg:gap-16 items-center ${
                  isReversed ? 'lg:[direction:rtl]' : ''
                }`}
              >
                {/* Text side */}
                <motion.div
                  initial={
                    shouldReduceMotion
                      ? false
                      : { opacity: 0, x: isReversed ? 24 : -24 }
                  }
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6 }}
                  className={isReversed ? 'lg:[direction:ltr]' : ''}
                >
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight font-[var(--font-display)]">
                    {feature.title}
                  </h3>
                  <p className="text-base text-slate-400 leading-relaxed mb-5">
                    {feature.description}
                  </p>
                  <ul className="space-y-2.5">
                    {feature.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2.5 text-sm text-slate-400">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-white/40" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Visual side */}
                <motion.div
                  initial={
                    shouldReduceMotion
                      ? false
                      : { opacity: 0, x: isReversed ? -24 : 24 }
                  }
                  whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={isReversed ? 'lg:[direction:ltr]' : ''}
                >
                  <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.02] overflow-hidden">
                    {feature.visual}
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
