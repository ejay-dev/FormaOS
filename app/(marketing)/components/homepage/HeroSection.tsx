'use client';

import {
  motion,
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

import dynamic from 'next/dynamic';
import { brand } from '@/config/brand';
import { AmbientParticleLayer } from '@/components/motion/AmbientParticleLayer';
import { HeroScrollRetentionController } from '@/components/motion/HeroScrollRetentionController';
import { useControlPlaneRuntime } from '@/lib/control-plane/runtime-client';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';
import { useDeviceTier } from '@/lib/device-tier';

const HomeHeroLaser = dynamic(
  () => import('./HomeHeroLaser').then((m) => m.HomeHeroLaser),
  { ssr: false, loading: () => null },
);

const appBase = brand.seo.appUrl.replace(/\/$/, '');

function FloatingMetricCard({
  value,
  label,
  trend,
  icon: Icon,
  delay,
  direction,
}: {
  value: string;
  label: string;
  trend: string;
  icon: LucideIcon;
  delay: number;
  direction: 'left' | 'right';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: direction === 'left' ? -40 : 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: duration.slower, delay }}
      whileHover={{ scale: 1.03 }}
      className="relative p-5 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 hover:border-teal-500/20 transition-all shadow-2xl shadow-black/30"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-emerald-500/20 flex items-center justify-center">
          <Icon className="w-6 h-6 text-teal-400" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-sm text-gray-400">{label}</div>
        </div>
      </div>
      <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-xs text-emerald-400 font-medium">
        {trend}
      </div>
    </motion.div>
  );
}

function ProofMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-4 rounded-xl bg-white/3 backdrop-blur-sm border border-white/5">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}


