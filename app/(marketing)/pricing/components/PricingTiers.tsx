'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Layers } from 'lucide-react';
import { PUBLIC_PRICING_TIERS } from '@/lib/marketing/pricing';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import {
  AccentText,
  SectionEyebrow,
  StatusPill,
  SystemSection,
  systemPanelClass,
} from '@/components/marketing/SystemMarketingPrimitives';

/**
 * PricingTiers — four tier cards on the canonical SystemSection background.
 * No fake-terminal codes (FND/GRW/SCL/ENT), no mono-eyebrow, no per-tier
 * gradient rails. The featured tier is signalled with a StatusPill in the
 * standard "valid" tone — same affordance the rest of the marketing site
 * uses for emphasis.
 */
export function PricingTiers() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <SystemSection variant="cyan">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <SectionEyebrow icon={Layers} tone="live">
          Plan catalog
        </SectionEyebrow>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          One compliance OS,{' '}
          <AccentText>four ways to deploy it.</AccentText>
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-300">
          Foundation, Growth, and Scale are self-serve via Stripe. Enterprise
          is contracted with procurement and security review. Same compliance
          engine across every plan — only scope changes.
        </p>
      </div>

      <div className="grid items-stretch gap-5 lg:grid-cols-4">
        {PUBLIC_PRICING_TIERS.map((tier) => (
          <article
            key={tier.id}
            className={`group relative flex min-h-full flex-col p-7 sm:p-8 ${systemPanelClass} ${
              tier.featured
                ? 'border-emerald-300/40 bg-emerald-300/[0.04] hover:border-emerald-300/55'
                : ''
            }`}
          >
            {/*
              Pill row — reserved height (h-7) on every card so the four
              tier cards align at the tier-name baseline regardless of
              whether they carry a pill. Pills stay single-line via
              whitespace-nowrap so long copy ("BEST FOR MULTI-SITE",
              "PROCUREMENT-READY") doesn't wrap inside the pill.
            */}
            <div className="flex h-7 items-start">
              {tier.featured ? (
                <span className="whitespace-nowrap">
                  <StatusPill tone="valid">Most popular</StatusPill>
                </span>
              ) : tier.badge ? (
                <span className="whitespace-nowrap">
                  <StatusPill tone="neutral">{tier.badge}</StatusPill>
                </span>
              ) : null}
            </div>

            <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">
              {tier.name}
            </h3>
            <p className="mt-2 text-sm leading-snug text-slate-300">
              {tier.audience}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">{tier.audienceSize}</p>

            {/* Price */}
            <div className="mt-7 flex items-baseline gap-1.5">
              <span className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                {tier.priceLabel}
              </span>
              <span className="text-sm font-medium text-slate-400">
                {tier.priceSubtext}
              </span>
            </div>
            <p className="mt-2.5 text-xs leading-relaxed text-slate-400">
              {tier.trustNote}
            </p>

            {/* CTA */}
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
              className={`mt-7 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition ${
                tier.featured
                  ? 'mk-btn mk-btn-primary'
                  : 'mk-btn mk-btn-secondary'
              }`}
            >
              {tier.ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>

            {/* Summary */}
            <p className="mt-7 text-sm leading-relaxed text-slate-400">
              {tier.summary}
            </p>

            {/* Features */}
            <div className="mt-7 border-t border-white/[0.06] pt-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                Includes
              </p>
              <ul className="mt-4 space-y-3">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex gap-2.5 text-sm leading-snug text-slate-300"
                  >
                    <CheckCircle2
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        tier.featured ? 'text-emerald-300' : 'text-slate-400'
                      }`}
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      {/* Footer notes — plain row, no mono, no terminal punctuation */}
      <div className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-slate-400">
        <p>Prices in AUD, GST inclusive. Stripe-secured payments.</p>
        <div className="flex items-center gap-4">
          <span>SSO available on Enterprise</span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span>Cancel anytime</span>
        </div>
      </div>
    </SystemSection>
  );
}
