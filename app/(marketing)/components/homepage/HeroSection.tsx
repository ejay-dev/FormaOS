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

import { useCompliance } from '../webgl/useComplianceState';
import dynamic from 'next/dynamic';
import { brand } from '@/config/brand';
import { AmbientParticleLayer } from '@/components/motion/AmbientParticleLayer';
import { HeroScrollRetentionController } from '@/components/motion/HeroScrollRetentionController';

const WebGLNodeField = dynamic(() => import('../webgl/NodeField'), {
  ssr: false,
  loading: () => null,
});
const CinematicField = dynamic(() => import('../motion/CinematicField'), {
  ssr: false,
  loading: () => null,
});

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
      whileHover={{ scale: 1.05, y: -5 }}
      className="relative p-5 rounded-2xl bg-gradient-to-br from-gray-900/60 to-gray-950/60 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all shadow-2xl shadow-black/30"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
          <Icon className="w-6 h-6 text-cyan-400" />
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
  const [enableHeavyVisuals, setEnableHeavyVisuals] = useState(false);
  const [allowHeavyVisuals, setAllowHeavyVisuals] = useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end -20%'],
  });
  const { state } = useCompliance();
  const router = useRouter();

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
  const shouldAnimateIntro = !shouldReduceMotion && allowHeavyVisuals;
  const handleRequestDemoClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
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

  useEffect(() => {
    const update = () => setAllowHeavyVisuals(window.innerWidth >= 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) return;
    if (!allowHeavyVisuals) {
      setEnableHeavyVisuals(false);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const onIdle = () => setEnableHeavyVisuals(true);

    if ('requestIdleCallback' in window) {
      idleId = (window as Window & {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
      }).requestIdleCallback(onIdle, { timeout: 900 });
    } else {
      timeoutId = setTimeout(onIdle, 280);
    }

    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
      if (idleId !== null && 'cancelIdleCallback' in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
    };
  }, [allowHeavyVisuals, shouldReduceMotion]);

  return (
    <section
      ref={containerRef}
      className="home-hero relative flex items-center justify-center overflow-hidden pt-24 sm:pt-28 lg:pt-32 pb-32 sm:pb-40 md:pb-52"
      style={{ minHeight: 'clamp(104svh, 116vh, 1300px)' }}
    >
      {/* Cinematic ambient particles */}
      <AmbientParticleLayer intensity="subtle" />

      {/* Premium Background Effects - Cinematic Gradient Layers */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          style={bgFarStyle}
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl"
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
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-purple-500/15 via-pink-500/10 to-transparent rounded-full blur-3xl"
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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-cyan-500/5 to-transparent rounded-full" />
      </div>

      {/* WebGL 3D Node Field */}
      {!shouldReduceMotion && allowHeavyVisuals && enableHeavyVisuals && (
        <div className="absolute inset-0 z-0">
          <WebGLNodeField state={state} />
        </div>
      )}

      {/* Cinematic Particle Field */}
      {!shouldReduceMotion && allowHeavyVisuals && enableHeavyVisuals && (
        <div className="absolute inset-0 z-1">
          <CinematicField />
        </div>
      )}

      {/* Floating Metrics - Left Side (parallax drift) */}
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

      {/* Floating Metrics - Right Side (parallax drift) */}
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
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col items-center text-center">
          <motion.div style={heroContentStyle}>
            {/* Badge */}
            <motion.div
              initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimateIntro ? { duration: duration.slow, delay: 0.2 } : { duration: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-8 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium tracking-wide">
                Enterprise Compliance OS
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={shouldAnimateIntro ? { opacity: 0, y: 30 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.3 } : { duration: 0 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              Operational Compliance,
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Built for Real Organizations
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.5 } : { duration: 0 }}
              className="text-lg sm:text-xl text-gray-400 mb-4 max-w-2xl mx-auto text-center leading-relaxed"
            >
              The operating system for governance, controls, evidence, and audit
              defense. Not a document repository. A system that enforces
              accountability.
            </motion.p>

            {/* OS Authority Statement */}
            <motion.div
              initial={shouldAnimateIntro ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.65 } : { duration: 0 }}
              className="mb-10 max-w-2xl mx-auto text-center"
            >
              <p className="text-sm text-gray-500 mb-3">
                Structure → Operationalize → Validate → Defend
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Used by compliance teams. Aligned to ISO/SOC frameworks. Built
                for audit defensibility.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-600">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Workflow Orchestration
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  Control Ownership
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-800/50 border border-gray-700/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                  Evidence Chains
                </span>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              style={heroCtaStyle}
              initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={shouldAnimateIntro ? { duration: duration.slower, delay: 0.7 } : { duration: 0 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <motion.a
                href={`${appBase}/auth/signup?plan=pro`}
                whileHover={
                  shouldAnimateIntro
                    ? {
                        scale: 1.05,
                        boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)',
                      }
                    : undefined
                }
                whileTap={shouldAnimateIntro ? { scale: 0.98 } : undefined}
                className="mk-btn mk-btn-primary group px-8 py-4 text-lg"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <Link
                href="/contact"
                onClick={handleRequestDemoClick}
                className="mk-btn mk-btn-secondary group relative z-30 pointer-events-auto px-8 py-4 text-lg"
              >
                <Play className="w-5 h-5" />
                <span>Request Demo</span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Proof Strip - Mobile Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: duration.slower, delay: 0.9 }}
            className="xl:hidden grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-lg"
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
