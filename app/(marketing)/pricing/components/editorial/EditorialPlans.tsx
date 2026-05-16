'use client';

import { PUBLIC_PRICING_TIERS } from '@/lib/marketing/pricing';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLead,
  EditorialButton,
  EditorialRule,
} from './primitives';

const TIER_SCOPE: Record<
  (typeof PUBLIC_PRICING_TIERS)[number]['id'],
  { sites: string; users: string; frameworks: string }
> = {
  foundation: { sites: '1', users: '10', frameworks: '2' },
  growth: { sites: '3', users: '25', frameworks: '4' },
  scale: { sites: '∞', users: '75', frameworks: '∞' },
  enterprise: { sites: '∞', users: '∞', frameworks: '∞' },
};

/**
 * EditorialPlans — the four tiers as a single editorial table, not a card
 * grid. Featured tier is signalled by a paper-tone wash + an italic
 * "Most popular" head, not a glow / scale / emerald tint. Per-row scope
 * is collapsed into a compact "sites · users · frameworks" cell so the
 * upgrade ladder reads horizontally across the page.
 */
export function EditorialPlans() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <EditorialSection
      id="pricing-table"
      num="01"
      label="The four plans"
      width="wide"
    >
      <div className="mb-10 max-w-3xl">
        <EditorialHeadline as="h2" size="lg" className="mb-5">
          Four tiers, <em>one engine.</em>
        </EditorialHeadline>
        <EditorialLead>
          The same compliance OS sits behind every plan. What changes is the
          scope &mdash; sites, frameworks, automation, and the procurement
          motion. Foundation, Growth, and Scale are self-serve through
          Stripe; Enterprise is contracted through procurement and security
          review.
        </EditorialLead>
      </div>

      <div className="overflow-x-auto">
        <table className="ed-table min-w-[42rem]">
          <thead>
            <tr>
              <th scope="col">Plan</th>
              <th scope="col" className="ed-table__num">
                Monthly
              </th>
              <th scope="col">Scope</th>
              <th scope="col">Best for</th>
              <th scope="col" className="ed-table__center">
                Procurement
              </th>
              <th scope="col" className="ed-table__center">
                <span className="sr-only">Action</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {PUBLIC_PRICING_TIERS.map((tier) => {
              const scope = TIER_SCOPE[tier.id];
              const featured = !!tier.featured;
              const cellCls = featured ? 'ed-table__featured' : undefined;
              return (
                <tr key={tier.id}>
                  <td className={cellCls}>
                    <h3 className="ed-table__plan-name m-0">{tier.name}</h3>
                    {featured ? (
                      <span className="mt-0.5 inline-block text-[0.75rem]">
                        <span className="ed-star">★</span>
                        <em className="ml-1">most popular</em>
                      </span>
                    ) : null}
                    <div className="ed-footnote mt-1">{tier.audience}</div>
                  </td>
                  <td className={`ed-table__num ${cellCls ?? ''}`}>
                    <span className="text-[1.0625rem] font-semibold text-[var(--ed-ink)]">
                      {tier.priceLabel}
                    </span>
                    <div className="ed-footnote mt-0.5">
                      {tier.priceSubtext.replace(/^\s*\/\s*/, '/ ')}
                    </div>
                  </td>
                  <td className={cellCls}>
                    <span className="text-[0.9375rem]">
                      <strong className="font-semibold text-[var(--ed-ink)]">
                        {scope.sites}
                      </strong>
                      <span className="text-[var(--ed-ink-faint)]"> sites</span>
                      <span className="mx-1.5 text-[var(--ed-ink-faint)]">·</span>
                      <strong className="font-semibold text-[var(--ed-ink)]">
                        {scope.users}
                      </strong>
                      <span className="text-[var(--ed-ink-faint)]"> users</span>
                      <span className="mx-1.5 text-[var(--ed-ink-faint)]">·</span>
                      <strong className="font-semibold text-[var(--ed-ink)]">
                        {scope.frameworks}
                      </strong>
                      <span className="text-[var(--ed-ink-faint)]"> frameworks</span>
                    </span>
                    <div className="ed-footnote mt-1">{tier.audienceSize}</div>
                  </td>
                  <td className={cellCls}>
                    <span className="text-[0.9375rem] leading-snug">
                      {tier.summary.split('. ')[0]}.
                    </span>
                  </td>
                  <td className={`ed-table__center ${cellCls ?? ''}`}>
                    <span className="ed-eyebrow-caps">
                      {tier.id === 'enterprise' ? 'Contracted' : 'Self-serve'}
                    </span>
                  </td>
                  <td className={`ed-table__center ${cellCls ?? ''}`}>
                    <EditorialButton
                      href={tier.ctaHref}
                      variant={featured ? 'accent' : 'solid'}
                      testId={`pricing-${tier.id}-cta`}
                      onClick={() =>
                        trackCtaClick({
                          surface: 'pricing',
                          section: 'tiers',
                          location: 'pricing_table_row',
                          ctaLabel: tier.ctaLabel,
                          ctaHref: tier.ctaHref,
                          variant: featured ? 'primary' : 'plan',
                          plan: tier.id,
                        })
                      }
                    >
                      {tier.ctaLabel} &rarr;
                    </EditorialButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <EditorialRule className="mt-8" />
      <p className="ed-footnote mt-3">
        Prices in AUD, GST inclusive. Stripe-secured payments. SSO &amp; SAML
        are Enterprise-only; data export is included on every plan with no
        contractual lock-in.
      </p>
    </EditorialSection>
  );
}
