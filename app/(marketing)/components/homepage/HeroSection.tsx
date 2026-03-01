'use client';

import Link from 'next/link';
import {
  motion,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { duration } from '@/config/motion';
import { brand } from '@/config/brand';
import { SparklesCore } from '@/components/marketing/SparklesCore';
import { useControlPlaneRuntime } from '@/lib/control-plane/runtime-client';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';
import { useDeviceTier } from '@/lib/device-tier';
import {
  deriveHomepageMotionPolicy,
  evaluateHeroCopyRisk,
  normalizeHeroCopy,
  resolveHomepageCtas,
} from '@/lib/marketing/homepage-experience';
import { useHomepageTelemetry } from '@/lib/marketing/homepage-telemetry';

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

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const isHeroInView = useInView(containerRef, {
    amount: 0.2,
    margin: '0px 0px -15% 0px',
  });
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [prefersContrastMore, setPrefersContrastMore] = useState(false);
  const tierConfig = useDeviceTier();
  const { snapshot } = useControlPlaneRuntime();
  const runtimeMarketing = snapshot?.marketing ?? DEFAULT_RUNTIME_MARKETING;
  const expensiveEffectsEnabled = runtimeMarketing.runtime.expensiveEffectsEnabled;
  const heroCopy = normalizeHeroCopy(
    runtimeMarketing.hero,
    DEFAULT_RUNTIME_MARKETING.hero,
  );
  const ctas = resolveHomepageCtas(heroCopy, appBase);
  const motionPolicy = deriveHomepageMotionPolicy({
    reducedMotion: Boolean(shouldReduceMotion),
    expensiveEffectsEnabled,
    pageVisible: isPageVisible,
    heroInView: isHeroInView,
    deviceTier: tierConfig.tier,
    saveDataEnabled:
      typeof navigator !== 'undefined' &&
      Boolean(
        (
          navigator as Navigator & {
            connection?: { saveData?: boolean };
          }
        ).connection?.saveData,
      ),
    prefersContrastMore,
  });
  const telemetry = useHomepageTelemetry(motionPolicy, { samplingRate: 0.75 });

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const updateVisibility = () => setIsPageVisible(document.visibilityState !== 'hidden');
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility, {
      passive: true,
    });
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mq = window.matchMedia('(prefers-contrast: more)');
    const update = () => setPrefersContrastMore(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    telemetry.trackRuntimeProfile({
      tier: tierConfig.tier,
      expensiveEffectsEnabled,
      allowIntroMotion: motionPolicy.allowIntroMotion,
      allowOrbitalMotion: motionPolicy.allowOrbitalMotion,
      profile: motionPolicy.performanceProfile,
    });

    telemetry.trackHeroImpression({
      badgeText: heroCopy.badgeText,
      primaryCtaLabel: ctas.primary.label,
      secondaryCtaLabel: ctas.secondary.label,
    });

    const copyRisks = evaluateHeroCopyRisk(heroCopy);
    for (const issue of copyRisks) {
      telemetry.trackQualityWarning({
        issueLevel: issue.level,
        issueField: issue.field,
        issueMessage: issue.message,
      });
    }
  }, [
    ctas.primary.label,
    ctas.secondary.label,
    expensiveEffectsEnabled,
    heroCopy,
    motionPolicy.allowIntroMotion,
    motionPolicy.allowOrbitalMotion,
    motionPolicy.performanceProfile,
    telemetry,
    tierConfig.tier,
  ]);

  const handlePrimaryClick = (event: MouseEvent<HTMLAnchorElement>) => {
    telemetry.trackCtaClick(
      'primary',
      ctas.primary.label,
      ctas.primary.href,
      {
        isAppDomain: ctas.primary.isAppDomain,
        isAuthRoute: ctas.primary.isAuthRoute,
      },
    );
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

  const shouldAnimateIntro = motionPolicy.allowIntroMotion;
  const primaryCtaHref = ctas.primary.href;
  const secondaryCtaHref = ctas.secondary.href;
  const secondaryExternal = isExternalHref(secondaryCtaHref);

  return (
    <section
      ref={containerRef}
      className="home-hero relative isolate overflow-hidden"
      style={{ minHeight: 'clamp(88svh, 100vh, 1080px)' }}
    >
      <SparklesCore
        className="pointer-events-none absolute inset-0"
        background="#030712"
        particleColor="#67e8f9"
        minSize={0.7}
        maxSize={2.4}
        speed={3.6}
        particleDensity={150}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_32%,rgba(45,212,191,0.24)_0%,transparent_46%),radial-gradient(circle_at_78%_68%,rgba(167,139,250,0.26)_0%,transparent_48%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(125,211,252,0.09)_1px,transparent_1px),linear-gradient(to_bottom,rgba(125,211,252,0.07)_1px,transparent_1px)] bg-[size:46px_46px] opacity-35" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950/12 via-slate-950/46 to-slate-950/86" />

      <div className="relative z-10 mx-auto flex min-h-[inherit] max-w-7xl flex-col items-center justify-center px-6 pb-16 pt-28 text-center sm:px-8 sm:pt-32 lg:px-12">
        <motion.div
          initial={shouldAnimateIntro ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldAnimateIntro ? { duration: duration.slow, delay: 0.12 } : { duration: 0 }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-500/10 px-4 py-2.5 backdrop-blur-md"
        >
          <ShieldCheck className="h-4 w-4 text-cyan-300" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100 sm:text-sm">
            {heroCopy.badgeText}
          </span>
        </motion.div>

        <motion.h1
          initial={shouldAnimateIntro ? { opacity: 0, y: 26 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.24 } : { duration: 0 }}
          className="max-w-5xl text-[2.35rem] font-semibold leading-[1.04] tracking-tight text-white sm:text-5xl lg:text-7xl"
        >
          <span>{heroCopy.headlinePrimary}</span>
          <br />
          <span className="bg-gradient-to-r from-cyan-300 via-violet-300 to-emerald-300 bg-clip-text text-transparent">
            {heroCopy.headlineAccent}
          </span>
        </motion.h1>

        <motion.p
          initial={shouldAnimateIntro ? { opacity: 0, y: 18 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.36 } : { duration: 0 }}
          className="mt-6 max-w-3xl text-base leading-relaxed text-slate-200 sm:text-lg lg:text-xl"
        >
          {heroCopy.subheadline}
        </motion.p>

        <motion.div
          initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.5 } : { duration: 0 }}
          className="mt-9 flex w-full max-w-xl flex-col justify-center gap-3 sm:flex-row sm:gap-4"
        >
          <motion.a
            href={primaryCtaHref}
            onClick={handlePrimaryClick}
            whileHover={shouldAnimateIntro ? { scale: 1.03 } : undefined}
            whileTap={shouldAnimateIntro ? { scale: 0.98 } : undefined}
            className="mk-btn mk-btn-primary group min-h-[50px] justify-center px-8 py-4 text-base sm:text-lg"
          >
            <span>{heroCopy.primaryCtaLabel}</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </motion.a>

          {secondaryExternal ? (
            <a
              href={secondaryCtaHref}
              onClick={handleSecondaryClick}
              className="mk-btn mk-btn-secondary min-h-[50px] justify-center px-8 py-4 text-base sm:text-lg"
            >
              {heroCopy.secondaryCtaLabel}
            </a>
          ) : (
            <Link
              href={secondaryCtaHref}
              onClick={handleSecondaryClick}
              className="mk-btn mk-btn-secondary min-h-[50px] justify-center px-8 py-4 text-base sm:text-lg"
            >
              {heroCopy.secondaryCtaLabel}
            </Link>
          )}
        </motion.div>

        <motion.div
          initial={shouldAnimateIntro ? { opacity: 0, y: 18 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.62 } : { duration: 0 }}
          className="mt-8 grid w-full max-w-5xl gap-3 sm:grid-cols-3"
        >
          {SIGNAL_CARDS.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-cyan-200/10 bg-slate-950/55 px-4 py-3 text-left backdrop-blur-sm"
            >
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{card.label}</p>
              <p className="mt-1 text-base font-semibold text-white">{card.value}</p>
              <p className="mt-1 text-xs text-cyan-200/85">{card.detail}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={shouldAnimateIntro ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.72 } : { duration: 0 }}
          className="mt-6 flex w-full max-w-5xl flex-wrap items-center justify-center gap-2"
        >
          {TRUST_PILLS.map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-white/15 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-200"
            >
              {pill}
            </span>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/25 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100">
            <Sparkles className="h-3 w-3" />
            Live Governance Fabric
          </span>
        </motion.div>
      </div>
    </section>
  );
}
