/**
 * HeroStaticShell - Server Component
 *
 * Renders the above-the-fold hero content as plain HTML using the default
 * runtime copy from DEFAULT_RUNTIME_MARKETING. This component has no
 * JavaScript dependencies and is fully indexed by crawlers on first load.
 *
 * The client-side HeroSection (with animations, control-plane overrides, and
 * telemetry) renders below the fold when skipHero is passed to FigmaHomepage.
 * For users with JS enabled, content is identical to what the client would
 * render with default configuration.
 */

import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';
import { brand } from '@/config/brand';

const heroCopy = DEFAULT_RUNTIME_MARKETING.hero;
const appBase = brand.seo.appUrl.replace(/\/$/, '');

const SIGNAL_CARDS = [
  {
    label: 'Framework Coverage',
    value: '147 active controls',
    detail: '+12 this quarter',
  },
  {
    label: 'Evidence Continuity',
    value: '99.98% chain confidence',
    detail: 'All systems verified',
  },
  {
    label: 'Audit Packet SLA',
    value: '94 sec average export',
    detail: 'P95 delivery speed',
  },
] as const;

const TRUST_PILLS = [
  'ISO 27001',
  'SOC 2',
  'NDIS',
  'HIPAA',
  'GDPR',
  'Essential Eight',
] as const;

export function HeroStaticShell() {
  const primaryHref = heroCopy.primaryCtaHref.startsWith('/')
    ? `${appBase}${heroCopy.primaryCtaHref}`
    : heroCopy.primaryCtaHref;

  const secondaryHref = heroCopy.secondaryCtaHref;
  const secondaryExternal = /^https?:\/\//i.test(secondaryHref);

  return (
    <section
      className="home-hero relative isolate overflow-hidden"
      aria-label="Hero"
    >
      {/* Static background - no animation, preserved for SEO and no-JS users */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/5 via-slate-950/25 to-slate-950/75" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-5%,transparent_55%,rgba(3,7,18,0.65)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_100%_at_0%_50%,rgba(3,7,18,0.40),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_100%_at_100%_50%,rgba(3,7,18,0.40),transparent_70%)]" />

      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-7xl flex-col items-center justify-center px-6 pb-16 pt-20 text-center sm:px-8 sm:pt-28 lg:px-12 lg:pt-32">
        {/* Badge */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-4 py-2.5 backdrop-blur-md">
          <ShieldCheck className="h-4 w-4 text-cyan-300" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 sm:text-sm">
            {heroCopy.badgeText}
          </span>
        </div>

        {/* Primary headline - the core SEO H1 */}
        <h1 className="max-w-5xl text-[clamp(1.75rem,5vw+0.5rem,2.35rem)] font-semibold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-7xl">
          <span>{heroCopy.headlinePrimary}</span>
          <br />
          <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300 bg-clip-text text-transparent">
            {heroCopy.headlineAccent}
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-200 sm:text-lg lg:text-xl">
          {heroCopy.subheadline}
        </p>

        {/* CTAs */}
        <div className="mt-9 flex w-full max-w-xl flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <a
            href={primaryHref}
            className="mk-btn mk-btn-primary group min-h-[50px] justify-center px-8 py-4 text-base sm:text-lg"
          >
            <span>{heroCopy.primaryCtaLabel}</span>
            <ArrowRight
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </a>

          {secondaryExternal ? (
            <a
              href={secondaryHref}
              className="mk-btn mk-btn-secondary min-h-[50px] justify-center px-8 py-4 text-base sm:text-lg"
              rel="noopener noreferrer"
            >
              {heroCopy.secondaryCtaLabel}
            </a>
          ) : (
            <Link
              href={secondaryHref}
              className="mk-btn mk-btn-secondary min-h-[50px] justify-center px-8 py-4 text-base sm:text-lg"
            >
              {heroCopy.secondaryCtaLabel}
            </Link>
          )}
        </div>

        {/* Signal cards */}
        <div className="mt-8 grid w-full max-w-5xl gap-3 sm:grid-cols-3">
          {SIGNAL_CARDS.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-cyan-200/10 bg-slate-950/55 px-4 py-3 text-left backdrop-blur-sm"
            >
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                {card.label}
              </p>
              <p className="mt-1 text-base font-semibold text-white">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-cyan-200/85">{card.detail}</p>
            </div>
          ))}
        </div>

        {/* Trust pills */}
        <div className="mt-6 flex w-full max-w-5xl flex-wrap items-center justify-center gap-2">
          {TRUST_PILLS.map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-200"
            >
              {pill}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Live Governance Fabric
          </span>
        </div>
      </div>
    </section>
  );
}
