'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { ArrowRight, Sparkles, CheckCircle } from 'lucide-react';
import { brand } from '@/config/brand';
import { useControlPlaneRuntime } from '@/lib/control-plane/runtime-client';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

const TRUST_BADGES = [
  { label: 'SOC 2-aligned', detail: 'Trust framework' },
  { label: 'Audit-ready', detail: 'Continuous posture' },
  { label: 'Data sovereign', detail: 'AU / US / EU residency' },
  { label: 'Enterprise SSO', detail: 'SAML 2.0 + MFA' },
  { label: 'Full data export', detail: 'No lock-in on exit' },
] as const;

export function CTASection() {
  const shouldReduceMotion = useReducedMotion();
  const { snapshot } = useControlPlaneRuntime();
  const runtime = snapshot?.marketing.runtime ?? DEFAULT_RUNTIME_MARKETING.runtime;

  // Suppress lint warning — runtime gating kept for future use
  void runtime;

  return (
    <section className="home-section home-section--cta relative overflow-hidden">
      {/* Section dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      {/* Subtle background glow */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-teal-500/[0.04] to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(20,184,166,0.06)_0%,transparent_70%)]" />

      <div className="relative z-10 py-20 sm:py-28 lg:py-40 max-w-4xl mx-auto px-5 sm:px-6 lg:px-12 text-center">
        <ScrollReveal variant="scaleUp" range={[0, 0.25]}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-400/20 mb-6 sm:mb-8">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-teal-400 font-medium">
              Start Your Free Trial
            </span>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="slideUp" range={[0, 0.3]}>
          <h2 className="text-[2rem] sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-5 sm:mb-6 leading-tight text-white">
            Install the{' '}
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
              Operating System
            </span>
            <br />
            <span className="text-white/90">
              Your Compliance Deserves
            </span>
          </h2>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp" range={[0.02, 0.32]}>
          <p className="text-base sm:text-lg md:text-xl text-slate-400 mb-10 sm:mb-12 max-w-2xl mx-auto leading-relaxed">
            Regulators don't accept "we were working on it." FormaOS enforces controls, captures evidence automatically, and keeps your organization audit-ready — every day, not just before the audit.
          </p>
        </ScrollReveal>

        <ScrollReveal variant="slideUp" range={[0.04, 0.34]}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
            <motion.a
              href={`${appBase}/auth/signup?plan=pro`}
              whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              className="mk-btn mk-btn-primary px-8 py-4 min-h-[48px] text-base sm:text-lg w-full sm:w-auto justify-center"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </motion.a>

            <motion.a
              href="/contact"
              whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
              className="mk-btn mk-btn-secondary px-8 py-4 min-h-[48px] text-base sm:text-lg w-full sm:w-auto justify-center"
            >
              Schedule Enterprise Demo
            </motion.a>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp" range={[0.06, 0.36]}>
          <p className="text-sm text-slate-500 mt-6 sm:mt-8">
            No credit card required &bull; 14-day free trial &bull; Security review packet included &bull; Cancel anytime
          </p>
        </ScrollReveal>

        {/* Trust proof badges */}
        <ScrollReveal
          variant="fadeUp"
          range={[0.08, 0.38]}
          className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-white/[0.06]"
        >
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {TRUST_BADGES.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center gap-2.5 px-3 sm:px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400/70 flex-shrink-0" />
                <div className="text-left">
                  <div className="text-sm font-semibold text-white">{stat.label}</div>
                  <div className="text-[11px] text-slate-500">{stat.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
