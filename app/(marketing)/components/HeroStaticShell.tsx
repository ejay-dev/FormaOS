/**
 * HeroStaticShell - Server Component
 *
 * Renders the above-the-fold hero as plain HTML for crawlers and LCP.
 * Clean, enterprise design — no decorative effects.
 */

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';
import { brand } from '@/config/brand';

const heroCopy = DEFAULT_RUNTIME_MARKETING.hero;
const appBase = brand.seo.appUrl.replace(/\/$/, '');

const PROOF_POINTS = [
  {
    stat: '7',
    label: 'Framework packs',
    detail: 'ISO 27001, SOC 2, NDIS, HIPAA, GDPR + more',
  },
  {
    stat: '70+',
    label: 'Pre-built controls',
    detail: 'Ready to deploy, not configure',
  },
  {
    stat: '<5min',
    label: 'Audit export',
    detail: 'Framework-mapped evidence bundles',
  },
] as const;

const FRAMEWORKS = [
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
      {/* Subtle top-center gradient for depth */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.08),transparent_70%)]" />

      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-5xl flex-col items-center justify-center px-6 pb-20 pt-24 text-center sm:px-8 sm:pt-32 lg:pt-40">
        {/* Badge */}
        <div className="mk-badge mk-badge--section mb-8">
          {heroCopy.badgeText}
        </div>

        {/* Headline */}
        <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]">
          {heroCopy.headlinePrimary}
          <br />
          <span className="text-teal-400">{heroCopy.headlineAccent}</span>
        </h1>

        {/* Subheadline */}
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
          {heroCopy.subheadline}
        </p>

        {/* CTAs */}
        <div className="mt-10 flex w-full max-w-md flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <a
            href={primaryHref}
            className="mk-btn mk-btn-primary group min-h-[48px] justify-center px-7 py-3.5 text-base"
          >
            <span>{heroCopy.primaryCtaLabel}</span>
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </a>

          {secondaryExternal ? (
            <a
              href={secondaryHref}
              className="mk-btn mk-btn-secondary min-h-[48px] justify-center px-7 py-3.5 text-base"
              rel="noopener noreferrer"
            >
              {heroCopy.secondaryCtaLabel}
            </a>
          ) : (
            <Link
              href={secondaryHref}
              className="mk-btn mk-btn-secondary min-h-[48px] justify-center px-7 py-3.5 text-base"
            >
              {heroCopy.secondaryCtaLabel}
            </Link>
          )}
        </div>

        {/* Proof points */}
        <div className="mt-16 grid w-full max-w-3xl gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] sm:grid-cols-3">
          {PROOF_POINTS.map((item) => (
            <div key={item.label} className="px-6 py-5 text-left">
              <p className="text-2xl font-semibold text-white">{item.stat}</p>
              <p className="mt-1 text-sm font-medium text-slate-300">
                {item.label}
              </p>
              <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>

        {/* Framework strip */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-600">
            Built for
          </span>
          {FRAMEWORKS.map((fw) => (
            <span key={fw} className="text-sm text-slate-500">
              {fw}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
