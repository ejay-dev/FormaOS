'use client';

import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { duration } from '@/config/motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Play,
  ShieldCheck,
  Database,
  Clock,
  Eye,
  Sparkles,
} from 'lucide-react';
import { brand } from '@/config/brand';
import { HeroScrollRetentionController } from '@/components/motion/HeroScrollRetentionController';
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

const SIGNAL_PILLS = [
  {
    label: 'Workflow Orchestration',
    dotClass: 'bg-teal-400',
    chipClass: 'from-teal-500/20 to-cyan-500/10 border-teal-400/30',
  },
  {
    label: 'Control Ownership',
    dotClass: 'bg-emerald-400',
    chipClass: 'from-emerald-500/20 to-teal-500/10 border-emerald-400/30',
  },
  {
    label: 'Evidence Chains',
    dotClass: 'bg-amber-400',
    chipClass: 'from-amber-500/20 to-orange-500/10 border-amber-400/30',
  },
] as const;

const COMMAND_DECK_ROWS = [
  { label: 'Control Drift Detection', value: 'Live', status: 'Nominal' },
  { label: 'Evidence Chain Integrity', value: '99.98%', status: 'Verified' },
  { label: 'Audit Packet Assembly', value: '< 2 min', status: 'Ready' },
] as const;

const MOBILE_PROOF_METRICS = [
  { value: '85+', label: 'Pre-built Controls' },
  { value: '7', label: 'Framework Packs' },
  { value: '<2m', label: 'Audit Export Time' },
] as const;

const MICRO_TRUST_RAIL = [
  'ISO 27001',
  'SOC 2',
  'NDIS',
  'HIPAA',
  'GDPR',
] as const;

function FloatingMetricCard({
  value,
  label,
  trend,
  icon: Icon,
  delay,
  direction,
  motionEnabled,
}: {
  value: string;
  label: string;
  trend: string;
  icon: LucideIcon;
  delay: number;
  direction: 'left' | 'right';
  motionEnabled: boolean;
}) {
  return (
    <motion.div
      initial={motionEnabled ? { opacity: 0, x: direction === 'left' ? -40 : 40 } : false}
      animate={motionEnabled ? { opacity: 1, x: 0 } : undefined}
      transition={motionEnabled ? { duration: duration.slower, delay } : { duration: 0 }}
      whileHover={motionEnabled ? { scale: 1.025, y: -3 } : undefined}
      className="hero-floating-metric home-panel home-panel--soft relative w-full min-h-[188px] rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/70 to-slate-900/55 p-4 shadow-[0_20px_55px_rgba(0,0,0,0.45)] backdrop-blur-xl"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl border border-teal-400/25 bg-gradient-to-br from-teal-400/20 to-emerald-400/15 flex items-center justify-center">
              <Icon className="h-5 w-5 text-teal-300" />
            </div>
            <div>
              <div className="text-[1.15rem] font-semibold tracking-tight text-white">{value}</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-slate-300/90">{label}</div>
            </div>
          </div>
          <span className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-200">
            {trend}
          </span>
        </div>
        <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <p className="mt-auto pt-3 text-xs leading-relaxed text-slate-300/75">
          Continuous signal processing with policy-linked evidence correlation.
        </p>
      </div>
    </motion.div>
  );
}

function ProofMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/15 bg-gradient-to-b from-white/10 to-white/[0.04] p-4 text-center backdrop-blur-md">
      <div className="text-xl font-semibold tracking-tight text-white">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-slate-300">{label}</div>
    </div>
  );
}

