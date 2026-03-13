/**
 * HeroStaticShell - Server Component
 *
 * Renders the above-the-fold hero as plain HTML for crawlers and LCP.
 * Matches HeroSection layout exactly — no decorative effects.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';
import { brand } from '@/config/brand';

const heroCopy = DEFAULT_RUNTIME_MARKETING.hero;
const appBase = brand.seo.appUrl.replace(/\/$/, '');

const PROOF_POINTS = [
  { stat: '7', label: 'Framework packs', sub: 'ISO 27001 · SOC 2 · NDIS · HIPAA · GDPR' },
  { stat: '70+', label: 'Pre-built controls', sub: 'Ready to deploy' },
  { stat: '< 5 min', label: 'Audit export', sub: 'Framework-mapped evidence bundles' },
] as const;

export function HeroStaticShell() {
  const primaryHref = heroCopy.primaryCtaHref.startsWith('/')
    ? `${appBase}${heroCopy.primaryCtaHref}`
    : heroCopy.primaryCtaHref;

  const secondaryHref = heroCopy.secondaryCtaHref;
  const secondaryExternal = /^https?:\/\//i.test(secondaryHref);

  return (
    <section className="home-hero relative isolate overflow-hidden" aria-label="Hero">
      {/* Single restrained gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_-10%,rgba(20,184,166,0.07),transparent_65%)]" />

      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-4xl flex-col items-center justify-center px-6 pb-20 pt-28 text-center sm:px-8 sm:pt-36 lg:pt-44">

        {/* Eyebrow */}
        <p className="mb-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-500/80">
          {heroCopy.badgeText}
        </p>

        {/* Headline */}
        <h1 className="max-w-3xl text-[2.6rem] font-semibold leading-[1.07] tracking-[-0.03em] text-white sm:text-5xl lg:text-[3.75rem] lg:leading-[1.05]">
          {heroCopy.headlinePrimary}
          <br />
          <span className="text-teal-400">{heroCopy.headlineAccent}</span>
        </h1>

        {/* Subheadline */}
        <p className="mt-7 max-w-xl text-[1.05rem] leading-[1.75] text-slate-400 sm:text-lg">
          {heroCopy.subheadline}
        </p>

        {/* CTAs */}
        <div className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-3">
          <a
            href={primaryHref}
            className="mk-btn mk-btn-primary group min-h-[50px] justify-center px-8 py-3.5 text-[0.9375rem] font-semibold"
          >
            <span>{heroCopy.primaryCtaLabel}</span>
            <ArrowRight className="h-4 w-4" />
          </a>

          {secondaryExternal ? (
            <a
              href={secondaryHref}
              className="mk-btn mk-btn-secondary min-h-[50px] justify-center px-8 py-3.5 text-[0.9375rem]"
            >
              {heroCopy.secondaryCtaLabel}
            </a>
          ) : (
            <Link
              href={secondaryHref}
              className="mk-btn mk-btn-secondary min-h-[50px] justify-center px-8 py-3.5 text-[0.9375rem]"
            >
              {heroCopy.secondaryCtaLabel}
            </Link>
          )}
        </div>

        {/* Proof bar */}
        <div className="mt-16 w-full max-w-2xl">
          <div className="grid grid-cols-3 divide-x divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            {PROOF_POINTS.map((item) => (
              <div key={item.label} className="px-5 py-5 text-center">
                <p className="text-2xl font-semibold tabular-nums text-white lg:text-3xl">
                  {item.stat}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-300">{item.label}</p>
                <p className="mt-0.5 text-[11px] text-slate-600">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
