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
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';

const heroCopy = DEFAULT_RUNTIME_MARKETING.hero;

// 2026-05-23 (SEO sprint): the primary CTA path used to be rewritten
// onto `brand.seo.appUrl` (app.formaos.com.au), which sent every hero
// click through a wasted 308 hop and exposed the app subdomain as the
// CTA target. /contact is a marketing route, keep it relative so the
// click stays on the canonical www host.
const primaryExternal = /^https?:\/\//i.test(heroCopy.primaryCtaHref);
const secondaryExternal = /^https?:\/\//i.test(heroCopy.secondaryCtaHref);

export function HeroStaticShell() {
  const primaryHref = heroCopy.primaryCtaHref;
  const secondaryHref = heroCopy.secondaryCtaHref;

  return (
    <section
      className="home-hero home-hero--dense relative isolate overflow-hidden"
      aria-label="Hero"
    >
      {/* Server-rendered hero background image via next/image: AVIF/WebP +
          responsive srcset, priority auto-emits the preload on / only. */}
      <Image
        src="/marketing-media/home.jpg"
        alt=""
        aria-hidden
        priority
        fill
        sizes="100vw"
        quality={55}
        className="pointer-events-none object-cover opacity-[0.24]"
        style={{ objectPosition: '50% 30%' }}
      />
      {/* Static background - no animation, preserved for SEO and no-JS users */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/5 via-slate-950/25 to-slate-950/75" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_-5%,transparent_55%,rgba(3,7,18,0.65)_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_100%_at_0%_50%,rgba(3,7,18,0.40),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_100%_at_100%_50%,rgba(3,7,18,0.40),transparent_70%)]" />

      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-7xl flex-col items-center justify-center px-6 pb-12 pt-16 text-center sm:px-8 sm:pt-24 lg:px-12 lg:pt-28">
        {/* Eyebrow, restrained typographic label flanked by hairlines,
            no pill / icon / colour. */}
        <div className="mb-7 flex items-center justify-center gap-4">
          <span className="hidden h-px w-10 bg-white/20 sm:block" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:text-xs">
            {heroCopy.badgeText}
          </span>
          <span className="hidden h-px w-10 bg-white/20 sm:block" />
        </div>

        {/* Primary headline - the core SEO H1 */}
        <h1 className="max-w-5xl text-[clamp(1.75rem,5vw+0.5rem,2.35rem)] font-semibold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-7xl">
          <span>{heroCopy.headlinePrimary}</span>
          <br />
          <span className="text-foreground">
            {heroCopy.headlineAccent}
          </span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-200 sm:text-lg lg:text-xl">
          {heroCopy.subheadline}
        </p>

        {/* CTAs */}
        <div className="mt-8 flex w-full max-w-xl flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          {primaryExternal ? (
            <a
              href={primaryHref}
              className="mk-btn mk-btn-primary group min-h-[50px] justify-center px-8 py-4 text-base sm:text-lg"
              rel="noopener noreferrer"
            >
              <span>{heroCopy.primaryCtaLabel}</span>
              <ArrowRight
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </a>
          ) : (
            <Link
              href={primaryHref}
              className="mk-btn mk-btn-primary group min-h-[50px] justify-center px-8 py-4 text-base sm:text-lg"
            >
              <span>{heroCopy.primaryCtaLabel}</span>
              <ArrowRight
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          )}

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
          Guided assessment &middot; AU-hosted by default &middot;
          Evidence-backed workflows
        </p>
      </div>
    </section>
  );
}
