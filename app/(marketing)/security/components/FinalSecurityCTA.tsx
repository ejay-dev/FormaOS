'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

export function FinalSecurityCTA() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f1c] via-[#0d1424] to-[#0a0f1c]">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.35, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-white/[0.06] to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 3,
          }}
          className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 rounded-full bg-gradient-to-tl from-white/[0.05] to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal variant="slideUp" range={[0, 0.35]} className="relative">
          {/* Executive Security Panel */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-w-4xl mx-auto">
            {/* Security CTA Header */}
            <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-b border-white/10 px-8 sm:px-12 py-8 sm:py-10">
              <div className="text-center">
                <ScrollReveal variant="scaleUp" range={[0.02, 0.3]}>
                  <p className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Security First
                  </p>
                </ScrollReveal>

                <ScrollReveal variant="blurIn" range={[0.04, 0.35]}>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                    <span className="text-white">Security is not a feature.</span>
                    <br className="hidden sm:inline" />
                    <span className="text-slate-400">
                      It is the foundation of governance.
                    </span>
                  </h2>
                </ScrollReveal>

                <ScrollReveal variant="scaleUp" range={[0.08, 0.4]}>
                  <div className="w-24 h-1 bg-white/20 mx-auto rounded-full mb-8" />
                </ScrollReveal>
              </div>
            </div>

            {/* Security CTA Content */}
            <div className="px-8 sm:px-12 py-10 sm:py-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Security Promise */}
                <ScrollReveal variant="fadeLeft" range={[0.06, 0.38]}>
                  <div className="text-center lg:text-left">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">
                      Enterprise security meets compliance requirements
                    </h3>

                    <div className="space-y-4 mb-8">
                      <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="w-2 h-2 rounded-full bg-white/40" />
                        <span className="text-sm text-gray-400">
                          Infrastructure practices aligned with SOC 2 and ISO 27001 frameworks
                        </span>
                      </div>
                      <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="w-2 h-2 rounded-full bg-white/40" />
                        <span className="text-sm text-gray-400">
                          Encryption at rest and in transit
                        </span>
                      </div>
                      <div className="flex items-center gap-3 justify-center lg:justify-start">
                        <div className="w-2 h-2 rounded-full bg-white/40" />
                        <span className="text-sm text-gray-400">
                          Immutable audit trails with tamper-evident logging
                        </span>
                      </div>
                    </div>

                    <p className="text-base text-gray-500 leading-relaxed">
                      Get a comprehensive security overview tailored to your
                      compliance requirements and regulatory environment.
                    </p>
                  </div>
                </ScrollReveal>

                {/* Security CTA Actions */}
                <ScrollReveal variant="fadeRight" range={[0.08, 0.4]}>
                  <div className="text-center">
                    <div className="space-y-4 mb-8">
                      <Link
                        href="/contact?type=security-review&source=security_final_primary"
                        className="mk-btn mk-btn-primary group w-full inline-block px-8 py-4 text-base"
                      >
                        <span className="relative z-10">
                          Book Security Review
                        </span>
                      </Link>

                      <Link
                        href="/contact?type=security-review&source=security_final"
                        className="mk-btn mk-btn-secondary group w-full flex items-center justify-center gap-2 px-8 py-4 text-base"
                      >
                        <span>Book Security Review</span>
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </Link>
                    </div>

                    <div className="text-xs text-gray-500">
                      Aligned with SOC 2 and GDPR frameworks • Enterprise security standards
                    </div>
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
