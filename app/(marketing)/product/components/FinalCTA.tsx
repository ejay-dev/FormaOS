'use client';

import { Fragment } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { compliancePlanHref, demoHref, PUBLIC_CTA_LABELS } from '@/lib/marketing/cta';

const ASSURANCES = [
  'Guided compliance plan',
  'Assessment-led onboarding',
  'Full platform access',
] as const;

export function FinalCTA() {
  return (
    <section className="product-section product-section--cta relative isolate overflow-hidden py-20 sm:py-28 lg:py-32">
      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.35]}>
          <div className="mb-5 flex items-center justify-center gap-4">
            <span className="h-px w-10 bg-white/20" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              The difference
            </span>
            <span className="h-px w-10 bg-white/20" />
          </div>

          <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Most platforms <span className="text-slate-500">store</span>{' '}
            compliance.
            <br className="hidden sm:block" /> FormaOS operates it.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400">
            From obligation to execution, validation, and defense. FormaOS is
            the operating system for modern compliance.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={demoHref('product_final')}
              className="mk-btn mk-btn-primary w-full justify-center px-8 py-4 text-base sm:w-auto"
            >
              {PUBLIC_CTA_LABELS.bookDemo}
            </Link>
            <Link
              href={compliancePlanHref('product_final')}
              className="mk-btn mk-btn-secondary group flex w-full items-center justify-center gap-2 px-8 py-4 text-base sm:w-auto"
            >
              <span>{PUBLIC_CTA_LABELS.compliancePlan}</span>
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-500">
            {ASSURANCES.map((a, i) => (
              <Fragment key={a}>
                {i > 0 && (
                  <span className="text-slate-700" aria-hidden="true">
                    ·
                  </span>
                )}
                <span>{a}</span>
              </Fragment>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
