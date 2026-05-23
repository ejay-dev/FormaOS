'use client';

import { PUBLIC_PRICING_TIERS } from '@/lib/marketing/pricing';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import {
  DsContainer,
  DsFolio,
  DsFolioHead,
  DsDisplay,
  DsLead,
  DsMeta,
  DsStamp,
  DsButton,
  DsPlan,
  DsPerf,
} from './primitives';

const TIER_DATA: Record<
  (typeof PUBLIC_PRICING_TIERS)[number]['id'],
  { id: string; sites: string; users: string; frameworks: string; rec?: string }
> = {
  foundation: { id: '2026-A-101', sites: '1', users: '10', frameworks: '2' },
  growth: { id: '2026-A-102', sites: '3', users: '25', frameworks: '4', rec: 'RECOMMENDED' },
  scale: { id: '2026-A-103', sites: '∞', users: '75', frameworks: '∞' },
  enterprise: { id: '2026-A-104', sites: '∞', users: '∞', frameworks: '∞' },
};

/**
 * DsPlans — "Appendix A" folio: the four tier cards laid out as classified
 * plan summaries, each with its own serial number, scope ladder fields, a
 * monumental price field, and a rubber-stamped recommendation marker on the
 * featured plan. Anchored at #pricing-table so the e2e hero-CTA scroll test
 * still works.
 */
export function DsPlans() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <DsContainer width="wide">
      <DsFolio
        id="pricing-table"
        tabLabel="§ APPENDIX A / THE FOUR PLANS"
        watermark="APPENDIX A"
      >
        <DsFolioHead
          strong
          meta={
            <>
              <DsMeta>
                <strong>§01</strong> / TIER LEDGER
              </DsMeta>
              <DsMeta className="hidden sm:inline-flex">
                4 PLAN RECORDS &middot; SAME COMPLIANCE ENGINE
              </DsMeta>
            </>
          }
        />

        <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_1fr] mb-10">
          <DsDisplay as="h2" size="lg">
            Four tiers, <em>one engine.</em>
          </DsDisplay>
          <DsLead className="lg:text-right">
            Same compliance OS sits behind every plan. What changes is the
            scope: sites, frameworks, automation, and the procurement motion.
          </DsLead>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PUBLIC_PRICING_TIERS.map((tier) => {
            const meta = TIER_DATA[tier.id];
            const featured = !!tier.featured;
            return (
              <DsPlan key={tier.id} className={featured ? 'border-[var(--ds-wax)] border-2' : ''}>
                {/* Stamp slot — top right of featured plan */}
                {featured ? (
                  <div className="pointer-events-none absolute -top-3 -right-3">
                    <DsStamp tone="red" size="sm">
                      RECOMMENDED
                    </DsStamp>
                  </div>
                ) : null}

                {/* Plan metadata row */}
                <div className="flex items-baseline justify-between gap-3 border-b border-[var(--ds-rule)] pb-3">
                  <span className="ds-plan__id">
                    REC. {meta.id}
                  </span>
                  <span className="ds-plan__id">
                    {tier.id === 'enterprise' ? 'CONTRACTED' : 'SELF-SERVE'}
                  </span>
                </div>

                <h3 className="mt-4 font-serif text-[1.5rem] font-semibold leading-tight text-[var(--ds-ink)]">
                  {tier.name}
                </h3>
                <p className="mt-2 ds-body text-[0.9375rem] leading-snug">
                  {tier.audience}
                </p>

                {/* Scope fields */}
                <dl className="mt-5 space-y-2 border-y border-dashed border-[var(--ds-rule)] py-4">
                  {[
                    { k: 'SITES', v: meta.sites },
                    { k: 'USERS', v: meta.users },
                    { k: 'FRAMEWORKS', v: meta.frameworks },
                  ].map((row) => (
                    <div key={row.k} className="flex items-baseline justify-between gap-3">
                      <dt className="ds-plan__id">{row.k}</dt>
                      <dd className="ds-serif font-medium text-[var(--ds-ink)] tabular-nums">
                        {row.v}
                      </dd>
                    </div>
                  ))}
                </dl>

                {/* Price block */}
                <div className="mt-6">
                  <p className="ds-plan__id">PRICE / MONTH</p>
                  <p className="mt-2 ds-plan__price">{tier.priceLabel}</p>
                  <p className="mt-1 ds-caption">
                    {tier.priceSubtext.replace(/^\s*\/\s*/, '/ ')}
                  </p>
                </div>

                <div className="mt-6">
                  <DsButton
                    href={tier.ctaHref}
                    variant={featured ? 'wax' : 'solid'}
                    testId={`pricing-${tier.id}-cta`}
                    className="w-full"
                    onClick={() =>
                      trackCtaClick({
                        surface: 'pricing',
                        section: 'tiers',
                        location: 'pricing_card',
                        ctaLabel: tier.ctaLabel,
                        ctaHref: tier.ctaHref,
                        variant: featured ? 'primary' : 'plan',
                        plan: tier.id,
                      })
                    }
                  >
                    {tier.ctaLabel}
                  </DsButton>
                </div>

                {/* Bottom summary — small, ds-caption tone */}
                <p className="mt-5 ds-caption">{tier.trustNote}</p>
              </DsPlan>
            );
          })}
        </div>

        <DsPerf className="mt-10 mb-4" />
        <DsMeta>
          PRICES IN AUD &middot; GST INCLUSIVE &middot; STRIPE-SECURED &middot;
          SSO + SAML ENTERPRISE-ONLY &middot; FULL DATA EXPORT ON ALL PLANS
        </DsMeta>
      </DsFolio>
    </DsContainer>
  );
}
