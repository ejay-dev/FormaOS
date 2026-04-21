'use client';

import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';

export function FinalCTA() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <section className="relative overflow-hidden bg-slate-950 py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.16),transparent_36%)]" />
      <div className="relative mx-auto max-w-5xl px-6 text-center lg:px-12">
        <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Closing decision
        </div>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
          Stop relying on people to remember compliance
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
          Let the system enforce it instead. Get a compliance plan scoped to
          your framework obligations, operating complexity, and audit risk.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
            className="mk-btn mk-btn-primary min-h-[52px] justify-center px-8 py-4 text-base"
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
            className="mk-btn mk-btn-secondary min-h-[52px] justify-center px-8 py-4 text-base"
          >
            Talk to an Expert
          </Link>
        </div>
      </div>
    </section>
  );
}
