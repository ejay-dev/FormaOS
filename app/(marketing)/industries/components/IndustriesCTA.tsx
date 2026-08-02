'use client';

import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { compliancePlanHref, demoHref, PUBLIC_CTA_LABELS } from '@/lib/marketing/cta';

export function IndustriesCTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.35]}>
          <div className="bg-white/[0.04] rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-b border-white/[0.08] px-4 sm:px-6 md:px-8 py-6 sm:py-8 text-center">
              <ScrollReveal variant="scaleUp" range={[0.02, 0.3]}>
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Ready for Enterprise
                </p>
              </ScrollReveal>

              <ScrollReveal variant="blurIn" range={[0.04, 0.35]}>
                <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-6 text-white">
                  If your organisation operates under regulation,
                  <br className="hidden lg:inline" />
                  <span className="text-foreground">
                    FormaOS provides the system to run compliance as part of
                    daily operations.
                  </span>
                </h2>
              </ScrollReveal>

              <ScrollReveal variant="scaleUp" range={[0.08, 0.4]}>
                <div className="w-24 h-1 bg-zinc-700 mx-auto rounded-full" />
              </ScrollReveal>
            </div>

            {/* Content */}
            <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
              <div className="grid lg:grid-cols-2 gap-8 items-center">
                {/* Industry Promise */}
                <ScrollReveal variant="fadeLeft" range={[0.06, 0.38]}>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">
                      Pre-built compliance infrastructure for your industry
                    </h3>

                    <div className="space-y-4 mb-8">
                      {[
                        {
                          color: 'bg-slate-500',
                          text: 'Industry-specific frameworks ready from day one',
                        },
                        {
                          color: 'bg-slate-500',
                          text: 'Complete regulatory mapping and controls',
                        },
                        {
                          color: 'bg-slate-500',
                          text: 'Audit-ready evidence capture and reporting',
                        },
                      ].map((item) => (
                        <div
                          key={item.text}
                          className="flex items-center gap-3"
                        >
                          <div
                            className={`w-2 h-2 rounded-full ${item.color}`}
                          />
                          <span className="text-sm text-slate-400">
                            {item.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="text-slate-500">
                      See how FormaOS transforms compliance from a quarterly
                      burden into daily operational certainty for your specific
                      regulatory environment.
                    </p>
                  </div>
                </ScrollReveal>

                {/* CTA Actions */}
                <ScrollReveal variant="fadeRight" range={[0.08, 0.4]}>
                  <div className="text-center">
                    <div className="space-y-4 mb-6">
                      <motion.a
                        href={demoHref('industries_cta')}
                        whileHover={{
                          scale: 1.05,
                        }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-foreground text-background font-semibold text-lg shadow-lg hover:opacity-90 transition-all"
                      >
                        Request Industry Demo
                      </motion.a>

                      <motion.a
                        href={compliancePlanHref('industries_cta')}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-white/20 text-white font-semibold hover:bg-white/[0.08] hover:border-white/30 transition-all"
                      >
                        <span>{PUBLIC_CTA_LABELS.compliancePlan}</span>
                        <ArrowRight className="h-5 w-5" />
                      </motion.a>
                    </div>

                    <p className="text-xs text-slate-500">
                      Assessment-led onboarding • Industry framework mapping • Procurement-ready review
                    </p>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

export default IndustriesCTA;
