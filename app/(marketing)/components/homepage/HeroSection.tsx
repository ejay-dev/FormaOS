'use client';

import {
  motion,
  useScroll,
  useTransform,
} from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
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
      transition={{ duration: 0.8, delay }}
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
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const { state } = useCompliance();
  const router = useRouter();

  // Parallax: content fades slowly, bg elements drift at different rates
  const opacity = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.65], [1, 0.96]);
  const y = useTransform(scrollYProgress, [0, 0.65], [0, 60]);
  // Floating metrics drift faster for depth parallax
  const metricY = useTransform(scrollYProgress, [0, 0.5], [0, -40]);
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

  return (
    <section
      ref={containerRef}
      className="relative flex items-center justify-center overflow-hidden pt-24 pb-40 md:pb-48"
      style={{ minHeight: 'clamp(100vh, 110vh, 1200px)' }}
    >
      {/* Cinematic ambient particles */}
      <AmbientParticleLayer intensity="subtle" />

      {/* Premium Background Effects - Cinematic Gradient Layers */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-40 -right-40 w-[700px] h-[700px] bg-gradient-to-tl from-purple-500/15 via-pink-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 2,
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-radial from-cyan-500/5 to-transparent rounded-full" />
      </div>

      {/* WebGL 3D Node Field */}
      <div className="absolute inset-0 z-0">
        <WebGLNodeField state={state} />
      </div>

      {/* Cinematic Particle Field */}
      <div className="absolute inset-0 z-1">
        <CinematicField />
      </div>

      {/* Floating Metrics - Left Side (parallax drift) */}
      <motion.div style={{ y: metricY }} className="absolute left-8 lg:left-16 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 z-20">
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
      <motion.div style={{ y: metricY }} className="absolute right-8 lg:right-16 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 z-20">
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
          <motion.div style={{ opacity, scale, y }}>
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-8 backdrop-blur-sm"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium tracking-wide">
                Enterprise Compliance OS
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="text-lg sm:text-xl text-gray-400 mb-4 max-w-2xl mx-auto text-center leading-relaxed"
            >
              The operating system for governance, controls, evidence, and audit
              defense. Not a document repository. A system that enforces
              accountability.
            </motion.p>

            {/* OS Authority Statement */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.65 }}
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              <motion.a
                href={`${appBase}/auth/signup?plan=pro`}
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 40px rgba(6, 182, 212, 0.4)',
                }}
                whileTap={{ scale: 0.98 }}
                className="group px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg flex items-center gap-3 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </motion.a>

              <Link
                href="/contact"
                onClick={handleRequestDemoClick}
                className="group relative z-30 pointer-events-auto px-8 py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold text-lg flex items-center gap-3 hover:border-cyan-400/50 hover:bg-cyan-400/5 transition-all transform-gpu hover:scale-105 active:scale-95"
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
            transition={{ duration: 0.8, delay: 0.9 }}
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
