import {
  MxBlock,
  MxContainer,
  MxDisplay,
  MxOutline,
  MxLead,
  MxButton,
  MxEyebrow,
  MxRule,
} from './primitives';

/**
 * MxHero — masthead + monumental headline on the oxblood block. "infrastructure"
 * is the typographic moment: outline-stroked Fraunces italic at xxl, breaking
 * the line, given oxygen by an asymmetric three-column grid. CTAs are bold
 * cream rectangles on the oxblood ground; "View Pricing" anchors to the
 * plans block at #pricing-table so existing e2e + analytics keep working.
 */
export function MxHero() {
  const today = new Date();
  const edition = today.toLocaleDateString('en-AU', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <MxBlock tone="oxblood" id="masthead" flushTop>
      <MxContainer width="full">
        <div className="grid grid-cols-12 items-baseline gap-x-6 border-b border-[var(--mx-bold-rule)] pb-5 pt-8 text-[var(--mx-cream)]">
          <p className="col-span-6 mx-eyebrow tracking-[0.32em] opacity-90 sm:col-span-4">
            FORMAOS · PRICING
          </p>
          <p className="col-span-6 text-right mx-eyebrow tracking-[0.32em] opacity-90 sm:col-span-8">
            FY26 EDITION · {edition.toUpperCase()} · NO. 04
          </p>
        </div>
      </MxContainer>

      <MxContainer width="full" className="pt-14 sm:pt-20 lg:pt-24">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">
          <div className="col-span-12 lg:col-span-8">
            <MxEyebrow italic className="mb-6 text-[var(--mx-mustard)]">
              A FormaOS report &mdash; on commercial scope, plainly stated
            </MxEyebrow>

            <MxDisplay
              as="h1"
              size="xxl"
              className="mb-8 text-[var(--mx-cream)]"
            >
              Compliance,
              <br />
              priced like{' '}
              <MxOutline thick className="text-[var(--mx-mustard)]">
                infrastructure
              </MxOutline>
              .
            </MxDisplay>

            <MxLead dropCap className="mb-8 max-w-2xl text-[var(--mx-cream)]">
              Most enterprise compliance pricing is opaque on purpose. Vendors
              hide their tiers behind <em>“request a quote”</em> so they can
              read the room and shape the number to fit. FormaOS publishes its
              scope ladder in full &mdash; compliance buying should not be a
              negotiation about whether you deserve evidence trails.
            </MxLead>

            <div className="flex flex-wrap items-center gap-4">
              <MxButton href="#pricing-table" variant="solid-cream">
                View Pricing &rarr;
              </MxButton>
              <MxButton
                href="/contact?type=compliance-plan&source=pricing_hero"
                variant="outline"
                className="text-[var(--mx-cream)]"
              >
                Get Compliance Plan
              </MxButton>
            </div>
          </div>

          <aside className="col-span-12 lg:col-span-4 lg:border-l lg:border-[var(--mx-bold-rule)] lg:pl-8">
            <p className="mx-eyebrow mb-6 text-[var(--mx-cream)] opacity-70">
              At a glance
            </p>
            <dl className="space-y-7 text-[var(--mx-cream)]">
              {[
                { k: 'PLANS', v: '4', sub: 'foundation → enterprise' },
                { k: 'FRAMEWORKS', v: '8+', sub: 'pre-built packs' },
                { k: 'TIME TO GO-LIVE', v: '14d', sub: 'typical median' },
              ].map((stat) => (
                <div key={stat.k} className="border-t border-[var(--mx-bold-rule)] pt-3">
                  <dt className="mx-eyebrow opacity-70">{stat.k}</dt>
                  <dd className="mt-1 flex items-baseline gap-2">
                    <span className="mx-monumental text-[clamp(2.75rem,5vw,4.5rem)]">
                      {stat.v}
                    </span>
                    <span className="mx-caption opacity-70">{stat.sub}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>

        <MxRule bold className="mt-16 mb-10 text-[var(--mx-cream)]" />

        {/* Newsstand strip — four plan names + prices at a glance, monumental */}
        <div className="grid grid-cols-2 gap-y-10 sm:grid-cols-4 sm:gap-x-6 text-[var(--mx-cream)]">
          {[
            { name: 'FOUNDATION', price: '$297', sub: '1 site · 10 users' },
            { name: 'GROWTH', price: '$797', sub: '3 sites · 25 users', popular: true },
            { name: 'SCALE', price: '$1,800', sub: '∞ sites · 75 users' },
            { name: 'ENTERPRISE', price: 'POA', sub: '∞ everything' },
          ].map((p) => (
            <div key={p.name} className="border-t border-[var(--mx-bold-rule)] pt-4">
              <p className="mx-eyebrow opacity-80">
                {p.name}
                {p.popular ? (
                  <span className="ml-2 text-[var(--mx-mustard)]">★</span>
                ) : null}
              </p>
              <p className="mt-3 mx-monumental text-[clamp(2.5rem,4.5vw,4rem)]">
                {p.price}
              </p>
              <p className="mt-2 mx-caption opacity-70">{p.sub}</p>
            </div>
          ))}
        </div>
      </MxContainer>
    </MxBlock>
  );
}
