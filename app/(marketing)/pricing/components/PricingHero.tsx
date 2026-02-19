'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { Check, DollarSign, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { brand } from '@/config/brand';
import { easing, duration } from '@/config/motion';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

export function PricingHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);
  const sa = !shouldReduceMotion;

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24"
    >
      <HeroAtmosphere topColor="emerald" bottomColor="blue" gridColor="emerald" />

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-center text-center">
          <motion.div style={{ opacity, scale, y }}>
            {/* Badge */}
            <motion.div
              initial={sa ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={sa ? { duration: duration.slow, delay: 0.2, ease: easing.signature } : { duration: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-8"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium tracking-wide">
                Transparent Pricing
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={sa ? { opacity: 0, y: 30 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={sa ? { duration: duration.slower, delay: 0.3, ease: easing.signature } : { duration: 0 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              Compliance Infrastructure,
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-500 to-blue-500 bg-clip-text text-transparent">
                Scaled to Your Organization
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={sa ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={sa ? { duration: duration.slower, delay: 0.5, ease: easing.signature } : { duration: 0 }}
              className="text-lg sm:text-xl text-gray-400 mb-4 max-w-3xl mx-auto text-center leading-relaxed"
            >
              FormaOS is not a productivity tool.
              <br />
              It is a compliance operating system.
            </motion.p>

            {/* Supporting Copy */}
            <motion.p
              initial={sa ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={sa ? { duration: duration.slower, delay: 0.6, ease: easing.signature } : { duration: 0 }}
              className="text-base text-gray-500 mb-8 max-w-2xl mx-auto text-center leading-relaxed"
            >
              Our pricing reflects the level of governance, automation, and
              regulatory accountability your organization requires, from
              foundational process tracking to enterprise-wide audit
              infrastructure.
            </motion.p>
            <motion.p
              initial={sa ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={sa ? { duration: duration.slower, delay: 0.7, ease: easing.signature } : { duration: 0 }}
              className="text-xs text-gray-500 mb-6 max-w-2xl mx-auto text-center"
            >
              Used by compliance teams. Aligned to ISO/SOC frameworks. Built for
              audit defensibility.
            </motion.p>

            {/* Value Props */}
            <motion.div
              initial={sa ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={sa ? { duration: duration.slower, delay: 0.7, ease: easing.signature } : { duration: 0 }}
              className="mb-10 flex flex-col items-center gap-4"
            >
              <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Clear feature tiers
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Transparent entitlements
                </span>
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Upgrade any time
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-300">
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1">
                  Security review packet
                </span>
                <span className="rounded-full border border-cyan-400/30 bg-cyan-500/10 px-3 py-1">
                  No setup fee
                </span>
                <span className="rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1">
                  14-day trial
                </span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={sa ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={sa ? { duration: duration.slower, delay: 0.8, ease: easing.signature } : { duration: 0 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href={`${appBase}/auth/signup`}
                data-testid="pricing-hero-start-trial"
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-4 text-base font-semibold text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <span className="relative z-10">Start Free Trial</span>
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              <Link
                href="/contact"
                className="group flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-white/20 text-base font-semibold text-white hover:bg-white/[0.08] hover:border-white/30 transition-all duration-300"
              >
                <span>Contact Sales</span>
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
            </motion.div>
            <motion.div
              initial={sa ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={sa ? { duration: duration.slower, delay: 0.9, ease: easing.signature } : { duration: 0 }}
              className="mt-4"
            >
              <Link
                href="/security-review"
                className="text-sm font-medium text-cyan-300 underline decoration-cyan-500/60 underline-offset-4 hover:text-cyan-200"
              >
                Review procurement security packet
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
