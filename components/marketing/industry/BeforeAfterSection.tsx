'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { XCircle, CheckCircle2 } from 'lucide-react';

export interface BeforeAfterSectionProps {
  headline: string;
  subheadline: string;
  without: string[];
  withFormaOS: string[];
}

export function BeforeAfterSection({
  headline,
  subheadline,
  without,
  withFormaOS,
}: BeforeAfterSectionProps) {
  const shouldReduceMotion = useReducedMotion();

  const fadeUp = (delay: number) =>
    shouldReduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 20 } as const,
          whileInView: { opacity: 1, y: 0 } as const,
          viewport: { once: true, margin: '-50px' } as const,
          transition: { duration: 0.5, delay },
        };

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 bg-[#060910]" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div {...fadeUp(0)} className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-red-400 mb-6">
            The Compliance Gap
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[var(--font-display)] leading-[1.1] mb-4">
            {headline}
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">{subheadline}</p>
        </motion.div>

        {/* Before / After split */}
        <div className="grid lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-0 items-stretch">
          {/* WITHOUT */}
          <motion.div
            {...fadeUp(0.1)}
            className="rounded-2xl border border-red-500/15 bg-gradient-to-b from-red-500/[0.04] to-transparent p-6 lg:p-8"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20">
                <XCircle className="h-4 w-4 text-red-400" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-400">
                Without FormaOS
              </h3>
            </div>
            <div className="space-y-4">
              {without.map((item, i) => (
                <motion.div
                  key={item}
                  {...fadeUp(0.15 + i * 0.06)}
                  className="flex items-start gap-3"
                >
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-red-500/60" />
                  <p className="text-sm text-slate-400 leading-relaxed">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* VS divider */}
          <div className="hidden lg:flex flex-col items-center justify-center px-6">
            <div className="h-full w-px bg-gradient-to-b from-red-500/20 via-white/10 to-emerald-500/20" />
            <div className="my-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-bold text-slate-400">
              VS
            </div>
            <div className="h-full w-px bg-gradient-to-b from-white/10 via-emerald-500/20 to-emerald-500/10" />
          </div>
          {/* Mobile VS divider */}
          <div className="flex lg:hidden items-center justify-center gap-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <span className="text-xs font-bold text-slate-500">VS</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </div>

          {/* WITH FORMAOS */}
          <motion.div
            {...fadeUp(0.2)}
            className="rounded-2xl border border-emerald-500/15 bg-gradient-to-b from-emerald-500/[0.04] to-transparent p-6 lg:p-8"
          >
            <div className="flex items-center gap-2.5 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                With FormaOS
              </h3>
            </div>
            <div className="space-y-4">
              {withFormaOS.map((item, i) => (
                <motion.div
                  key={item}
                  {...fadeUp(0.25 + i * 0.06)}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500/60" />
                  <p className="text-sm text-slate-300 leading-relaxed">{item}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
