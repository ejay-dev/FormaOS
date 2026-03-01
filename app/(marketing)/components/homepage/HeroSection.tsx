'use client';

import {
  motion,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import { duration } from '@/config/motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Clock3,
  Fingerprint,
  Play,
  Sparkles,
  Workflow,
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

const COMMAND_DECK_ROWS = [
  {
    label: 'Control Drift',
    value: '0 critical findings',
    status: 'Nominal',
    owner: 'Governance',
  },
  {
    label: 'Evidence Integrity',
    value: '99.98% chain confidence',
    status: 'Verified',
    owner: 'Assurance',
  },
  {
    label: 'Audit Packet SLA',
    value: '94 sec average export',
    status: 'Ready',
    owner: 'Reporting',
  },
  {
    label: 'Regulatory Escalations',
    value: '2 active workflows',
    status: 'Contained',
    owner: 'Ops',
  },
] as const;

const SIGNAL_STRIP = [
  {
    label: 'Framework Coverage',
    value: '147 active controls',
    delta: '+12 this quarter',
  },
  {
    label: 'Execution Reliability',
    value: '98.7% on-time closure',
    delta: '+4.2 pts',
  },
  {
    label: 'Board Reporting Cadence',
    value: 'Weekly evidence brief',
    delta: 'Monday 08:00',
  },
] as const;

const EXECUTION_LANES = [
  {
    icon: Workflow,
    title: 'Policy to Workflow',
    detail:
      'Convert obligations into owned tasks, due dates, and accountable approval steps.',
  },
  {
    icon: Fingerprint,
    title: 'Defensible Evidence',
    detail:
      'Capture tamper-evident artifacts with actor attribution and immutable history.',
  },
  {
    icon: BarChart3,
    title: 'Executive Oversight',
    detail:
      'Deliver always-current posture metrics for leadership and regulator conversations.',
  },
] as const;

const MICRO_TRUST_RAIL = [
  'ISO 27001',
  'SOC 2',
  'NDIS',
  'HIPAA',
  'GDPR',
  'Essential Eight',
] as const;

function SignalStrip({ motionEnabled }: { motionEnabled: boolean }) {
  return (
    <motion.div
      initial={motionEnabled ? { opacity: 0, y: 16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={motionEnabled ? { duration: duration.slower, delay: 0.08 } : { duration: 0 }}
      className="mx-auto mb-7 w-full max-w-5xl rounded-2xl border border-white/[0.1] bg-slate-950/50 p-3.5 backdrop-blur-md"
    >
      <div className="grid gap-2.5 sm:grid-cols-3">
        {SIGNAL_STRIP.map((signal) => (
          <div
            key={signal.label}
            className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3"
          >
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{signal.label}</p>
            <p className="mt-1 text-sm font-semibold text-white">{signal.value}</p>
            <p className="mt-1 text-[11px] font-medium text-emerald-300/90">{signal.delta}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function CommandDeck({ motionEnabled }: { motionEnabled: boolean }) {
  return (
    <motion.div
      initial={motionEnabled ? { opacity: 0, y: 24 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={motionEnabled ? { duration: duration.slower, delay: 0.82 } : { duration: 0 }}
      className="mx-auto mb-8 w-full max-w-5xl rounded-2xl border border-white/[0.1] bg-white/[0.04] p-4 sm:p-5 backdrop-blur-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
            Live Control Plane
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-white/[0.12] bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300 sm:inline-flex">
            Runtime Assured
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-teal-400/20 bg-teal-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300">
            <Clock3 className="h-3 w-3" />
            Enterprise
          </span>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {COMMAND_DECK_ROWS.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-1 items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 sm:grid-cols-[1fr_auto_auto_auto]"
          >
            <span className="text-xs text-slate-300">{row.label}</span>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.02] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300 sm:justify-self-start">
              {row.owner}
            </span>
            <span className="text-xs font-semibold text-white">{row.value}</span>
            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
              {row.status}
            </span>
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
      className="home-hero relative isolate flex items-center justify-center overflow-hidden pt-20 sm:pt-24 lg:pt-28 pb-16 sm:pb-20 md:pb-28"
      style={{ minHeight: 'clamp(90svh, 100vh, 1080px)' }}
    >
      {/* Subtle radial gradient — teal center glow, no aurora/beam effects */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(20,184,166,0.12)_0%,transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:44px_44px] opacity-20" />
      {/* Bottom fade to next section */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#0a0f1c]" />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6 lg:px-12">
        <div className="flex flex-col items-center text-center">
          <SignalStrip motionEnabled={shouldAnimateIntro} />

          {/* Badge */}
          <motion.div
            initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldAnimateIntro ? { duration: duration.slow, delay: 0.15 } : { duration: 0 }}
            className="mb-6 sm:mb-8 inline-flex items-center gap-2 rounded-full border border-teal-400/25 bg-teal-500/10 px-4 py-2.5"
          >
            <Sparkles className="h-4 w-4 text-teal-400" />
            <span className="text-xs sm:text-sm font-semibold uppercase tracking-[0.14em] text-teal-300">
              {heroCopy.badgeText}
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={shouldAnimateIntro ? { opacity: 0, y: 30 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.28 } : { duration: 0 }}
            className="text-[2.35rem] sm:text-5xl lg:text-7xl font-semibold tracking-tight mb-5 sm:mb-6 leading-[1.03] text-white"
          >
            <span>{heroCopy.headlinePrimary}</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
              {heroCopy.headlineAccent}
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.46 } : { duration: 0 }}
            className="mx-auto mb-8 sm:mb-10 max-w-3xl text-base sm:text-lg md:text-xl leading-relaxed text-slate-300"
          >
            {heroCopy.subheadline}
          </motion.p>

          {/* Command Deck */}
          <CommandDeck motionEnabled={shouldAnimateIntro} />

          <motion.div
            initial={shouldAnimateIntro ? { opacity: 0, y: 16 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.9 } : { duration: 0 }}
            className="mb-8 grid w-full max-w-5xl gap-3 sm:grid-cols-3"
          >
            {EXECUTION_LANES.map((lane) => {
              const Icon = lane.icon;
              return (
                <div
                  key={lane.title}
                  className="rounded-xl border border-white/[0.09] bg-slate-950/55 px-4 py-3.5 text-left"
                >
                  <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10">
                    <Icon className="h-4 w-4 text-cyan-300" />
                  </div>
                  <p className="text-sm font-semibold text-white">{lane.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">{lane.detail}</p>
                </div>
              );
            })}
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.7 } : { duration: 0 }}
            className="mb-8 sm:mb-10 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row sm:gap-4"
          >
            <motion.a
              href={primaryCtaHref}
              onClick={handlePrimaryClick}
              whileHover={shouldAnimateIntro ? { scale: 1.02 } : undefined}
              whileTap={shouldAnimateIntro ? { scale: 0.98 } : undefined}
              className="mk-btn mk-btn-primary group min-h-[50px] w-full px-8 py-4 text-base sm:w-auto sm:text-lg"
            >
              <span>{heroCopy.primaryCtaLabel}</span>
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </motion.a>

            <Link
              href={secondaryCtaHref}
              onClick={handleSecondaryClick}
              className="mk-btn mk-btn-secondary group relative z-30 min-h-[50px] w-full px-8 py-4 text-base sm:w-auto sm:text-lg"
            >
              <Play className="h-5 w-5" />
              <span>{heroCopy.secondaryCtaLabel}</span>
            </Link>
          </motion.div>

          {/* Trust Rail */}
          <motion.div
            initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.86 } : { duration: 0 }}
            className="w-full max-w-3xl"
          >
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
              <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] sm:text-[11px] uppercase tracking-[0.16em] text-slate-400">
                <span className="mr-1 text-slate-500">Trusted for</span>
                {MICRO_TRUST_RAIL.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/[0.1] bg-white/[0.02] px-2.5 py-1 text-slate-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <HeroScrollRetentionController
        heroRef={containerRef}
        stickyWindow={motionPolicy.stickyCtaWindow}
      />
    </section>
  );
}