export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const tierConfig = useDeviceTier();
  const { snapshot } = useControlPlaneRuntime();
  const runtimeMarketing = snapshot?.marketing ?? DEFAULT_RUNTIME_MARKETING;
  const expensiveEffectsEnabled = runtimeMarketing.runtime.expensiveEffectsEnabled;
  const heroCopy = runtimeMarketing.hero;
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end -20%'],
  });
  const router = useRouter();

  // Animations enabled for all tiers (not just >=1024px)
  const shouldAnimateIntro =
    !shouldReduceMotion && tierConfig.tier !== 'low' && expensiveEffectsEnabled;

  // Buffered hero exit: hold fully visible first, then progressive cinematic fade.
  const contentOpacity = useTransform(scrollYProgress, [0, 0.24, 0.82, 0.96], [1, 1, 0.35, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 0.24, 0.82, 0.96], [1, 1, 0.97, 0.94]);
  const contentY = useTransform(scrollYProgress, [0, 0.82, 1], [0, 52, 110]);
  const ctaOpacity = useTransform(scrollYProgress, [0, 0.72, 0.96], [1, 1, 0]);
  const ctaY = useTransform(scrollYProgress, [0, 1], [0, 26]);
  const metricY = useTransform(scrollYProgress, [0, 0.78, 1], [0, -30, -56]);
  const bgFarY = useTransform(scrollYProgress, [0, 1], [0, -42]);
  const bgNearY = useTransform(scrollYProgress, [0, 1], [0, -84]);
  const heroContentStyle = shouldReduceMotion
    ? undefined
    : { opacity: contentOpacity, scale: contentScale, y: contentY };
  const heroCtaStyle = shouldReduceMotion ? undefined : { opacity: ctaOpacity, y: ctaY };
  const heroMetricStyle = shouldReduceMotion ? undefined : { y: metricY };
  const bgFarStyle = shouldReduceMotion ? undefined : { y: bgFarY };
  const bgNearStyle = shouldReduceMotion ? undefined : { y: bgNearY };
  const primaryCtaHref = heroCopy.primaryCtaHref.startsWith('/auth')
    ? `${appBase}${heroCopy.primaryCtaHref}`
    : heroCopy.primaryCtaHref;
  const secondaryCtaHref = heroCopy.secondaryCtaHref.startsWith('/auth')
    ? `${appBase}${heroCopy.secondaryCtaHref}`
    : heroCopy.secondaryCtaHref;
  const handleRequestDemoClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
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


  return (
    <section
      ref={containerRef}
      className="home-hero relative isolate flex items-center justify-center overflow-hidden pt-24 sm:pt-28 lg:pt-32 pb-24 sm:pb-32 md:pb-52"
      style={{ minHeight: 'clamp(100svh, 116vh, 1300px)' }}
    >
      {/* Cinematic laser beam — WebGL on desktop, static gradient on mobile */}
      <HomeHeroLaser />

      {/* Cinematic ambient particles — all tiers */}
      {expensiveEffectsEnabled ? <AmbientParticleLayer intensity="subtle" /> : null}

      {/* Premium Background Effects - Cinematic Gradient Layers */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          style={bgFarStyle}
          className="absolute -top-20 -left-20 sm:-top-40 sm:-left-40 w-[500px] sm:w-[800px] h-[500px] sm:h-[800px] bg-gradient-to-br from-teal-500/15 via-emerald-500/10 to-transparent rounded-full blur-3xl"
          animate={
            shouldAnimateIntro
              ? {
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.4, 0.3],
                }
              : undefined
          }
          transition={
            shouldAnimateIntro
              ? { duration: 8, repeat: Infinity, ease: 'easeInOut' }
              : undefined
          }
        />
        <motion.div
          style={bgNearStyle}
          className="absolute -bottom-20 -right-20 sm:-bottom-40 sm:-right-40 w-[400px] sm:w-[700px] h-[400px] sm:h-[700px] bg-gradient-to-tl from-amber-500/12 via-amber-500/6 to-transparent rounded-full blur-3xl"
          animate={
            shouldAnimateIntro
              ? {
                  scale: [1, 1.15, 1],
                  opacity: [0.2, 0.3, 0.2],
                }
              : undefined
          }
          transition={
            shouldAnimateIntro
              ? {
                  duration: 10,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 2,
                }
              : undefined
          }
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-gradient-radial from-teal-500/5 to-transparent rounded-full" />
      </div>

      {/* Floating Metrics - Left Side (parallax drift) — xl only */}
      <motion.div style={heroMetricStyle} className="absolute left-8 lg:left-16 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 z-20">
        <FloatingMetricCard
          value="Real-time"
          label="Compliance Monitoring"
          trend="Continuous"
          icon={ShieldCheck}
          delay={0.8}
          direction="left"
        />
        <FloatingMetricCard
          value="Automated"
          label="Evidence Capture"
          trend="Built-in"
          icon={Database}
          delay={1.0}
          direction="left"
        />
      </motion.div>

      {/* Floating Metrics - Right Side (parallax drift) — xl only */}
      <motion.div style={heroMetricStyle} className="absolute right-8 lg:right-16 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 z-20">
        <FloatingMetricCard
          value="Faster"
          label="Audit Defense"
          trend="Streamlined"
          icon={Clock}
          delay={1.2}
          direction="right"
        />
        <FloatingMetricCard
          value="Always-on"
          label="Activity Tracking"
          trend="Continuous"
          icon={Eye}
          delay={1.4}
          direction="right"
        />
      </motion.div>

      {/* Main Hero Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-5 sm:px-6 lg:px-12">
        <div className="flex flex-col items-center text-center">
          <motion.div style={heroContentStyle}>
            {/* Badge */}
            <motion.div
              initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimateIntro ? { duration: duration.slow, delay: 0.2 } : { duration: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-teal-500/10 border border-teal-500/30 mb-6 sm:mb-8 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span className="text-sm text-teal-400 font-medium tracking-wide">
                {heroCopy.badgeText}
              </span>
            </motion.div>

            {/* Headline — mobile-optimized type scale */}
            <motion.h1
              initial={shouldAnimateIntro ? { opacity: 0, y: 30 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.3 } : { duration: 0 }}
              className="text-[2.5rem] sm:text-5xl lg:text-7xl font-bold mb-5 sm:mb-6 leading-[1.08] text-white"
            >
              {heroCopy.headlinePrimary}
              <br />
              <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
                {heroCopy.headlineAccent}
              </span>
            </motion.h1>

            {/* Subheadline — readable mobile size */}
            <motion.p
              initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.5 } : { duration: 0 }}
              className="text-base sm:text-lg md:text-xl text-gray-400 mb-4 max-w-2xl mx-auto text-center leading-relaxed"
            >
              {heroCopy.subheadline}
            </motion.p>

            {/* OS Authority Statement */}
            <motion.div
              initial={shouldAnimateIntro ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.65 } : { duration: 0 }}
              className="mb-8 sm:mb-10 max-w-2xl mx-auto text-center"
            >
              <p className="text-sm text-gray-500 mb-3">
                Structure → Operationalize → Validate → Defend
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Used by compliance teams. Aligned to ISO/SOC frameworks. Built
                for audit defensibility.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                  Workflow Orchestration
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Control Ownership
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Evidence Chains
                </span>
              </div>
            </motion.div>

            {/* CTA Buttons — full-width mobile, side-by-side sm+ */}
            <motion.div
              style={heroCtaStyle}
              initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.7 } : { duration: 0 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16 w-full sm:w-auto"
            >
              <motion.a
                href={primaryCtaHref}
                whileHover={
                  shouldAnimateIntro
                    ? {
                        scale: 1.03,
                        boxShadow: '0 0 30px rgba(6, 182, 212, 0.3)',
                      }
                    : undefined
                }
                whileTap={shouldAnimateIntro ? { scale: 0.98 } : undefined}
                className="mk-btn mk-btn-primary group px-8 py-4 min-h-[48px] text-base sm:text-lg w-full sm:w-auto justify-center"
              >
                <span>{heroCopy.primaryCtaLabel}</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <Link
                href={secondaryCtaHref}
                onClick={handleRequestDemoClick}
                className="mk-btn mk-btn-secondary group relative z-30 pointer-events-auto px-8 py-4 min-h-[48px] text-base sm:text-lg w-full sm:w-auto justify-center"
              >
                <Play className="w-5 h-5" />
                <span>{heroCopy.secondaryCtaLabel}</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Proof Strip - Mobile Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.slower, delay: 0.9 }}
            className="xl:hidden grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-lg"
          >
            <ProofMetric value="Real-time" label="Compliance" />
            <ProofMetric value="Automated" label="Evidence" />
            <ProofMetric value="Faster" label="Audits" />
          </motion.div>
        </div>
      </div>

      {/* Gradient bridge — smooth depth transition to next section */}
      <div className="hero-exit-gradient" />

      {/* Sticky CTA that re-appears after hero CTAs scroll away */}
      <HeroScrollRetentionController heroRef={containerRef} />
    </section>
  );
}
