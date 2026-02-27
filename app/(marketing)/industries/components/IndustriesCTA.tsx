'use client';

import { Building2, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { brand } from '@/config/brand';
import { useDeviceTier } from '@/lib/device-tier';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export function IndustriesCTA() {
  const shouldReduceMotion = useReducedMotion();
  const tierConfig = useDeviceTier();
  const allowAmbientMotion =
    !shouldReduceMotion && tierConfig.tier === 'high' && !tierConfig.isTouch;

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-blue-500/10 rounded-full blur-3xl"
          animate={
            allowAmbientMotion
              ? {
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }
              : undefined
          }
          transition={
            allowAmbientMotion
              ? { duration: 15, repeat: Infinity, ease: 'easeInOut' }
              : undefined
          }
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.35]}>
          <div
            className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/[0.08] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-b border-white/[0.08] px-8 py-8 text-center">
              <ScrollReveal variant="scaleUp" range={[0.02, 0.3]}>
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.12] border border-white/20 text-xs font-semibold uppercase tracking-wider mb-6 text-emerald-400"
                >
                  <Building2 className="h-3 w-3" />
                  Ready for Enterprise
                </div>
              </ScrollReveal>

              <ScrollReveal variant="blurIn" range={[0.04, 0.35]}>
                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-6 text-white"
                >
                  If your organization operates under regulation,
                  <br className="hidden lg:inline" />
                  <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    FormaOS provides the system to run compliance as part of daily
                    operations.
                  </span>
                </h2>
              </ScrollReveal>

              <ScrollReveal variant="scaleUp" range={[0.08, 0.4]}>
                <div
                  className="w-24 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 mx-auto rounded-full"
                />
              </ScrollReveal>
            </div>

            {/* Content */}
            <div className="px-8 py-10">
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
                          color: 'bg-green-400',
                          text: 'Industry-specific frameworks ready from day one',
                        },
                        {
                          color: 'bg-blue-400',
                          text: 'Complete regulatory mapping and controls',
                        },
                        {
                          color: 'bg-purple-400',
                          text: 'Audit-ready evidence capture and reporting',
                        },
                      ].map((item) => (
                        <div key={item.text} className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${item.color}`} />
                          <span className="text-sm text-gray-400">{item.text}</span>
                        </div>
                      ))}
                    </div>

                    <p className="text-gray-500">
                      See how FormaOS transforms compliance from a quarterly burden
                      into daily operational certainty for your specific regulatory
                      environment.
                    </p>
                  </div>
                </ScrollReveal>

                {/* CTA Actions */}
                <ScrollReveal variant="fadeRight" range={[0.08, 0.4]}>
                  <div className="text-center">
                    <div className="space-y-4 mb-6">
                      <motion.a
                        href="/contact"
                        whileHover={{
                          scale: 1.05,
                          boxShadow: '0 0 40px rgba(16, 185, 129, 0.4)',
                        }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-semibold text-lg shadow-lg shadow-emerald-500/25 transition-all"
                      >
                        Request Industry Demo
                      </motion.a>

                      <motion.a
                        href={`${appBase}/auth/signup`}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border-2 border-white/20 text-white font-semibold hover:bg-white/[0.08] hover:border-white/30 transition-all"
                      >
                        <span>Start Free Trial</span>
                        <ArrowRight className="h-5 w-5" />
                      </motion.a>
                    </div>

                    <p className="text-xs text-gray-500">
                      No credit card required • Full platform access • Industry
                      framework included
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
