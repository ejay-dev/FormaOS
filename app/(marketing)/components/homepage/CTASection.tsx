'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { ArrowRight } from 'lucide-react';
import { brand } from '@/config/brand';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

const TRUST_POINTS = [
  'SOC 2-aligned trust framework',
  'Continuous audit-ready posture',
  'AU-hosted · US/EU residency on roadmap',
  'Enterprise SSO (SAML 2.0 + MFA)',
  'Full data export · No lock-in',
] as const;

export function CTASection() {
  return (
    <section className="home-section home-section--cta">
      <div className="relative z-10 py-24 sm:py-32 max-w-3xl mx-auto px-6 text-center">
        <ScrollReveal variant="slideUp" range={[0, 0.3]}>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-white">
            The operating system{' '}
            <span className="text-teal-400">your compliance deserves</span>
          </h2>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp" range={[0.02, 0.32]}>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Regulators don't accept "we were working on it." FormaOS enforces
            controls, captures evidence automatically, and keeps your
            organization audit-ready — every day.
          </p>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp" range={[0.04, 0.34]}>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`${appBase}/auth/signup?plan=pro`}
              className="mk-btn mk-btn-primary px-7 py-3.5 min-h-[48px] text-base w-full sm:w-auto justify-center"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="/contact"
              className="mk-btn mk-btn-secondary px-7 py-3.5 min-h-[48px] text-base w-full sm:w-auto justify-center"
            >
              Schedule Enterprise Demo
            </a>
          </div>
          <p className="text-sm text-slate-500 mt-5">
            No credit card required · 14-day free trial · Cancel anytime
          </p>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp" range={[0.06, 0.36]}>
          <div className="mt-12 pt-8 border-t border-white/[0.06]">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {TRUST_POINTS.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-2 text-sm text-slate-500"
                >
                  <span className="h-1 w-1 rounded-full bg-teal-500/50" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