function CommandDeck({ motionEnabled }: { motionEnabled: boolean }) {
  return (
    <motion.div
      initial={motionEnabled ? { opacity: 0, y: 24 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={motionEnabled ? { duration: duration.slower, delay: 0.82 } : { duration: 0 }}
      className="hero-command-deck mx-auto mb-8 w-full max-w-3xl rounded-2xl border border-white/15 bg-gradient-to-b from-slate-900/70 to-slate-950/70 p-4 sm:p-5 backdrop-blur-2xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-200">
            Live Control Plane Snapshot
          </span>
        </div>
        <span className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100">
          Enterprise Runtime
        </span>
      </div>

      <div className="mt-3 grid gap-2">
        {COMMAND_DECK_ROWS.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2"
          >
            <span className="text-xs text-slate-200">{row.label}</span>
            <span className="text-xs font-semibold text-white">{row.value}</span>
            <span className="text-[10px] uppercase tracking-[0.16em] text-emerald-200">{row.status}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
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
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end -20%'],
  });
  const router = useRouter();

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const updateVisibility = () =>
      setIsPageVisible(document.visibilityState !== 'hidden');
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility, {
      passive: true,
    });
    return () =>
      document.removeEventListener('visibilitychange', updateVisibility);
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

  const shouldAnimateIntro = motionPolicy.allowIntroMotion;
  const shouldAnimateBackdrop = motionPolicy.allowOrbitalMotion;
  const pulseClass = motionPolicy.allowPulseTokens ? 'animate-pulse' : '';

  const contentOpacity = useTransform(scrollYProgress, [0, 0.26, 0.84, 0.97], [1, 1, 0.38, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 0.26, 0.84, 0.97], [1, 1, 0.975, 0.945]);
  const contentY = useTransform(scrollYProgress, [0, 0.84, 1], [0, 46, 108]);
  const ctaOpacity = useTransform(scrollYProgress, [0, 0.72, 0.96], [1, 1, 0]);
  const ctaY = useTransform(scrollYProgress, [0, 1], [0, 24]);
  const metricY = useTransform(scrollYProgress, [0, 0.78, 1], [0, -22, -48]);
  const heroContentStyle = shouldReduceMotion
    ? undefined
    : { opacity: contentOpacity, scale: contentScale, y: contentY };
  const heroCtaStyle = shouldReduceMotion ? undefined : { opacity: ctaOpacity, y: ctaY };
  const heroMetricStyle = shouldReduceMotion ? undefined : { y: metricY };

  const primaryCtaHref = ctas.primary.href;
  const secondaryCtaHref = ctas.secondary.href;
  const handleRequestDemoClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (secondaryCtaHref !== '/contact') {
      return;
    }
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    router.push('/contact');
  };
  const handlePrimaryClick = () => {
    telemetry.trackCtaClick(
      'primary',
      ctas.primary.label,
      ctas.primary.href,
      {
        isAppDomain: ctas.primary.isAppDomain,
        isAuthRoute: ctas.primary.isAuthRoute,
      },
    );
  };
  const handleSecondaryClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    telemetry.trackCtaClick(
      'secondary',
      ctas.secondary.label,
      ctas.secondary.href,
      {
        isAppDomain: ctas.secondary.isAppDomain,
        isAuthRoute: ctas.secondary.isAuthRoute,
      },
    );
    handleRequestDemoClick(event);
  };

  return (
    <section
      ref={containerRef}
      className={`home-hero relative isolate flex items-center justify-center overflow-hidden pt-20 sm:pt-24 lg:pt-28 pb-16 sm:pb-20 md:pb-28 ${
        shouldAnimateBackdrop ? 'hero-backdrop--animated' : 'hero-backdrop--static'
      }`}
      style={{ minHeight: 'clamp(96svh, 106vh, 1160px)' }}
    >
      <div className="hero-aurora hero-aurora--left" />
      <div className="hero-aurora hero-aurora--right" />
      <div className="hero-beam hero-beam--left" />
      <div className="hero-beam hero-beam--right" />
      <div className="hero-grid-overlay" />
      <div className="hero-scanlines" />
      <div className="hero-vertical-fog" />
      <div className="hero-rim-light" />

      <div className="hero-metric-rails pointer-events-none absolute inset-0 z-20 hidden min-[1440px]:block">
        <div className="mx-auto flex h-full w-full max-w-[1460px] items-center justify-between px-5 2xl:px-8">
          <motion.div
            style={heroMetricStyle}
            className="pointer-events-auto flex w-[236px] flex-col gap-4 2xl:w-[252px]"
          >
            <FloatingMetricCard
              value="Real-time"
              label="Compliance Monitoring"
              trend="Continuous"
              icon={ShieldCheck}
              delay={0.76}
              direction="left"
              motionEnabled={shouldAnimateIntro}
            />
            <FloatingMetricCard
              value="Automated"
              label="Evidence Capture"
              trend="Built-in"
              icon={Database}
              delay={0.94}
              direction="left"
              motionEnabled={shouldAnimateIntro}
            />
          </motion.div>

          <motion.div
            style={heroMetricStyle}
            className="pointer-events-auto flex w-[236px] flex-col gap-4 2xl:w-[252px]"
          >
            <FloatingMetricCard
              value="Faster"
              label="Audit Defense"
              trend="Streamlined"
              icon={Clock}
              delay={1.1}
              direction="right"
              motionEnabled={shouldAnimateIntro}
            />
            <FloatingMetricCard
              value="Always-on"
              label="Activity Tracking"
              trend="Continuous"
              icon={Eye}
              delay={1.28}
              direction="right"
              motionEnabled={shouldAnimateIntro}
            />
          </motion.div>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-5 sm:px-6 lg:px-12 min-[1440px]:max-w-4xl 2xl:max-w-5xl">
        <div className="flex flex-col items-center text-center">
          <motion.div style={heroContentStyle} className="w-full">
            <motion.div
              initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimateIntro ? { duration: duration.slow, delay: 0.15 } : { duration: 0 }}
              className="hero-badge-shell mb-6 sm:mb-8 inline-flex items-center gap-2 rounded-full border border-teal-300/35 bg-teal-400/10 px-4 py-2.5 backdrop-blur-md"
            >
              <Sparkles className="h-4 w-4 text-teal-300" />
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-teal-200">
                {heroCopy.badgeText}
              </span>
            </motion.div>

            <motion.h1
              initial={shouldAnimateIntro ? { opacity: 0, y: 30 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.28 } : { duration: 0 }}
              className="hero-title-stack text-[2.35rem] sm:text-5xl lg:text-7xl font-semibold tracking-tight mb-5 sm:mb-6 leading-[1.03] text-white"
            >
              <span className="hero-title-main">{heroCopy.headlinePrimary}</span>
              <br />
              <span className="hero-title-accent bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                {heroCopy.headlineAccent}
              </span>
            </motion.h1>

            <motion.p
              initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.46 } : { duration: 0 }}
              className="mx-auto mb-4 max-w-3xl text-base sm:text-lg md:text-xl leading-relaxed text-slate-200/95"
            >
              {heroCopy.subheadline}
            </motion.p>

            <motion.div
              initial={shouldAnimateIntro ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.6 } : { duration: 0 }}
              className="mx-auto mb-7 sm:mb-9 max-w-3xl text-center"
            >
              <p className="mb-3 text-sm uppercase tracking-[0.16em] text-slate-200/90">
                Structure → Operationalize → Validate → Defend
              </p>
              <p className="mb-4 text-xs sm:text-sm text-slate-300/85">
                Used by compliance teams. Aligned to ISO/SOC frameworks. Built for
                audit defensibility in regulated environments.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-xs text-slate-200">
                {SIGNAL_PILLS.map((pill) => (
                  <span
                    key={pill.label}
                    className={`inline-flex items-center gap-1.5 rounded-full border bg-gradient-to-r px-3 py-1.5 ${pill.chipClass}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${pill.dotClass} ${pulseClass}`.trim()} />
                    {pill.label}
                  </span>
                ))}
              </div>
            </motion.div>

            <CommandDeck motionEnabled={shouldAnimateIntro} />

            <motion.div
              style={heroCtaStyle}
              initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.7 } : { duration: 0 }}
              className="mb-8 sm:mb-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4"
            >
              <motion.a
                href={primaryCtaHref}
                onClick={handlePrimaryClick}
                whileHover={
                  shouldAnimateIntro
                    ? {
                        scale: 1.025,
                        boxShadow: '0 0 32px rgba(45, 212, 191, 0.32)',
                      }
                    : undefined
                }
                whileTap={shouldAnimateIntro ? { scale: 0.98 } : undefined}
                className="mk-btn mk-btn-primary group hero-primary-cta min-h-[50px] w-full px-8 py-4 text-base sm:w-auto sm:text-lg"
              >
                <span>{heroCopy.primaryCtaLabel}</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </motion.a>

              <Link
                href={secondaryCtaHref}
                onClick={handleSecondaryClick}
                className="mk-btn mk-btn-secondary group hero-secondary-cta relative z-30 min-h-[50px] w-full px-8 py-4 text-base sm:w-auto sm:text-lg"
              >
                <Play className="h-5 w-5" />
                <span>{heroCopy.secondaryCtaLabel}</span>
              </Link>
            </motion.div>
          </motion.div>

          <motion.div
            initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.86 } : { duration: 0 }}
            className="w-full max-w-3xl"
          >
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {MOBILE_PROOF_METRICS.map((metric) => (
                <ProofMetric key={metric.label} value={metric.value} label={metric.label} />
              ))}
            </div>

            <div className="hero-trust-rail mt-4 rounded-xl border border-white/10 bg-white/[0.045] px-3 py-2.5 backdrop-blur-md">
              <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-slate-300">
                {MICRO_TRUST_RAIL.map((item) => (
                  <span key={item} className="rounded-full border border-white/12 px-2.5 py-1 text-slate-200/95">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="hero-exit-gradient" />

      <HeroScrollRetentionController
        heroRef={containerRef}
        stickyWindow={motionPolicy.stickyCtaWindow}
      />
    </section>
  );
}
