'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { useMemo, type MouseEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { brand } from '@/config/brand';
import { useControlPlaneRuntime } from '@/lib/control-plane/runtime-client';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';
import {
  normalizeHeroCopy,
  resolveHomepageCtas,
  deriveHomepageMotionPolicy,
} from '@/lib/marketing/homepage-experience';
import { useHomepageTelemetry } from '@/lib/marketing/homepage-telemetry';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

const PROOF_POINTS = [
  { stat: '7', label: 'Framework packs', sub: 'ISO 27001 · SOC 2 · NDIS · HIPAA · GDPR' },
  { stat: '70+', label: 'Pre-built controls', sub: 'Ready to deploy' },
  { stat: '< 5 min', label: 'Audit export', sub: 'Framework-mapped evidence bundles' },
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
  const motionPolicy = useMemo(
    () =>
      deriveHomepageMotionPolicy({
        reducedMotion: Boolean(shouldReduceMotion),
        expensiveEffectsEnabled: runtimeMarketing.runtime.expensiveEffectsEnabled,
        pageVisible: true,
        heroInView: true,
        deviceTier: 'mid',
      }),
    [shouldReduceMotion, runtimeMarketing.runtime.expensiveEffectsEnabled],
  );
  const telemetry = useHomepageTelemetry(motionPolicy, { samplingRate: 0.75 });

  const handlePrimaryClick = (event: MouseEvent<HTMLAnchorElement>) => {
    telemetry.trackCtaClick('primary', ctas.primary.label, ctas.primary.href, {
      isAppDomain: ctas.primary.isAppDomain,
      isAuthRoute: ctas.primary.isAuthRoute,
    });
    if (event.defaultPrevented) return;
  };

  const handleSecondaryClick = (event: MouseEvent<HTMLAnchorElement>) => {
    telemetry.trackCtaClick('secondary', ctas.secondary.label, ctas.secondary.href, {
      isAppDomain: ctas.secondary.isAppDomain,
      isAuthRoute: ctas.secondary.isAuthRoute,
    });
    if (event.defaultPrevented) return;
  };

  const animate = !shouldReduceMotion;
  const primaryCtaHref = ctas.primary.href;
  const secondaryCtaHref = ctas.secondary.href;
  const secondaryExternal = isExternalHref(secondaryCtaHref);

  const fadeUp = (delay: number) => ({
    initial: animate ? { opacity: 0, y: 20 } : false,
    animate: { opacity: 1, y: 0 },
    transition: animate
      ? { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const }
      : { duration: 0 },
  });

  return (
    <section className="home-hero relative isolate overflow-hidden">
      {/* Single restrained gradient — top-center only */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_40%_at_50%_-10%,rgba(20,184,166,0.07),transparent_65%)]" />

      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-4xl flex-col items-center justify-center px-6 pb-20 pt-28 text-center sm:px-8 sm:pt-36 lg:pt-44">

        {/* Eyebrow — not a badge pill, just a label */}
        <motion.p
          {...fadeUp(0.05)}
          className="mb-8 text-[11px] font-semibold uppercase tracking-[0.12em] text-teal-500/80"
        >
          {heroCopy.badgeText}
        </motion.p>

        {/* Headline — large, restrained, weighted */}
        <motion.h1
          {...fadeUp(0.12)}
          className="max-w-3xl text-[2.6rem] font-semibold leading-[1.07] tracking-[-0.03em] text-white sm:text-5xl lg:text-[3.75rem] lg:leading-[1.05]"
        >
          {heroCopy.headlinePrimary}
          <br />
          <span className="text-teal-400">{heroCopy.headlineAccent}</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          {...fadeUp(0.22)}
          className="mt-7 max-w-xl text-[1.05rem] leading-[1.75] text-slate-400 sm:text-lg"
        >
          {heroCopy.subheadline}
        </motion.p>

        {/* CTAs */}
        <motion.div
          {...fadeUp(0.32)}
          className="mt-10 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center sm:gap-3"
        >
          <a
            href={primaryCtaHref}
            onClick={handlePrimaryClick}
            className="mk-btn mk-btn-primary group min-h-[50px] justify-center px-8 py-3.5 text-[0.9375rem] font-semibold"
          >
            <span>{heroCopy.primaryCtaLabel}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
          </a>

          {secondaryExternal ? (
            <a
              href={secondaryCtaHref}
              onClick={handleSecondaryClick}
              className="mk-btn mk-btn-secondary min-h-[50px] justify-center px-8 py-3.5 text-[0.9375rem]"
            >
              {heroCopy.secondaryCtaLabel}
            </a>
          ) : (
            <Link
              href={secondaryCtaHref}
              onClick={handleSecondaryClick}
              className="mk-btn mk-btn-secondary min-h-[50px] justify-center px-8 py-3.5 text-[0.9375rem]"
            >
              {heroCopy.secondaryCtaLabel}
            </Link>
          )}
        </motion.div>

        {/* Proof bar — clean grid, no decorative chrome */}
        <motion.div
          {...fadeUp(0.42)}
          className="mt-16 w-full max-w-2xl"
        >
          <div className="grid grid-cols-3 divide-x divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            {PROOF_POINTS.map((item) => (
              <div key={item.label} className="px-5 py-5 text-center">
                <p className="text-2xl font-semibold tabular-nums text-white lg:text-3xl">
                  {item.stat}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-300">
                  {item.label}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-600">{item.sub}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
