'use client';

import { PUBLIC_PRICING_TIERS } from '@/lib/marketing/pricing';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import {
  MxBlock,
  MxContainer,
  MxDisplay,
  MxLead,
  MxButton,
  MxSticker,
  MxScopeBar,
  MxRule,
} from './primitives';

type TierTone = 'bone' | 'mustard' | 'forest' | 'midnight';

const TIER_PRESENTATION: Record<
  (typeof PUBLIC_PRICING_TIERS)[number]['id'],
  {
    tone: TierTone;
    num: string;
    sites: { v: string; fill: number };
    users: { v: string; fill: number };
    frameworks: { v: string; fill: number };
    headline: string;
    rail: string;
  }
> = {
  foundation: {
    tone: 'bone',
    num: '01',
    sites: { v: '1', fill: 1 },
    users: { v: '10', fill: 1 },
    frameworks: { v: '2', fill: 1 },
    headline: 'Get audit-ready without drowning in paperwork.',
    rail: 'PLAN 01 / FOUNDATION',
  },
  growth: {
    tone: 'mustard',
    num: '02',
    sites: { v: '3', fill: 3 },
    users: { v: '25', fill: 3 },
    frameworks: { v: '4', fill: 3 },
    headline: 'Compliance infrastructure for the next three years.',
    rail: 'PLAN 02 / GROWTH',
  },
  scale: {
    tone: 'forest',
    num: '03',
    sites: { v: '∞', fill: 4 },
    users: { v: '75', fill: 4 },
    frameworks: { v: '∞', fill: 4 },
    headline: 'One platform across every site in your network.',
    rail: 'PLAN 03 / SCALE',
  },
  enterprise: {
    tone: 'midnight',
    num: '04',
    sites: { v: '∞', fill: 5 },
    users: { v: '∞', fill: 5 },
    frameworks: { v: '∞', fill: 5 },
    headline: 'We build it with you.',
    rail: 'PLAN 04 / ENTERPRISE',
  },
};

/**
 * MxPlans — the four tiers as four full-bleed colour-blocked rows, NOT
 * a card grid. Each tier claims its own palette (bone / mustard / forest /
 * midnight) so the page rhythm goes BOOM BOOM BOOM BOOM as you scroll.
 * Per-row layout: huge italic plan number on the left, plan name + audience
 * + scope-ladder bars in the middle, MONUMENTAL Fraunces italic price on
 * the right (set at 8-12rem), CTA + features below. Featured tier gets a
 * rotated "MOST POPULAR" sticker.
 */
export function MxPlans() {
  const { trackCtaClick } = useMarketingTelemetry();

  return (
    <>
      {/* Section opener — sits on cream so the next block's mustard hits hard */}
      <MxBlock tone="cream" id="pricing-table" tight flushBottom>
        <MxContainer width="full">
          <div className="grid grid-cols-12 items-end gap-6 border-b-[6px] border-[var(--mx-ink)] pb-6">
            <div className="col-span-12 lg:col-span-7">
              <p className="mx-eyebrow opacity-70">§01 / THE FOUR PLANS</p>
              <MxDisplay as="h2" size="xl" className="mt-4">
                Four tiers, <em>one engine.</em>
              </MxDisplay>
            </div>
            <div className="col-span-12 lg:col-span-5">
              <MxLead className="text-[var(--mx-ink-mid)]">
                The same compliance OS sits behind every plan. What changes is
                the <em>scope</em> &mdash; sites, frameworks, automation, and
                the procurement motion.
              </MxLead>
            </div>
          </div>
        </MxContainer>
      </MxBlock>

      {PUBLIC_PRICING_TIERS.map((tier, idx) => {
        const p = TIER_PRESENTATION[tier.id];
        const isLast = idx === PUBLIC_PRICING_TIERS.length - 1;
        const featured = !!tier.featured;
        return (
          <MxBlock
            tone={p.tone}
            rail={p.rail}
            key={tier.id}
            flushBottom={!isLast}
            flushTop
          >
            <MxContainer width="full">
              <div className="grid grid-cols-12 gap-x-6 gap-y-8 pt-12 sm:pt-16">
                {/* Plan number — huge italic glyph */}
                <div className="col-span-2 lg:col-span-1">
                  <span className="mx-plan-row__num opacity-50">{p.num}</span>
                </div>

                {/* Plan name + audience + scope ladder */}
                <div className="col-span-10 lg:col-span-6">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <h3 className="mx-display mx-display--xl m-0">
                      {tier.name}
                    </h3>
                    {featured ? (
                      <MxSticker>★ MOST POPULAR</MxSticker>
                    ) : null}
                  </div>
                  <p className="mt-4 mx-body-serif max-w-md">{tier.audience}</p>

                  <div className="mt-8 grid grid-cols-3 gap-6 border-t border-current/30 pt-5">
                    {[
                      { k: 'SITES', v: p.sites.v, fill: p.sites.fill },
                      { k: 'USERS', v: p.users.v, fill: p.users.fill },
                      { k: 'FRAMEWORKS', v: p.frameworks.v, fill: p.frameworks.fill },
                    ].map((m) => (
                      <div key={m.k}>
                        <p className="mx-eyebrow opacity-70">{m.k}</p>
                        <p className="mt-2 font-serif text-[2rem] font-medium leading-none tabular-nums">
                          {m.v}
                        </p>
                        <MxScopeBar
                          filled={m.fill}
                          total={5}
                          className="mt-3"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monumental price */}
                <div className="col-span-12 text-right lg:col-span-5 lg:pl-6">
                  <p className="mx-eyebrow opacity-70">PRICE / MONTH</p>
                  <p className="mt-2 mx-monumental text-[clamp(4.5rem,11vw,12rem)]">
                    {tier.priceLabel}
                  </p>
                  <p className="mt-2 mx-caption opacity-80">
                    {tier.priceSubtext.replace(/^\s*\/\s*/, '/ ')} &middot;{' '}
                    {tier.trustNote}
                  </p>
                </div>
              </div>

              <MxRule bold className="mt-12" />

              <div className="grid grid-cols-12 gap-x-6 gap-y-8 pt-8 pb-12">
                <div className="col-span-12 lg:col-span-7">
                  <p className="mx-body-serif">{p.headline}</p>
                  <p className="mt-3 mx-body opacity-80">{tier.summary}</p>
                </div>
                <div className="col-span-12 lg:col-span-5 lg:pl-6">
                  <p className="mx-eyebrow mb-4 opacity-70">INCLUDES</p>
                  <ul className="grid gap-1.5">
                    {tier.features.slice(0, 6).map((f) => (
                      <li
                        key={f}
                        className="flex items-baseline gap-2 mx-body text-[0.9375rem]"
                      >
                        <span className="text-[var(--mx-oxblood)] opacity-80">
                          §
                        </span>
                        <span className="opacity-90">{f}</span>
                      </li>
                    ))}
                  </ul>
                  {tier.features.length > 6 ? (
                    <p className="mt-3 mx-caption opacity-70">
                      + {tier.features.length - 6} more &mdash; see the matrix
                      below
                    </p>
                  ) : null}
                  <div className="mt-7">
                    <MxButton
                      href={tier.ctaHref}
                      variant={featured ? 'solid' : p.tone === 'midnight' ? 'solid-cream' : 'solid'}
                      testId={`pricing-${tier.id}-cta`}
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
                      {tier.ctaLabel} &rarr;
                    </MxButton>
                  </div>
                </div>
              </div>
            </MxContainer>
          </MxBlock>
        );
      })}
    </>
  );
}
