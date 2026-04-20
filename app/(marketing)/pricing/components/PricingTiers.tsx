'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { PUBLIC_PRICING_TIERS } from '@/lib/marketing/pricing';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import {
  AccentText,
  IconFrame,
  SectionEyebrow,
  StatusPill,
  SystemSection,
  systemPanelClass,
} from '@/components/marketing/SystemMarketingPrimitives';

export function PricingTiers() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <SystemSection id="pricing-table" variant="emerald">
        <div className="mx-auto max-w-3xl text-center">
          <SectionEyebrow icon={ShieldCheck} tone="valid">Infrastructure Pricing</SectionEyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
            Three buying paths, one <AccentText>enforced compliance system</AccentText>
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Pricing scales with compliance scope, organisational complexity, and
            risk exposure. Growth is the core plan for teams that need audit
            readiness, not just software access.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {PUBLIC_PRICING_TIERS.map((tier) => (
            <article
              key={tier.id}
              className={`relative flex min-h-full flex-col p-6 ${
                systemPanelClass
              } ${
                tier.featured
                  ? 'border-emerald-300/40 bg-emerald-300/[0.09] shadow-[0_28px_90px_rgba(6,78,59,0.34),0_0_58px_rgba(52,211,153,0.14)] lg:-mt-5 lg:mb-5'
                  : ''
              }`}
            >
              {tier.badge ? (
                <span className="absolute right-6 top-6">
                  <StatusPill tone="valid">{tier.badge}</StatusPill>
                </span>
              ) : null}
              <IconFrame icon={ShieldCheck} tone={tier.featured ? 'valid' : 'live'} />
              <h3 className="mt-6 text-2xl font-semibold text-white">{tier.name}</h3>
              <p className="mt-2 min-h-[2.5rem] text-sm leading-5 text-slate-300">
                {tier.audience}
              </p>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-tight text-white">
                  {tier.priceLabel}
                </span>
                <span className="pb-1 text-sm font-medium text-slate-400">
                  {tier.priceSubtext}
                </span>
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-400">{tier.summary}</p>

              <ul className="mt-7 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm leading-6 text-slate-300">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.ctaHref}
                data-testid={`pricing-${tier.id}-cta`}
                onClick={() =>
                  trackCtaClick({
                    surface: 'pricing',
                    section: 'tiers',
                    location: 'pricing_card',
                    ctaLabel: tier.ctaLabel,
                    ctaHref: tier.ctaHref,
                    variant: tier.featured ? 'primary' : 'plan',
                    plan: tier.id,
                  })
                }
                className={`mt-8 inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                  tier.featured
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-950/40 hover:brightness-110'
                    : 'border border-white/[0.1] bg-white/[0.06] text-white hover:bg-white/[0.1]'
                }`}
              >
                {tier.ctaLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
    </SystemSection>
  );
}
