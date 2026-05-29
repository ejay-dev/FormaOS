'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { compliancePlanHref, demoHref, PUBLIC_CTA_LABELS } from '@/lib/marketing/cta';

export function FinalCTA() {
  return (
    <section className="product-section product-section--cta relative py-16 sm:py-24 lg:py-32 overflow-hidden">
      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.35]}>
          <div className="product-panel product-panel--strong backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-white/[0.08] to-white/[0.04] border-b border-white/10 px-5 sm:px-8 lg:px-12 py-8 sm:py-10 text-center">
              <ScrollReveal variant="blurIn" range={[0.02, 0.35]}>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-white">
                  Most platforms <span className="text-gray-500">store</span>{' '}
                  compliance.
                  <br />
                  <span className="text-foreground">
                    FormaOS operates it.
                  </span>
                </h2>
              </ScrollReveal>

              <ScrollReveal variant="depthSlide" range={[0.05, 0.38]}>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                  From obligation to execution, validation, and defense. FormaOS
                  is the operating system for modern compliance.
                </p>
              </ScrollReveal>
            </div>

            <div className="px-5 sm:px-8 lg:px-12 py-8 sm:py-10 text-center">
              <ScrollReveal variant="slideUp" range={[0.08, 0.4]}>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                  <Link
                    href={demoHref('product_final')}
                    className="mk-btn mk-btn-primary group w-full sm:w-auto px-8 py-4 text-base"
                  >
                    <span className="relative z-10">{PUBLIC_CTA_LABELS.bookDemo}</span>
                  </Link>

                  <Link
                    href={compliancePlanHref('product_final')}
                    className="mk-btn mk-btn-secondary group w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 text-base"
                  >
                    <span>{PUBLIC_CTA_LABELS.compliancePlan}</span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </div>
              </ScrollReveal>

              <ScrollReveal variant="perspectiveUp" range={[0.1, 0.42]}>
                <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-500">
                  <span className="product-panel product-panel--soft flex items-center gap-2 rounded-full px-3 py-1.5">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Guided compliance plan
                  </span>
                  <span className="product-panel product-panel--soft flex items-center gap-2 rounded-full px-3 py-1.5">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Assessment-led onboarding
                  </span>
                  <span className="product-panel product-panel--soft flex items-center gap-2 rounded-full px-3 py-1.5">
                    <CheckCircle className="w-4 h-4 text-green-400" />
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
