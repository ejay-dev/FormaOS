/**
 * HeroStaticShell - Server Component
 *
 * Renders the above-the-fold hero content as plain HTML using the default
 * runtime copy from DEFAULT_RUNTIME_MARKETING. This component has no
 * JavaScript dependencies and is fully indexed by crawlers on first load.
 *
 * 2026-06-03 (editorial redesign): dropped the stock photo AND the
 * split-hero-with-dashboard-card (both read as generic templates). The hero
 * is now type-led and editorial — one confident Sora headline on a neutral
 * charcoal canvas, left-anchored with heavy whitespace, no glass cards, no
 * glows. The only product artifact is a real append-only evidence-chain
 * ledger (JetBrains Mono, columnar, like an audit log) — realism and
 * specificity carry it, not decoration. All values are illustrative.
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

// Illustrative audit log — what a customer's evidence chain renders, NOT a
// claim about FormaOS. Reverse-chronological, like a real append-only log.
// Specificity (NDIS indicator numbers, Rekor) is what makes it read as a
// real engineering artifact rather than marketing decoration.
const LEDGER = [
  {
    time: '09:14:02',
    ok: true,
    event: 'control satisfied',
    ref: 'NDIS PS · Indicator 2.1',
    hash: 'a91f3c',
  },
  {
    time: '09:02:47',
    ok: true,
    event: 'evidence anchored',
    ref: 'Sigstore Rekor',
    hash: '7b22e1',
  },
  {
    time: '08:51:10',
    ok: true,
    event: 'owner assigned',
    ref: 'Access control owner',
    hash: 'c40d9a',
  },
  {
    time: '08:30:55',
    ok: false,
    event: 'action blocked',
    ref: 'missing approval',
    hash: '5e1f88',
  },
] as const;

export function HeroStaticShell() {
  const primaryHref = heroCopy.primaryCtaHref;
  const secondaryHref = heroCopy.secondaryCtaHref;

  return (
    <section
      className="home-hero home-hero--dense relative isolate overflow-hidden"
      aria-label="Hero"
    >
      {/* Neutral charcoal canvas — on-brand (#1C1E1F family), not the generic
          blue SaaS gradient. Overrides the .home-hero background. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(125% 90% at 12% -10%, #17181b 0%, #0c0d10 46%, #060607 100%)',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
        {/* Eyebrow — a single quiet monospace label, no pill / hairlines / icon */}
        <div className="mb-9 font-mono text-[11px] uppercase tracking-[0.28em] text-slate-500">
          {heroCopy.badgeText}
        </div>

        {/* Headline — the whole hero. Sora, oversized, tight, left-anchored.
            The continuation line carries in brand grey as a counterpoint. */}
        <h1 className="max-w-4xl font-display text-[clamp(2.5rem,6vw+0.4rem,4.75rem)] font-semibold leading-[0.98] tracking-[-0.035em] text-white">
          {heroCopy.headlinePrimary}
          <br />
          <span className="text-[#7d7d80]">{heroCopy.headlineAccent}</span>
        </h1>

        {/* Supporting line — restrained, single column, generous offset */}
        <p className="mt-8 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg">
          {heroCopy.subheadline}
        </p>

        {/* CTAs — one solid action + one quiet text link (no second button) */}
        <div className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-7">
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
              className="group inline-flex items-center gap-2 text-base font-medium text-slate-300 transition-colors hover:text-white"
              rel="noopener noreferrer"
            >
              {heroCopy.secondaryCtaLabel}
              <ArrowRight
                className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-300"
                aria-hidden="true"
              />
            </a>
          ) : (
            <Link
              href={secondaryHref}
              className="group inline-flex items-center gap-2 text-base font-medium text-slate-300 transition-colors hover:text-white"
            >
              {heroCopy.secondaryCtaLabel}
              <ArrowRight
                className="h-4 w-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-300"
                aria-hidden="true"
              />
            </Link>
          )}
        </div>

        {/* ── The one product artifact: an append-only evidence ledger ── */}
        <div className="mt-14 max-w-3xl border-t border-white/10 pt-6 lg:mt-16">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
              Evidence chain
            </span>
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
              append-only
            </span>
          </div>

          <div role="table" aria-label="Illustrative evidence chain">
            {LEDGER.map((row) => (
              <div
                key={row.hash}
                role="row"
                className="grid grid-cols-[0.9rem_auto_1fr_auto] items-baseline gap-x-4 border-b border-white/[0.05] py-2.5 last:border-0 sm:grid-cols-[0.9rem_5.5rem_1fr_13rem_auto] sm:gap-x-6"
              >
                <span
                  aria-hidden="true"
                  className={`font-mono text-xs ${row.ok ? 'text-emerald-400/70' : 'text-rose-400/70'}`}
                >
                  {row.ok ? '✓' : '✕'}
                </span>
                <span className="font-mono text-xs tabular-nums text-slate-500">
                  {row.time}
                </span>
                <span className="text-sm text-slate-200">{row.event}</span>
                <span className="hidden truncate font-mono text-xs text-slate-500 sm:block">
                  {row.ref}
                </span>
                <span className="font-mono text-xs text-slate-600">
                  #{row.hash}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 font-mono text-[11px] text-slate-600">
            Guided assessment &middot; AU-hosted by default &middot;
            Evidence-backed workflows
          </div>
        </div>
      </div>
    </section>
  );
}
