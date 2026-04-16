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
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';
import { brand } from '@/config/brand';

const heroCopy = DEFAULT_RUNTIME_MARKETING.hero;
const appBase = brand.seo.appUrl.replace(/\/$/, '');

export function HeroStaticShell() {
  const primaryHref = heroCopy.primaryCtaHref.startsWith('/')
    ? `${appBase}${heroCopy.primaryCtaHref}`
    : heroCopy.primaryCtaHref;

  const secondaryHref = heroCopy.secondaryCtaHref;
  const secondaryExternal = /^https?:\/\//i.test(secondaryHref);

  return (
    <section
      className="home-hero home-hero--dense relative isolate overflow-hidden"
      aria-label="Hero"
    >
      {/* Server-rendered hero background image - discovered in initial HTML for fast LCP */}
      <img
        src="/marketing-media/home.jpg"
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        decoding="async"
        sizes="100vw"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.24]"
        style={{ objectPosition: '50% 30%' }}
      />
      {/* Static background - no animation, preserved for SEO and no-JS users */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/5 via-slate-950/25 to-slate-950/75" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-5%,transparent_55%,rgba(3,7,18,0.65)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_100%_at_0%_50%,rgba(3,7,18,0.40),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_100%_at_100%_50%,rgba(3,7,18,0.40),transparent_70%)]" />

      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-7xl flex-col items-center justify-center px-6 pb-12 pt-16 text-center sm:px-8 sm:pt-24 lg:px-12 lg:pt-28">
        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-4 py-2.5 backdrop-blur-md">
          <ShieldCheck className="h-4 w-4 text-cyan-300" aria-hidden="true" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 sm:text-sm">
            {heroCopy.badgeText}
          </span>
        </div>

        {/* Primary headline - the core SEO H1 */}
        <h1 className="max-w-5xl text-[clamp(1.75rem,5vw+0.5rem,2.35rem)] font-semibold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-7xl">
          <span>{heroCopy.headlinePrimary}</span>
          <br />
          <span className="bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent">
            {heroCopy.headlineAccent}
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-200 sm:text-lg lg:text-xl">
          {heroCopy.subheadline}
        </p>

        {/* CTAs */}
        <div className="mt-8 flex w-full max-w-xl flex-col justify-center gap-3 sm:flex-row sm:gap-4">
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

        <p className="mt-6 text-sm text-slate-400">
          No credit card required &middot; 14-day free trial &middot; AU-hosted
          by default
        </p>
      </div>
    </section>
  );
}
