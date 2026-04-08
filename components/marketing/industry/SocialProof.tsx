'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Building2, Target, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';

export interface TrustCard {
  persona: string;
  need: string;
  delivers: string;
}

export interface SocialProofProps {
  metricsBanner: string[];
  trustCards: TrustCard[];
  regulatoryBodies: { name: string; icon: ReactNode }[];
}

export function SocialProof({ metricsBanner, trustCards, regulatoryBodies }: SocialProofProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-24 lg:py-32">
      <div className="absolute inset-0 bg-[#080b14]" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Metrics banner */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6 }}
          className="mb-16 rounded-xl border border-white/[0.06] bg-white/[0.02] p-6"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-400">
            {metricsBanner.map((metric, i) => (
              <span key={metric} className="flex items-center gap-3">
                {i > 0 && (
                  <span className="hidden sm:block h-4 w-px bg-white/10" />
                )}
                <span className="text-white font-medium">{metric}</span>
              </span>
            ))}
          </div>
        </motion.div>

        {/* Trust cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {trustCards.map((card, i) => (
            <motion.div
              key={card.persona}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6 hover:border-cyan-500/20 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 text-cyan-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-white">{card.persona}</span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-slate-600 mb-1">
                    <Target className="h-3 w-3" /> What they needed
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{card.need}</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-cyan-600 mb-1">
                    <Sparkles className="h-3 w-3" /> What FormaOS delivers
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{card.delivers}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Regulatory body logos */}
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-xs uppercase tracking-wider text-slate-600 mb-6">
            Built for frameworks governed by
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {regulatoryBodies.map((body) => (
              <div
                key={body.name}
                className="flex items-center gap-2 text-sm text-slate-500 opacity-60 hover:opacity-100 transition-opacity"
              >
                {body.icon}
                <span>{body.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
