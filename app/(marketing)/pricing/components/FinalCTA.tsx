'use client';

import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { duration } from '@/config/motion';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export function FinalCTA() {
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
          className="absolute top-1/4 left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-emerald-500/20 via-cyan-500/15 to-transparent blur-3xl"
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
          className="absolute bottom-1/4 right-1/4 w-1/3 h-1/3 rounded-full bg-gradient-to-tl from-blue-500/20 via-purple-500/10 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: duration.slower }}
          className="relative"
        >
          {/* Executive Panel */}
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-b border-white/10 px-8 sm:px-12 py-8 sm:py-10">
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2, duration: duration.slow }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.12] border border-white/20 text-xs font-semibold uppercase tracking-wider mb-6 text-emerald-400"
                >
                  <Building2 className="h-3 w-3" />
                  Ready to Start
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, duration: duration.slower }}
                  className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6"
                >
                  <span className="text-white">
                    Build your compliance foundation
                  </span>
                  <br className="hidden sm:inline" />
                  <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    with FormaOS
                  </span>
                </motion.h2>

                <motion.div
                  initial={{ scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, duration: duration.slower }}
                  className="w-24 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 mx-auto rounded-full"
                />
              </div>
            </div>

            {/* Content */}
            <div className="px-8 sm:px-12 py-10 sm:py-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                {/* Value Props */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: duration.slower }}
                  className="text-center lg:text-left"
                >
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">
                    Start transforming compliance today
                  </h3>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-sm text-gray-400">
                        14-day free trial on all plans
                      </span>
                    </div>
                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                      <div className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span className="text-sm text-gray-400">
                        No credit card required to start
                      </span>
                    </div>
                    <div className="flex items-center gap-3 justify-center lg:justify-start">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-sm text-gray-400">
                        Cancel or change plans anytime
                      </span>
                    </div>
                  </div>

                  <p className="text-base text-gray-500 leading-relaxed">
                    Join organizations building audit-ready compliance
                    infrastructure with FormaOS.
                  </p>
                </motion.div>

                {/* CTA Actions */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: duration.slower }}
                  className="text-center"
                >
                  <div className="space-y-4 mb-8">
                    <Link
                      href={`${appBase}/auth/signup`}
                      className="group w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 inline-block"
                    >
                      <span className="relative z-10">Start Free Trial</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>

                    <Link
                      href="/contact"
                      className="group w-full flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/20 text-base font-semibold text-white hover:bg-white/[0.08] hover:border-white/30 transition-all duration-300 backdrop-blur-sm"
                    >
                      <span>Talk to Sales</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </div>

                  <div className="text-xs text-gray-500">
                    Region-aware hosting • GDPR-ready workflows •
                    Enterprise-ready
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
