'use client';

import Link from 'next/link';
import { ArrowRight, Calculator, ShieldCheck } from 'lucide-react';
import { MANUAL_COMPLIANCE_COST_ANCHORS } from '@/lib/marketing/pricing';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';

export function PricingHero() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <section className="relative isolate overflow-hidden bg-slate-950 py-24 sm:py-28 lg:py-32">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(45,212,191,0.22),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(16,185,129,0.14),transparent_30%),linear-gradient(180deg,#020617_0%,#07111f_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-12">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Pricing and procurement
          </div>
          <h1
            id="pricing-hero-title"
            className="mt-6 max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl"
          >
            Compliance that enforces itself - not something your team forgets
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            FormaOS replaces manual compliance work with enforced workflows and
            real-time audit evidence. Pricing is anchored to risk, compliance
            scope, and organisational complexity - not feature unlocks.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact?type=compliance-plan&source=pricing_hero"
              onClick={() =>
                trackCtaClick({
                  surface: 'pricing',
                  section: 'hero',
                  location: 'hero_primary',
                  ctaLabel: 'Get Your Compliance Plan',
                  ctaHref: '/contact?type=compliance-plan&source=pricing_hero',
                  variant: 'primary',
                })
              }
              className="mk-btn mk-btn-primary min-h-[52px] justify-center px-8 py-4 text-base"
            >
              Get Your Compliance Plan
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="#pricing-table"
              onClick={() =>
                trackCtaClick({
                  surface: 'pricing',
                  section: 'hero',
                  location: 'hero_secondary',
                  ctaLabel: 'View Pricing',
                  ctaHref: '#pricing-table',
                  variant: 'secondary',
                })
              }
              className="mk-btn mk-btn-secondary min-h-[52px] justify-center px-8 py-4 text-base"
            >
              View Pricing
            </Link>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-white/[0.1] bg-white/[0.055] p-5 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.08] p-3">
              <Calculator className="h-5 w-5 text-emerald-200" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                The cost of doing this manually
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                Price against audit exposure first
              </h2>
            </div>
          </div>
          <div className="mt-6 divide-y divide-white/[0.08] overflow-hidden rounded-3xl border border-white/[0.08]">
            {MANUAL_COMPLIANCE_COST_ANCHORS.map((item) => (
              <div key={item.label} className="grid grid-cols-[7rem_1fr_1fr] gap-3 px-4 py-4 text-sm">
                <span className="font-semibold text-slate-400">{item.label}</span>
                <span className="text-red-100">{item.manual}</span>
                <span className="text-emerald-100">{item.formaos}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-400">
            One failed audit, emergency remediation cycle, or avoidable
            compliance gap can cost more than a year of the system that prevents
            it.
          </p>
        </aside>
      </div>
    </section>
  );
}
