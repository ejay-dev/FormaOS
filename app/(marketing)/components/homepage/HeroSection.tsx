'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { type MouseEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { brand } from '@/config/brand';
import { useControlPlaneRuntime } from '@/lib/control-plane/runtime-client';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';
import {
  normalizeHeroCopy,
  resolveHomepageCtas,
} from '@/lib/marketing/homepage-experience';
import { useHomepageTelemetry } from '@/lib/marketing/homepage-telemetry';

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

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();
  const { snapshot } = useControlPlaneRuntime();
  const runtimeMarketing = snapshot?.marketing ?? DEFAULT_RUNTIME_MARKETING;
  const heroCopy = normalizeHeroCopy(
    runtimeMarketing.hero,
    DEFAULT_RUNTIME_MARKETING.hero,
  );
  const ctas = resolveHomepageCtas(heroCopy, appBase);
  const telemetry = useHomepageTelemetry(
    {
      allowIntroMotion: !shouldReduceMotion,
      allowOrbitalMotion: false,
      performanceProfile: 'balanced' as const,
    },
    { samplingRate: 0.75 },
  );

  const handlePrimaryClick = (event: MouseEvent<HTMLAnchorElement>) => {
    telemetry.trackCtaClick('primary', ctas.primary.label, ctas.primary.href, {
      isAppDomain: ctas.primary.isAppDomain,
      isAuthRoute: ctas.primary.isAuthRoute,
    });
    if (event.defaultPrevented) return;
  };

  const handleSecondaryClick = (event: MouseEvent<HTMLAnchorElement>) => {
    telemetry.trackCtaClick(
      'secondary',
      ctas.secondary.label,
      ctas.secondary.href,
      {
        isAppDomain: ctas.secondary.isAppDomain,
        isAuthRoute: ctas.secondary.isAuthRoute,
      },
    );
    if (event.defaultPrevented) return;
  };

  const animate = !shouldReduceMotion;
  const primaryCtaHref = ctas.primary.href;
  const secondaryCtaHref = ctas.secondary.href;
  const secondaryExternal = isExternalHref(secondaryCtaHref);

  const fadeUp = (delay: number) => ({
    initial: animate ? { opacity: 0, y: 16 } : false,
    animate: { opacity: 1, y: 0 },
    transition: animate
      ? { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] as const }
      : { duration: 0 },
  });

  return (
    <section className="home-hero relative isolate overflow-hidden">
      {/* Subtle top-center gradient */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(20,184,166,0.08),transparent_70%)]" />

      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-5xl flex-col items-center justify-center px-6 pb-20 pt-24 text-center sm:px-8 sm:pt-32 lg:pt-40">
        {/* Badge */}
        <motion.div
          {...fadeUp(0.05)}
          className="mk-badge mk-badge--section mb-8"
        >
          {heroCopy.badgeText}
        </motion.div>

        {/* Headline */}
        <motion.h1
          {...fadeUp(0.15)}
          className="max-w-4xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.5rem] lg:leading-[1.08]"
        >
          {heroCopy.headlinePrimary}
          <br />
          <span className="text-teal-400">{heroCopy.headlineAccent}</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          {...fadeUp(0.25)}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl"
        >
          {heroCopy.subheadline}
        </motion.p>

        {/* CTAs */}
        <motion.div
          {...fadeUp(0.35)}
          className="mt-10 flex w-full max-w-md flex-col justify-center gap-3 sm:flex-row sm:gap-4"
        >
          <a
            href={primaryCtaHref}
            onClick={handlePrimaryClick}
            className="mk-btn mk-btn-primary group min-h-[48px] justify-center px-7 py-3.5 text-base"
          >
            <span>{heroCopy.primaryCtaLabel}</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>

          {secondaryExternal ? (
            <a
              href={secondaryCtaHref}
              onClick={handleSecondaryClick}
              className="mk-btn mk-btn-secondary min-h-[48px] justify-center px-7 py-3.5 text-base"
            >
              {heroCopy.secondaryCtaLabel}
            </a>
          ) : (
            <Link
              href={secondaryCtaHref}
              onClick={handleSecondaryClick}
              className="mk-btn mk-btn-secondary min-h-[48px] justify-center px-7 py-3.5 text-base"
            >
              {heroCopy.secondaryCtaLabel}
            </Link>
          )}
        </motion.div>

        {/* Proof points */}
        <motion.div
          {...fadeUp(0.45)}
          className="mt-16 grid w-full max-w-3xl gap-px overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03] sm:grid-cols-3"
        >
          {PROOF_POINTS.map((item) => (
            <div key={item.label} className="px-6 py-5 text-left">
              <p className="text-2xl font-semibold text-white">{item.stat}</p>
              <p className="mt-1 text-sm font-medium text-slate-300">
                {item.label}
              </p>
              <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            </div>
          ))}
        </motion.div>

        {/* Framework strip */}
        <motion.div
          {...fadeUp(0.5)}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2"
        >
          <span className="text-xs font-medium uppercase tracking-wider text-slate-600">
            Built for
          </span>
          {FRAMEWORKS.map((fw) => (
            <span key={fw} className="text-sm text-slate-500">
              {fw}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
