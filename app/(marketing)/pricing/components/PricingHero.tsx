import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { SectionEyebrow } from '@/components/marketing/SystemMarketingPrimitives';

/**
 * PricingHero — server-rendered, mirrors HeroStaticShell on the home page.
 * Photo background + soft vignette + centered single column. No HUD,
 * no corner brackets, no particle field, no mono-eyebrow, no gradient
 * panel. Same `mk-btn` CTAs as every other marketing page.
 */
export function PricingHero() {
  return (
    <section
      className="relative isolate overflow-hidden"
      aria-label="Pricing"
    >
      {/* Photo background — fetched eagerly for fast LCP, consistent with home */}
      <img
        src="/marketing-media/pricing.jpg"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        sizes="100vw"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.22]"
        style={{ objectPosition: '50% 30%' }}
      />
      {/* Vignette stack — same three-layer pattern as HeroStaticShell */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/10 via-slate-950/30 to-slate-950/80" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-5%,transparent_55%,rgba(3,7,18,0.7)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_100%_at_0%_50%,rgba(3,7,18,0.40),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_100%_at_100%_50%,rgba(3,7,18,0.40),transparent_70%)]" />

      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-7xl flex-col items-center justify-center px-6 pb-16 pt-20 text-center sm:px-8 sm:pt-28 lg:px-12 lg:pt-32">
        <div className="mb-6">
          <SectionEyebrow icon={ShieldCheck} tone="live">
            Plans &amp; Pricing
          </SectionEyebrow>
        </div>

        <h1
          id="pricing-hero-title"
          className="max-w-5xl text-[clamp(1.75rem,5vw+0.5rem,2.35rem)] font-semibold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-7xl"
        >
          Compliance,{' '}
          <span className="text-slate-200">priced like infrastructure.</span>
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-200 sm:text-lg lg:text-xl">
          FormaOS replaces manual compliance work with enforced workflows and
          real-time audit evidence. Plans are anchored to risk, framework
          scope, and operational complexity — not feature unlocks.
        </p>

        <div className="mt-8 flex w-full max-w-xl flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="#pricing-table"
            className="mk-btn mk-btn-primary group min-h-[50px] justify-center px-8 py-4 text-base sm:text-lg"
          >
            <span>View pricing</span>
            <ArrowRight
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
          <Link
            href="/contact?type=compliance-plan&source=pricing_hero"
            className="mk-btn mk-btn-secondary min-h-[50px] justify-center px-8 py-4 text-base sm:text-lg"
          >
            Get a compliance plan
          </Link>
        </div>

        {/* Headline anchors — three stats, plain enterprise card row */}
        <dl className="mt-14 grid w-full max-w-3xl grid-cols-3 gap-3 sm:gap-4">
          {[
            { k: 'Plans', v: '4', sub: 'Foundation → Enterprise' },
            { k: 'Frameworks', v: '8', sub: 'pre-built packs' },
            { k: 'Setup', v: '<14d', sub: 'typical go-live' },
          ].map((stat) => (
            <div
              key={stat.k}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-5 text-left backdrop-blur-sm sm:px-6"
            >
              <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {stat.k}
              </dt>
              <dd className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {stat.v}
              </dd>
              <p className="mt-1 text-xs leading-snug text-slate-400 sm:text-sm">
                {stat.sub}
              </p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
