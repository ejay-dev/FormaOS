/**
 * HeroStaticShell - Server Component
 *
 * Renders the above-the-fold hero content as plain HTML using the default
 * runtime copy from DEFAULT_RUNTIME_MARKETING. This component has no
 * JavaScript dependencies and is fully indexed by crawlers on first load.
 *
 * 2026-06-03 (product-as-hero redesign): the hero no longer floats centred
 * copy over a dimmed stock photo of strangers — that composition read as a
 * generated B2B template. It is now a two-column layout: the claim on the
 * left, a real product surface (the /app/compliance/health posture panel) on
 * the right. The panel is static HTML/SVG so it stays fast for LCP and is
 * fully present for no-JS users and crawlers.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';

const heroCopy = DEFAULT_RUNTIME_MARKETING.hero;

// 2026-05-23 (SEO sprint): the primary CTA path used to be rewritten
// onto `brand.seo.appUrl` (app.formaos.com.au), which sent every hero
// click through a wasted 308 hop and exposed the app subdomain as the
// CTA target. /contact is a marketing route — keep it relative so the
// click stays on the canonical www host.
const primaryExternal = /^https?:\/\//i.test(heroCopy.primaryCtaHref);
const secondaryExternal = /^https?:\/\//i.test(heroCopy.secondaryCtaHref);

// Illustrative posture rows — an example of what a customer's posture screen
// renders, NOT a marketing claim about FormaOS. Mirrors ValueProposition's
// PostureCard so the hero and the deeper section tell one coherent story.
const POSTURE_FRAMEWORKS = [
  { name: 'NDIS Practice Standards', score: 96 },
  { name: 'Aged Care Quality Standards', score: 91 },
  { name: 'ISO 27001', score: 88 },
] as const;

// Posture ring geometry (static — no animation in the server shell).
const RING_R = 52;
const RING_C = 2 * Math.PI * RING_R;
const RING_SCORE = 0.94;

export function HeroStaticShell() {
  const primaryHref = heroCopy.primaryCtaHref;
  const secondaryHref = heroCopy.secondaryCtaHref;

  return (
    <section
      className="home-hero home-hero--dense relative isolate overflow-hidden"
      aria-label="Hero"
    >
      {/* Restrained depth — one soft top glow + corner vignettes, no stock
          photo. Replaces the previous 4 stacked radials over a dimmed image. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_-10%,rgba(255,255,255,0.05),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_90%_at_100%_50%,rgba(3,7,18,0.55),transparent_72%)]" />

      <div className="relative z-10 mx-auto grid min-h-[inherit] max-w-7xl grid-cols-1 items-center gap-12 px-6 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-12 lg:py-24">
        {/* ── Left: the claim ── */}
        <div className="max-w-xl text-left">
          {/* Eyebrow — restrained typographic label with a single leading
              hairline, no pill / icon / colour. */}
          <div className="mb-6 flex items-center gap-3">
            <span className="h-px w-8 bg-white/25" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 sm:text-xs">
              {heroCopy.badgeText}
            </span>
          </div>

          {/* Primary headline - the core SEO H1 */}
          <h1 className="text-[clamp(2rem,4.5vw+0.5rem,2.4rem)] font-semibold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-[3.4rem]">
            <span>{heroCopy.headlinePrimary}</span>{' '}
            <span className="text-slate-400">{heroCopy.headlineAccent}</span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 max-w-lg text-base leading-relaxed text-slate-300 sm:text-lg">
            {heroCopy.subheadline}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            {primaryExternal ? (
              <a
                href={primaryHref}
                className="mk-btn mk-btn-primary group min-h-[50px] justify-center px-7 py-4 text-base sm:text-lg"
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
                className="mk-btn mk-btn-primary group min-h-[50px] justify-center px-7 py-4 text-base sm:text-lg"
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
                className="mk-btn mk-btn-secondary min-h-[50px] justify-center px-7 py-4 text-base sm:text-lg"
                rel="noopener noreferrer"
              >
                {heroCopy.secondaryCtaLabel}
              </a>
            ) : (
              <Link
                href={secondaryHref}
                className="mk-btn mk-btn-secondary min-h-[50px] justify-center px-7 py-4 text-base sm:text-lg"
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

        {/* ── Right: a real product surface ── */}
        <HeroPosturePanel />
      </div>
    </section>
  );
}

/**
 * A static replica of the /app/compliance/health posture panel. Renders the
 * actual product surface — score ring, per-framework rows, and a cryptographic
 * audit-chain footer — instead of a stock photo. All values are illustrative.
 */
function HeroPosturePanel() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto">
      {/* Soft lift behind the panel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 -z-10 bg-[radial-gradient(60%_50%_at_60%_30%,rgba(255,255,255,0.05),transparent_70%)]"
      />

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f1d]/80 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.9)] backdrop-blur-sm">
        {/* Window chrome — names the real route so it reads as the product */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
          </div>
          <span className="font-mono text-[11px] text-slate-500">
            /app/compliance/health
          </span>
        </div>

        <div className="p-5 sm:p-6">
          {/* Score ring + summary */}
          <div className="flex items-center gap-5">
            <div className="relative shrink-0">
              <svg viewBox="0 0 128 128" className="h-28 w-28">
                <circle
                  cx="64"
                  cy="64"
                  r={RING_R}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="9"
                />
                <circle
                  cx="64"
                  cy="64"
                  r={RING_R}
                  fill="none"
                  stroke="rgba(212,212,216,0.85)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - RING_SCORE)}
                  transform="rotate(-90 64 64)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums text-white">
                  94%
                </span>
                <span className="text-[9px] uppercase tracking-wider text-slate-500">
                  posture
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-white">
                Compliance posture
              </div>
              <div className="mt-1 text-xs leading-relaxed text-slate-500">
                Computed nightly from control evaluations across active
                framework packs.
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/90" />
                <span className="tabular-nums">47 / 50 controls active</span>
              </div>
            </div>
          </div>

          {/* Per-framework rows */}
          <div className="mt-6 space-y-3">
            {POSTURE_FRAMEWORKS.map((f) => (
              <div key={f.name}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">
                    {f.name}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-500">
                    {f.score}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-slate-300/80"
                    style={{ width: `${f.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Audit-chain footer — the cryptographic proof, named owner, time */}
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-3">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 shrink-0 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[11px] text-slate-300">
                #a91f3c · evidence anchored
              </div>
              <div className="text-[10px] text-slate-500">
                Access control owner · 12:04 AEST
              </div>
            </div>
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-slate-600">
              signed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
