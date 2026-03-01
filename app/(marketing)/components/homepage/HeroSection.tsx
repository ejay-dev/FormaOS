'use client';

import {
  motion,
  useInView,
  useReducedMotion,
} from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Fingerprint,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { duration } from '@/config/motion';
import { brand } from '@/config/brand';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
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

function HomeHeroExtras({ motionEnabled }: { motionEnabled: boolean }) {
  return (
    <motion.div
      initial={motionEnabled ? { opacity: 0, y: 16 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={motionEnabled ? { duration: duration.slower, delay: 0.52 } : { duration: 0 }}
      className="mx-auto w-full max-w-5xl space-y-3.5"
    >
      <div className="rounded-2xl border border-white/[0.1] bg-slate-950/55 p-3.5 backdrop-blur-sm">
        <div className="grid gap-2.5 sm:grid-cols-3">
          {SIGNAL_STRIP.map((signal) => (
            <div
              key={signal.label}
              className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3 text-left"
            >
              <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{signal.label}</p>
              <p className="mt-1 text-sm font-semibold text-white">{signal.value}</p>
              <p className="mt-1 text-[11px] font-medium text-emerald-300">{signal.delta}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.1] bg-slate-950/55 p-3.5 backdrop-blur-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">
            Live Control Plane
          </p>
          <span className="rounded-full border border-cyan-400/25 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
            Enterprise Runtime
          </span>
        </div>

        <div className="grid gap-2">
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
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {EXECUTION_LANES.map((lane) => {
          const Icon = lane.icon;
          return (
            <div
              key={lane.title}
              className="rounded-xl border border-white/[0.09] bg-slate-950/60 px-4 py-3.5 text-left"
            >
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10">
                <Icon className="h-4 w-4 text-cyan-300" />
              </div>
              <p className="text-sm font-semibold text-white">{lane.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">{lane.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
        <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] uppercase tracking-[0.16em] text-slate-400 sm:text-[11px]">
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

  const handleSecondaryClick = () => {
    telemetry.trackCtaClick(
      'secondary',
      ctas.secondary.label,
      ctas.secondary.href,
      {
        isAppDomain: ctas.secondary.isAppDomain,
        isAuthRoute: ctas.secondary.isAuthRoute,
      },
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative"
    >
      <ImmersiveHero
        theme="home"
        badge={{
          icon: <Sparkles className="h-4 w-4 text-cyan-300" />,
          text: heroCopy.badgeText,
          colorClass: 'cyan',
        }}
        headline={
          <>
            <span>{heroCopy.headlinePrimary}</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
              {heroCopy.headlineAccent}
            </span>
          </>
        }
        subheadline={heroCopy.subheadline}
        extras={<HomeHeroExtras motionEnabled={motionPolicy.allowIntroMotion} />}
        primaryCta={{ href: ctas.primary.href, label: heroCopy.primaryCtaLabel }}
        secondaryCta={{ href: ctas.secondary.href, label: heroCopy.secondaryCtaLabel }}
        onPrimaryCtaClick={handlePrimaryClick}
        onSecondaryCtaClick={handleSecondaryClick}
      />
    </div>
  );
}
