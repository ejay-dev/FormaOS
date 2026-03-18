'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, Zap } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

const trialFeatures = [
  'Model your compliance workflows',
  'Run live operations',
  'Generate audit records',
  'Evaluate fit before committing',
];

export function FreeTrial() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[#0a0f1c]">
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.3, 0.2],
                }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 10,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          className="absolute top-1/4 left-1/3 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-cyan-500/20 via-emerald-500/10 to-transparent blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12">
        <ScrollReveal
          variant="depthSlide"
          range={[0, 0.35]}
          className="backdrop-blur-xl bg-gradient-to-br from-cyan-500/20 via-white/[0.04] to-white/[0.02] rounded-3xl border border-cyan-500/30 p-12 text-center shadow-2xl"
        >
          {/* Floating glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 rounded-3xl blur-2xl -z-10" />

          <ScrollReveal variant="scaleUp" range={[0, 0.3]}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-semibold uppercase tracking-wider mb-6">
              <Zap className="h-3 w-3 text-cyan-400" />
              <span className="text-cyan-300">Risk-Free</span>
            </div>
          </ScrollReveal>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            14-Day Free Trial
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            All plans start with a 14-day free trial. No credit card required.
          </p>

          {/* Trial features */}
          <SectionChoreography pattern="center-burst" stagger={0.05} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {trialFeatures.map((feature) => (
                <div key={feature} className="p-4 rounded-xl bg-white/[0.06] border border-white/10">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-sm text-gray-300">{feature}</p>
                </div>
            ))}
          </SectionChoreography>

          <ScrollReveal variant="slideUp" range={[0.1, 0.45]}>
            <Link
              href={`${appBase}/auth/signup`}
              className="mk-btn mk-btn-primary group inline-flex items-center gap-2 px-10 py-4 text-lg"
            >
              <span className="relative z-10">Start Your Free Trial</span>
              <ArrowRight className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>

            <p className="text-sm text-gray-500 mt-4">
              No credit card • Full access • Cancel anytime
            </p>
          </ScrollReveal>
        </ScrollReveal>
      </div>
    </section>
  );
}
