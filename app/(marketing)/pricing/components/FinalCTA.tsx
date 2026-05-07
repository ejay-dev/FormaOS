'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle, ShieldCheck } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';

export function FinalCTA() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.16),transparent_36%)]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.35]}>
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-b border-white/10 px-5 sm:px-8 lg:px-12 py-8 sm:py-10 text-center">
              <ScrollReveal variant="blurIn" range={[0.02, 0.35]}>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-sm font-medium mb-6">
                  <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                  Closing decision
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                  Stop relying on people to{' '}
                  <span className="text-slate-500">remember</span>{' '}
                  compliance.
                  <br />
                  <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    Let the system enforce it.
                  </span>
                </h2>
              </ScrollReveal>

              <ScrollReveal variant="depthSlide" range={[0.05, 0.38]}>
                <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                  Get a compliance plan scoped to your framework obligations,
                  operating complexity, and audit risk.
                </p>
              </ScrollReveal>
            </div>

            <div className="px-5 sm:px-8 lg:px-12 py-8 sm:py-10 text-center">
              <ScrollReveal variant="slideUp" range={[0.08, 0.4]}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                  <Link
                    href="/contact?type=compliance-plan&source=pricing_final"
                    onClick={() =>
                      trackCtaClick({
                        surface: 'pricing',
                        section: 'final_cta',
                        location: 'final_primary',
                        ctaLabel: 'Get Your Compliance Plan',
                        ctaHref: '/contact?type=compliance-plan&source=pricing_final',
                        variant: 'final',
                      })
                    }
                    className="mk-btn mk-btn-primary w-full sm:w-auto min-h-[52px] justify-center px-8 py-4 text-base"
                  >
                    Get Your Compliance Plan
                    <ArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/contact?type=expert&source=pricing_final"
                    onClick={() =>
                      trackCtaClick({
                        surface: 'pricing',
                        section: 'final_cta',
                        location: 'final_secondary',
                        ctaLabel: 'Talk to an Expert',
                        ctaHref: '/contact?type=expert&source=pricing_final',
                        variant: 'final',
                      })
                    }
                    className="mk-btn mk-btn-secondary w-full sm:w-auto min-h-[52px] justify-center px-8 py-4 text-base"
                  >
                    Talk to an Expert
                  </Link>
                </div>
              </ScrollReveal>

              <ScrollReveal variant="perspectiveUp" range={[0.1, 0.42]}>
                <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-slate-500">
                  <span className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/[0.04] border border-white/[0.08]">
                    <CheckCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    Assessment-led scoping
                  </span>
                  <span className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/[0.04] border border-white/[0.08]">
                    <CheckCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    No arbitrary feature gates
                  </span>
                  <span className="flex items-center gap-2 rounded-full px-3 py-1.5 bg-white/[0.04] border border-white/[0.08]">
                    <CheckCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                    Full platform access
                  </span>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
