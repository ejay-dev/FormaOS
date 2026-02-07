'use client';

import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Play,
  Box,
  Zap,
  CheckCircle,
  ShieldCheck,
  FileCheck,
  Database,
  Lock,
  Workflow,
  GitBranch,
  Layers,
  Terminal,
  Clock,
  Globe,
  Heart,
  Users,
  TrendingUp,
  GraduationCap,
  Building2,
  Shield,
  Eye,
  Key,
  History,
  RotateCcw,
  Sparkles,
  ChevronDown,
  AlertCircle,
  FileText,
} from 'lucide-react';

// Motion System Imports
import { MotionProvider } from './motion/MotionContext';
import { ComplianceProvider, useCompliance } from './webgl/useComplianceState';
import WebGLNodeField from './webgl/NodeField';
import CinematicField from './motion/CinematicField';
import { brand } from '@/config/brand';
import { ScrollShowcase } from '@/components/marketing/ScrollShowcase';
import type { ScrollScene } from '@/components/marketing/ScrollShowcase';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

// =============================================================================
// SCROLL SHOWCASE SCENE DATA
// =============================================================================

const showcaseScenes: ScrollScene[] = [
  {
    id: 'dashboard',
    title: 'Command Center Overview',
    description:
      'Your compliance posture at a glance. Real-time scores, active tasks, and framework health — all in one unified dashboard.',
    media: {
      type: 'image',
      src: '/marketing/screenshots/dashboard.png',
      alt: 'FormaOS Dashboard showing compliance overview',
    },
    accentColor: 'from-cyan-400 to-blue-500',
    features: [
      'Real-time compliance scoring',
      'Framework health indicators',
      'Priority task queue',
    ],
  },
  {
    id: 'tasks',
    title: 'Task Orchestration',
    description:
      'Every control has an owner. Every deadline has accountability. The OS ensures nothing falls through the cracks.',
    media: {
      type: 'image',
      src: '/marketing/screenshots/tasks.png',
      alt: 'FormaOS Task management interface',
    },
    accentColor: 'from-blue-500 to-purple-500',
    features: [
      'Automated task assignment',
      'Deadline tracking with escalation',
      'Immutable completion logs',
    ],
  },
  {
    id: 'vault',
    title: 'Evidence Vault',
    description:
      'Audit-ready evidence, always. Every document timestamped, every chain of custody preserved, every export defensible.',
    media: {
      type: 'image',
      src: '/marketing/screenshots/vault.png',
      alt: 'FormaOS Evidence Vault with document management',
    },
    accentColor: 'from-purple-500 to-pink-500',
    features: [
      'Immutable audit trail',
      'Chain-of-custody tracking',
      'One-click regulatory export',
    ],
  },
];

// ============================================
// HERO ENHANCEMENT COMPONENTS
// ============================================

// ============================================
// HERO COMPONENT
// ============================================

function Hero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const { state } = useCompliance();
  const router = useRouter();

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100]);
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
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0a0f1c] via-[#0d1421] to-[#0a0f1c] pt-24"
    >
      {/* Premium Background Effects - Cinematic Gradient Layers */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Primary gradient orb - top left */}
        <motion.div
          className="absolute -top-40 -left-40 w-[800px] h-[800px] bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Secondary gradient orb - bottom right */}
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
        {/* Tertiary accent - center glow */}
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

      {/* Floating Metrics - Left Side */}
      <div className="absolute left-8 lg:left-16 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 z-20">
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
      </div>

      {/* Floating Metrics - Right Side */}
      <div className="absolute right-8 lg:right-16 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-6 z-20">
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
      </div>

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

            {/* OS Authority Statement - Enhanced */}
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
              {/* OS Capability Indicators */}
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

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-6 h-10 rounded-full border-2 border-gray-600/50 flex items-start justify-center p-2"
        >
          <motion.div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// Floating Metric Card Component
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

// Proof Metric for Mobile
function ProofMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center p-4 rounded-xl bg-white/3 backdrop-blur-sm border border-white/5">
      <div className="text-xl font-bold text-white">{value}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}
// ============================================
// VALUE PROPOSITION SECTION
// ============================================

function ValueProposition() {
  return (
    <section className="relative py-24 bg-gradient-to-b from-[#0a0f1c] to-[#0d1421] overflow-hidden">
      {/* Animated background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 lg:px-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* OS Authority Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Operating System Architecture
          </motion.div>

          <motion.p
            className="text-lg sm:text-xl text-gray-400 mb-6 leading-relaxed"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
          >
            FormaOS is the operating system that runs your compliance program.
            Not a repository. Not a checklist. A live system that enforces
            governance, tracks accountability, and produces defensible evidence.
          </motion.p>

          {/* OS Capability Statement */}
          <motion.p
            className="text-sm text-gray-500 mb-12 max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            Real-time compliance state. Immutable evidence chains.
            System-enforced accountability, not spreadsheet-level tracking.
          </motion.p>

          <div className="grid md:grid-cols-2 gap-8 text-left">
            <motion.div
              initial={{ opacity: 0, x: -30, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-950/40 backdrop-blur-xl border border-white/5 hover:border-red-500/20 transition-all duration-500 group"
            >
              {/* Red accent for "old way" */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/0 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-red-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500/60" />
                Other tools store documents.
              </h3>
              <p className="text-gray-500 mb-4">
                Static repositories. Manual reminders. Evidence scattered across
                folders. Hope the auditor doesn't ask the hard questions.
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500/50" />
                  No control enforcement
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500/50" />
                  Point-in-time snapshots
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-red-500/50" />
                  Manual evidence collection
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30, y: 20 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.4 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-950/40 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-500 group shadow-lg shadow-cyan-500/5"
            >
              {/* Cyan accent for "FormaOS way" */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <h3 className="text-lg font-semibold text-cyan-400 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                FormaOS runs your program.
              </h3>
              <p className="text-gray-500 mb-4">
                A live operating system. Controls are enforced, not just
                recorded. Evidence is automatic. Accountability is system-level.
              </p>
              <ul className="text-xs text-gray-400 space-y-1">
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  Workflow orchestration built-in
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  Real-time compliance posture
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-cyan-400" />
                  Immutable audit trail
                </li>
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// SCROLL STORY COMPONENT
// ============================================

const steps = [
  {
    id: 'model',
    title: 'Structure',
    description:
      'Define your governance architecture. Map obligations to controls, controls to owners, and owners to evidence requirements. The OS knows who is accountable for what.',
    icon: Box,
    variant: 'default' as const,
    color: 'from-cyan-400 to-blue-500',
    features: [
      'Governance hierarchy as code',
      'Framework-to-control mapping',
      'Ownership and accountability chains',
    ],
  },
  {
    id: 'execute',
    title: 'Operationalize',
    description:
      'Controls become enforced workflows. Tasks are assigned, deadlines are tracked, escalations are automatic. The OS ensures execution, not just intention.',
    icon: Zap,
    variant: 'connecting' as const,
    color: 'from-blue-500 to-purple-500',
    features: [
      'Automated control enforcement',
      'Deadline and escalation rules',
      'Immutable execution logs',
    ],
  },
  {
    id: 'verify',
    title: 'Validate',
    description:
      'The OS continuously verifies control status. Gaps are flagged instantly. Compliance posture is always current, never a point-in-time snapshot.',
    icon: ShieldCheck,
    variant: 'verified' as const,
    color: 'from-purple-500 to-pink-500',
    features: [
      'Real-time control verification',
      'Continuous posture monitoring',
      'Instant gap detection',
    ],
  },
  {
    id: 'prove',
    title: 'Defend',
    description:
      'When auditors arrive, the evidence is already assembled. Chain of custody, timestamps, attestations. All exportable, all defensible, all undeniable.',
    icon: FileCheck,
    variant: 'complete' as const,
    color: 'from-pink-500 to-cyan-500',
    features: [
      'Pre-assembled evidence packages',
      'Immutable audit trail',
      'One-click regulatory export',
    ],
  },
];

function CompactStoryStep({
  step,
  index,
  totalSteps: _totalSteps,
}: {
  step: (typeof steps)[0];
  index: number;
  totalSteps: number;
}) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay: index * 0.15, ease: 'easeOut' }}
      whileHover={{ scale: 1.02, y: -8 }}
      className="group relative pt-4 mt-4 p-8 rounded-3xl bg-gradient-to-br from-gray-900/50 to-gray-950/50 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-500 shadow-xl shadow-black/20"
    >
      {/* Animated background gradient on hover */}
      <motion.div
        className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
      />

      {/* Glowing edge accent */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
      </div>

      <div className="flex items-center gap-4 mb-6">
        <motion.div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Icon className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-2xl font-bold group-hover:text-cyan-400 transition-colors duration-300">
          {step.title}
        </h3>
      </div>

      <p className="text-gray-400 leading-relaxed mb-6">{step.description}</p>

      {/* Features list with staggered animation */}
      <div className="space-y-3">
        {step.features.map((feature, featureIdx) => (
          <motion.div
            key={feature}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 + featureIdx * 0.08 }}
            className="flex items-center gap-3 group/feature"
          >
            <motion.div
              className={`w-2 h-2 rounded-full bg-gradient-to-r ${step.color}`}
              whileHover={{ scale: 1.5 }}
            />
            <span className="text-sm text-gray-500 group-hover/feature:text-gray-300 transition-colors">
              {feature}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  // scrollYProgress available for future scroll animations
  useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  return (
    <section
      ref={containerRef}
      className="relative py-32 bg-gradient-to-b from-[#0d1421] via-[#0a0f1c] to-[#0a0f1c] overflow-hidden"
      style={{ position: 'relative' }}
    >
      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        {/* Section Header with enhanced styling */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          {/* Label badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            How It Works
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            The Compliance
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
              {' '}
              Lifecycle
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            From framework mapping to audit defense - a complete workflow that
            transforms obligations into enforceable controls with clear
            ownership.
          </p>
        </motion.div>

        {/* Steps in 2x2 Grid Layout */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <CompactStoryStep
              key={step.id}
              step={step}
              index={index}
              totalSteps={steps.length}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// CAPABILITIES GRID COMPONENT
// ============================================

const capabilities = [
  {
    icon: Workflow,
    title: 'Automation Engine',
    description:
      '8 automation triggers for evidence, tasks, policies, and certifications with auto-task generation and escalation notifications.',
    color: 'from-cyan-400 to-blue-500',
  },
  {
    icon: Database,
    title: 'Evidence Versioning',
    description:
      'Evidence activity is logged with audit trail context. Optional versioning and rollback available by request.',
    color: 'from-blue-500 to-purple-500',
  },
  {
    icon: Lock,
    title: 'Compliance Score Engine',
    description:
      'Continuous compliance scoring with trend insights and snapshot history when enabled.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: GitBranch,
    title: 'Framework Packs',
    description:
      '7 pre-built frameworks (ISO 27001, SOC 2, GDPR, HIPAA, PCI-DSS, NIST CSF, CIS).',
    color: 'from-pink-500 to-rose-500',
  },
  {
    icon: Layers,
    title: 'Cross-Framework Mapping',
    description:
      'Control mappings across SOC 2, NIST CSF, and CIS Controls with coverage visibility.',
    color: 'from-rose-500 to-orange-500',
  },
  {
    icon: Terminal,
    title: 'Compliance Intelligence',
    description:
      'Real-time compliance scoring with trend analysis and risk insights across all frameworks.',
    color: 'from-orange-500 to-yellow-500',
  },
  {
    icon: Eye,
    title: 'Executive Dashboard',
    description:
      'C-level visibility into compliance posture, framework health, and risk trends.',
    color: 'from-yellow-500 to-lime-500',
  },
  {
    icon: Clock,
    title: 'REST API v1',
    description:
      'REST API v1 for compliance data, evidence uploads, and tasks. Webhooks available by request.',
    color: 'from-yellow-500 to-green-500',
  },
  {
    icon: Globe,
    title: 'Multi-Site Operations',
    description:
      'Planned enterprise roadmap: multi-site hierarchies, business units, and cross-site rollups.',
    color: 'from-green-500 to-cyan-500',
  },
  {
    icon: Shield,
    title: 'Compliance Gate Enforcement',
    description:
      'Block non-compliant actions before they happen. Real-time validation ensures controls are satisfied before proceeding.',
    color: 'from-cyan-500 to-blue-500',
  },
];

function CapabilitiesGrid() {
  return (
    <section className="relative py-32 bg-gradient-to-b from-[#0a0f1c] to-[#0d1421] overflow-hidden">
      {/* Background accent with animation */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          {/* Label badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
            Platform Capabilities
          </motion.div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Complete Compliance
            <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
              {' '}
              Operating System
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Every capability is interconnected. Obligations flow to controls,
            controls trigger tasks, tasks produce evidence. One system. One
            truth.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <motion.div
                key={capability.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group relative p-8 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-950/40 border border-white/5 hover:border-cyan-500/30 transition-all cursor-pointer backdrop-blur-sm"
              >
                <div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${capability.color} opacity-0 group-hover:opacity-5 transition-opacity`}
                />

                <div
                  className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${capability.color} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-semibold mb-3 group-hover:text-cyan-400 transition-colors">
                  {capability.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {capability.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function VersionControlHighlight() {
  const features = [
    {
      icon: History,
      title: 'Audit Trail History',
      description:
        'Every evidence action is logged with timestamps and ownership.',
    },
    {
      icon: Shield,
      title: 'Integrity Context',
      description:
        'Audit logs preserve what changed and when, supporting defensible evidence.',
    },
    {
      icon: RotateCcw,
      title: 'Versioning (By Request)',
      description:
        'Optional versioning and rollback can be enabled for enterprise deployments.',
    },
  ];

  return (
    <section className="relative py-24 sm:py-28 lg:py-32 bg-gradient-to-b from-[#0a0f1c] to-[#0d1421] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6"
          >
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-cyan-400 animate-pulse" />
            Available By Request
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            Evidence Integrity &amp; Change History
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
              {' '}
              For audit defensibility
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Audit logs capture evidence activity today. Optional versioning and
            rollback are available by request.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.03, y: -4 }}
                className="relative p-6 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-950/40 border border-white/5 hover:border-cyan-500/30 transition-all backdrop-blur-sm"
              >
                <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 mb-4">
                  <Icon className="w-6 h-6 text-cyan-300" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center"
        >
          <p className="text-xs sm:text-sm text-cyan-200">
            Optional enterprise enhancements are available on request.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// INDUSTRY SOLUTIONS - Built for High-Accountability Industries
// ============================================

interface IndustrySolution {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color: string;
  accentColor: string;
  problemStatement: string;
  solutionMapping: {
    title: string;
    features: string[];
  };
  capabilities: {
    icon: LucideIcon;
    title: string;
    description: string;
  }[];
  cta: {
    text: string;
    href: string;
  };
}

const industrySolutions: IndustrySolution[] = [
  {
    icon: Heart,
    title: 'Healthcare',
    subtitle: 'HIPAA, RACGP, AHPRA Compliance',
    color: 'from-rose-400 to-pink-600',
    accentColor: 'rose',
    problemStatement:
      'Healthcare providers face mounting pressure from patient safety requirements, clinical governance obligations, and audit cycles that demand instant evidence retrieval. One compliance gap can mean regulatory sanctions, accreditation loss, or worse: patient harm.',
    solutionMapping: {
      title: 'FormaOS Healthcare Module',
      features: [
        'Patient records and progress notes with role-based access',
        'Clinical incident reporting (advanced routing available by request)',
        'Staff credential tracking with review reminders',
        'Audit-ready evidence bundles and exports',
      ],
    },
    capabilities: [
      {
        icon: Shield,
        title: 'Clinical Governance',
        description:
          'Audit trails for compliance actions, evidence updates, and policy acknowledgments',
      },
      {
        icon: FileText,
        title: 'Incident Management (Early Access)',
        description:
          'Category-based incident capture and investigation workflows (regulator-specific flows by request)',
      },
      {
        icon: CheckCircle,
        title: 'Accreditation Ready',
        description:
          'Aligned to RACGP, AHPRA, and NSQHS standards with configurable templates',
      },
    ],
    cta: {
      text: 'Explore Healthcare Solution',
      href: '/use-cases/healthcare',
    },
  },
  {
    icon: Users,
    title: 'NDIS Providers',
    subtitle: 'NDIS Practice Standards, Quality & Safeguards',
    color: 'from-cyan-400 to-blue-600',
    accentColor: 'cyan',
    problemStatement:
      'NDIS providers operate under intense scrutiny from the Quality and Safeguards Commission. Participant safety incidents, worker screening lapses, and missing evidence during audits can result in registration revocation and service shutdown.',
    solutionMapping: {
      title: 'FormaOS NDIS Module',
      features: [
        'Participant records and support plans (configurable)',
        'Incident reporting workflows (advanced regulator flows by request)',
        'Credential tracking and screening records',
        'Self-assessment checklists aligned to NDIS Practice Standards (by request)',
      ],
    },
    capabilities: [
      {
        icon: Shield,
        title: 'Safeguarding System',
        description:
          'Safeguarding registers and participant consent tracking (early access)',
      },
      {
        icon: FileText,
        title: 'Incident Reporting',
        description:
          'Incident reporting workflows with configurable timelines (early access)',
      },
      {
        icon: CheckCircle,
        title: 'Audit Evidence',
        description: 'Evidence bundles and exports to support NDIS audits',
      },
    ],
    cta: {
      text: 'Explore NDIS Solution',
      href: '/use-cases/ndis',
    },
  },
  {
    icon: TrendingUp,
    title: 'Financial Services',
    subtitle: 'Multi-framework compliance alignment',
    color: 'from-emerald-400 to-green-600',
    accentColor: 'emerald',
    problemStatement:
      'Financial institutions face relentless compliance demands from multiple frameworks simultaneously. Manual evidence collection for audits consumes significant time, while security incidents require immediate documentation and response.',
    solutionMapping: {
      title: 'FormaOS Financial Module',
      features: [
        'Multi-framework compliance packs (SOC 2, ISO, PCI) with configurable mapping',
        'Evidence collection workflows and control tracking',
        'Vendor risk tracking (available by request)',
        'Incident response documentation workflows',
      ],
    },
    capabilities: [
      {
        icon: Shield,
        title: 'Control Monitoring',
        description:
          'Control status dashboards with gap visibility and trend insights',
      },
      {
        icon: FileText,
        title: 'Evidence Automation',
        description:
          'Evidence collection workflows and audit-ready export packs',
      },
      {
        icon: CheckCircle,
        title: 'Audit Acceleration',
        description: 'Framework packs aligned to common trust service criteria',
      },
    ],
    cta: {
      text: 'Explore Financial Solution',
      href: '/use-cases/financial-services',
    },
  },
  {
    icon: GraduationCap,
    title: 'Education & Accreditation',
    subtitle: 'TEQSA, ASQA, RTO Standards',
    color: 'from-purple-400 to-violet-600',
    accentColor: 'purple',
    problemStatement:
      'Education providers preparing for TEQSA registration or ASQA audits spend months gathering evidence across departments. Missing documentation, outdated policies, or incomplete staff records can delay registration or trigger compliance conditions.',
    solutionMapping: {
      title: 'FormaOS Education Module',
      features: [
        'Academic governance frameworks with approval workflows',
        'Course and unit compliance mapping',
        'Trainer and assessor credential management',
        'Student complaint and appeal tracking',
      ],
    },
    capabilities: [
      {
        icon: Shield,
        title: 'Academic Governance',
        description:
          'Policy lifecycle management with academic board approvals',
      },
      {
        icon: FileText,
        title: 'RTO Compliance',
        description:
          'Training package mapping, validation records, and learner file audits',
      },
      {
        icon: CheckCircle,
        title: 'Registration Ready',
        description:
          'Evidence organized by TEQSA/ASQA standard for instant retrieval',
      },
    ],
    cta: {
      text: 'Explore Education Solution',
      href: '/use-cases/education',
    },
  },
  {
    icon: Building2,
    title: 'Government & Public Sector',
    subtitle: 'FOI, ISM, PSPF Compliance',
    color: 'from-amber-400 to-orange-600',
    accentColor: 'amber',
    problemStatement:
      'Government agencies face unique accountability requirements: Freedom of Information requests, ministerial briefings, and public sector performance reporting. Every decision must be documented, defensible, and retrievable on demand.',
    solutionMapping: {
      title: 'FormaOS Government Module',
      features: [
        'Decision registers with approval chains and rationale capture',
        'FOI request management and document tracking',
        'Service delivery performance dashboards',
        'Cross-agency collaboration with access controls',
      ],
    },
    capabilities: [
      {
        icon: Shield,
        title: 'Accountability',
        description:
          'Complete decision audit trails with ministerial-ready documentation',
      },
      {
        icon: FileText,
        title: 'Information Management',
        description:
          'Records classification, retention scheduling, and disposal tracking',
      },
      {
        icon: CheckCircle,
        title: 'Performance Reporting',
        description:
          'Automated KPI dashboards and public accountability statements',
      },
    ],
    cta: {
      text: 'Explore Government Solution',
      href: '/use-cases/government',
    },
  },
];

function Industries() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section className="relative py-20 sm:py-28 lg:py-36 bg-[#0a0f1c] overflow-hidden">
      {/* Subtle gradient background - no particles */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/5 to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 lg:mb-20"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Industry Solutions
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Built for{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-blue-500 bg-clip-text text-transparent">
              High-Accountability
            </span>
            <br />
            Industries
          </h2>
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            When compliance failure means regulatory action, accreditation loss,
            or operational shutdown, FormaOS delivers the evidence
            infrastructure your industry demands.
          </p>
        </motion.div>

        {/* Industry Panels */}
        <div className="space-y-4">
          {industrySolutions.map((solution, index) => {
            const Icon = solution.icon;
            const isExpanded = expandedIndex === index;

            return (
              <motion.div
                key={solution.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                {/* Collapsed Header / Expandable Button */}
                <motion.button
                  onClick={() => toggleExpand(index)}
                  className={`w-full p-6 lg:p-8 rounded-2xl border text-left transition-all duration-300 ${
                    isExpanded
                      ? 'bg-gradient-to-br from-gray-900/90 to-gray-950/90 border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                      : 'bg-gradient-to-br from-gray-900/60 to-gray-950/60 border-white/10 hover:border-cyan-500/30'
                  }`}
                  style={{
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 lg:gap-6">
                      <div
                        className={`p-3 lg:p-4 rounded-xl bg-gradient-to-br ${solution.color} shadow-lg transition-transform duration-300 ${
                          isExpanded ? 'scale-110' : 'group-hover:scale-105'
                        }`}
                      >
                        <Icon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl lg:text-2xl font-bold text-white mb-1">
                          {solution.title}
                        </h3>
                        <p className="text-sm lg:text-base text-gray-400">
                          {solution.subtitle}
                        </p>
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-cyan-400"
                    >
                      <ChevronDown className="w-6 h-6" />
                    </motion.div>
                  </div>
                </motion.button>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="p-6 lg:p-10 mt-2 rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-950/80 border border-white/5">
                        {/* Split Layout: Problem + Solution */}
                        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-10">
                          {/* Problem Statement */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-rose-400 text-sm font-medium">
                              <AlertCircle className="w-4 h-4" />
                              The Challenge
                            </div>
                            <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
                              {solution.problemStatement}
                            </p>
                          </div>

                          {/* Solution Mapping */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                              <CheckCircle className="w-4 h-4" />
                              {solution.solutionMapping.title}
                            </div>
                            <ul className="space-y-3">
                              {solution.solutionMapping.features.map(
                                (feature, i) => (
                                  <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + i * 0.1 }}
                                    className="flex items-start gap-3"
                                  >
                                    <div
                                      className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${solution.color} mt-2 flex-shrink-0`}
                                    />
                                    <span className="text-gray-200 text-sm lg:text-base">
                                      {feature}
                                    </span>
                                  </motion.li>
                                ),
                              )}
                            </ul>
                          </div>
                        </div>

                        {/* Capabilities Grid */}
                        <div className="grid md:grid-cols-3 gap-4 lg:gap-6 mb-8">
                          {solution.capabilities.map((capability, i) => {
                            const CapIcon = capability.icon;
                            return (
                              <motion.div
                                key={capability.title}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.1 }}
                                className="p-5 lg:p-6 rounded-xl bg-gray-800/40 border border-white/5 hover:border-cyan-500/20 transition-colors"
                              >
                                <div
                                  className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${solution.color} bg-opacity-20 mb-3`}
                                >
                                  <CapIcon className="w-5 h-5 text-white" />
                                </div>
                                <h4 className="text-white font-semibold mb-2">
                                  {capability.title}
                                </h4>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                  {capability.description}
                                </p>
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* CTA */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-white/10">
                          <p className="text-gray-400 text-sm">
                            See how FormaOS transforms{' '}
                            {solution.title.toLowerCase()} compliance
                          </p>
                          <Link
                            href={solution.cta.href}
                            className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r ${solution.color} text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 hover:-translate-y-0.5`}
                          >
                            {solution.cta.text}
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-400 mb-6">
            Not sure which solution fits your organization?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-0.5"
          >
            Talk to a Compliance Expert
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

function HealthcareHighlight() {
  const categories = [
    {
      title: 'Patient Management',
      features: [
        'Patient management with automatic audit evidence generation',
        'Progress notes become compliance proof with supervisor sign-off workflows',
        'Care episode tracking and clinical governance workflows',
      ],
    },
    {
      title: 'NDIS & Aged Care',
      features: [
        'NDIS Practice Standards 1-8 controls pre-configured',
        'Participant records with evidence-linked tracking',
        'Worker screening and incident workflows aligned to NDIS requirements',
      ],
    },
  ];

  return (
    <section className="relative py-16 sm:py-24 lg:py-32 bg-[#0a0f1c] overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-r from-rose-500/10 to-pink-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm font-medium mb-4 sm:mb-6"
          >
            <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-rose-300 animate-pulse" />
            Healthcare &amp; NDIS
          </motion.div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
            Built for
            <span className="bg-gradient-to-r from-rose-300 via-pink-300 to-cyan-400 bg-clip-text text-transparent">
              {' '}
              Regulated Healthcare
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Patient management, incident reporting, and clinical governance
            workflows aligned to HIPAA and NDIS requirements.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-950/40 border border-white/5 backdrop-blur-sm"
            >
              <h3 className="text-lg sm:text-xl font-semibold mb-4">
                {category.title}
              </h3>
              <ul className="space-y-3">
                {category.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm sm:text-base text-gray-400"
                  >
                    <CheckCircle className="w-4 h-4 text-rose-300 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================
// SECURITY COMPONENT
// ============================================

const securityFeatures = [
  {
    icon: Shield,
    title: 'SOC 2-aligned controls',
    description: 'Security controls aligned to common trust frameworks',
  },
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description: 'Encryption at rest and in transit',
  },
  {
    icon: Eye,
    title: 'Complete Audit Logs',
    description: 'Every action tracked and timestamped',
  },
  {
    icon: History,
    title: 'Evidence Integrity',
    description:
      'Audit trail context protects evidence defensibility; versioning available by request',
  },
  {
    icon: Key,
    title: 'SSO & MFA',
    description: 'Google OAuth today; enterprise SSO/MFA available by request',
  },
];

function Security() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Detect mobile for performance optimization
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Enhanced enterprise evidence chain with audit trails - skip on mobile
  useEffect(() => {
    if (isMobile) return; // Skip canvas animation on mobile for performance

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 500 * dpr;
      canvas.height = 400 * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = '500px';
      canvas.style.height = '400px';
    };
    updateSize();

    let time = 0;

    // Evidence processing pipeline
    const evidenceBlocks = [
      {
        x: 80,
        y: 200,
        label: 'COLLECT',
        stage: 'input',
        locked: false,
        verified: false,
      },
      {
        x: 160,
        y: 200,
        label: 'ENCRYPT',
        stage: 'process',
        locked: false,
        verified: false,
      },
      {
        x: 240,
        y: 200,
        label: 'VERIFY',
        stage: 'validate',
        locked: false,
        verified: false,
      },
      {
        x: 320,
        y: 200,
        label: 'AUDIT',
        stage: 'review',
        locked: false,
        verified: false,
      },
      {
        x: 400,
        y: 200,
        label: 'SECURE',
        stage: 'complete',
        locked: false,
        verified: false,
      },
    ];

    // Audit trace lines that flow through the system
    const auditTraces = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 50 + Math.random() * 400,
      y: 100 + Math.random() * 200,
      speed: 0.5 + Math.random() * 1.5,
      opacity: 0.1 + Math.random() * 0.3,
      direction: Math.random() > 0.5 ? 1 : -1,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, 500, 400);

      // Background audit grid - subtle enterprise feel
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        const y = 50 + i * 30;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(50, y);
        ctx.lineTo(450, y);
        ctx.stroke();
      }

      // Animated audit trace lines flowing through the protective surface
      auditTraces.forEach((trace, i) => {
        const traceTime = (time + i * 50) * 0.02;
        trace.x += trace.speed * trace.direction;

        // Wrap around
        if (trace.x > 500) trace.x = -20;
        if (trace.x < -20) trace.x = 500;

        // Create flowing audit lines
        const gradient = ctx.createLinearGradient(
          trace.x - 30,
          trace.y,
          trace.x + 30,
          trace.y,
        );
        gradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
        gradient.addColorStop(
          0.5,
          `rgba(6, 182, 212, ${trace.opacity * (0.5 + Math.sin(traceTime) * 0.3)})`,
        );
        gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(trace.x - 20, trace.y);
        ctx.lineTo(trace.x + 20, trace.y);
        ctx.stroke();
      });

      // Evidence processing chain
      evidenceBlocks.forEach((block, i) => {
        const blockTime = (time - i * 200) % 1000;
        const isProcessing = blockTime > 0 && blockTime < 800;
        const isLocked = blockTime > 400;
        const isVerified = blockTime > 600;

        block.locked = isLocked;
        block.verified = isVerified;

        // Block container with enterprise styling
        const containerGradient = ctx.createLinearGradient(
          block.x - 30,
          block.y - 20,
          block.x + 30,
          block.y + 20,
        );

        if (isVerified) {
          containerGradient.addColorStop(0, 'rgba(16, 185, 129, 0.2)');
          containerGradient.addColorStop(1, 'rgba(5, 150, 105, 0.1)');
        } else if (isProcessing) {
          containerGradient.addColorStop(0, 'rgba(59, 130, 246, 0.2)');
          containerGradient.addColorStop(1, 'rgba(37, 99, 235, 0.1)');
        } else {
          containerGradient.addColorStop(0, 'rgba(75, 85, 99, 0.2)');
          containerGradient.addColorStop(1, 'rgba(55, 65, 81, 0.1)');
        }

        ctx.fillStyle = containerGradient;
        ctx.fillRect(block.x - 30, block.y - 20, 60, 40);

        // Block border
        ctx.strokeStyle = isVerified
          ? 'rgba(16, 185, 129, 0.8)'
          : isProcessing
            ? 'rgba(59, 130, 246, 0.6)'
            : 'rgba(156, 163, 175, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([]);
        ctx.strokeRect(block.x - 30, block.y - 20, 60, 40);

        // Processing animation inside block
        if (isProcessing && !isVerified) {
          const dots = 3;
          for (let d = 0; d < dots; d++) {
            const dotOpacity = Math.max(0, Math.sin(time * 0.05 - d * 0.5));
            ctx.fillStyle = `rgba(59, 130, 246, ${dotOpacity})`;
            ctx.beginPath();
            ctx.arc(block.x - 10 + d * 10, block.y, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Verification checkmark
        if (isVerified) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(block.x - 8, block.y);
          ctx.lineTo(block.x - 3, block.y + 5);
          ctx.lineTo(block.x + 8, block.y - 5);
          ctx.stroke();
        }

        // Security lock icon for locked blocks
        if (isLocked) {
          const lockY = block.y - 35;

          // Lock glow
          const lockGlow = ctx.createRadialGradient(
            block.x,
            lockY,
            0,
            block.x,
            lockY,
            12,
          );
          lockGlow.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
          lockGlow.addColorStop(1, 'rgba(16, 185, 129, 0)');
          ctx.fillStyle = lockGlow;
          ctx.beginPath();
          ctx.arc(block.x, lockY, 12, 0, Math.PI * 2);
          ctx.fill();

          // Lock body
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillRect(block.x - 4, lockY - 2, 8, 6);

          // Lock shackle
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.arc(block.x, lockY - 3, 3, Math.PI, 0);
          ctx.stroke();
        }

        // Stage label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(block.label, block.x, block.y + 35);

        // Connection chains between blocks
        if (i < evidenceBlocks.length - 1) {
          const nextBlock = evidenceBlocks[i + 1];
          const connectionActive =
            block.verified && (nextBlock.locked || nextBlock.verified);

          // Chain link background
          ctx.strokeStyle = connectionActive
            ? 'rgba(16, 185, 129, 0.7)'
            : 'rgba(156, 163, 175, 0.3)';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(block.x + 30, block.y);
          ctx.lineTo(nextBlock.x - 30, nextBlock.y);
          ctx.stroke();

          // Chain link highlight
          ctx.strokeStyle = connectionActive
            ? 'rgba(255, 255, 255, 0.4)'
            : 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(block.x + 30, block.y - 1);
          ctx.lineTo(nextBlock.x - 30, nextBlock.y - 1);
          ctx.stroke();

          // Data flow pulses
          if (connectionActive) {
            const pulseProgress = (time * 0.03 + i * 0.3) % 1;
            const pulseX =
              block.x +
              30 +
              (nextBlock.x - 30 - (block.x + 30)) * pulseProgress;
            const pulseGradient = ctx.createRadialGradient(
              pulseX,
              block.y,
              0,
              pulseX,
              block.y,
              6,
            );
            pulseGradient.addColorStop(0, 'rgba(16, 185, 129, 0.8)');
            pulseGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
            ctx.fillStyle = pulseGradient;
            ctx.beginPath();
            ctx.arc(pulseX, block.y, 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Central security shield mesh
      const shieldCenterX = 250;
      const shieldCenterY = 120;
      const shieldSize = 40;

      // Shield background with subtle mesh pattern
      const shieldGradient = ctx.createRadialGradient(
        shieldCenterX,
        shieldCenterY,
        0,
        shieldCenterX,
        shieldCenterY,
        shieldSize,
      );
      shieldGradient.addColorStop(0, 'rgba(6, 182, 212, 0.15)');
      shieldGradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.1)');
      shieldGradient.addColorStop(1, 'rgba(6, 182, 212, 0.05)');
      ctx.fillStyle = shieldGradient;

      // Shield shape
      ctx.beginPath();
      ctx.moveTo(shieldCenterX, shieldCenterY - shieldSize);
      ctx.lineTo(
        shieldCenterX - shieldSize * 0.7,
        shieldCenterY - shieldSize * 0.5,
      );
      ctx.lineTo(
        shieldCenterX - shieldSize * 0.7,
        shieldCenterY + shieldSize * 0.3,
      );
      ctx.lineTo(shieldCenterX, shieldCenterY + shieldSize);
      ctx.lineTo(
        shieldCenterX + shieldSize * 0.7,
        shieldCenterY + shieldSize * 0.3,
      );
      ctx.lineTo(
        shieldCenterX + shieldSize * 0.7,
        shieldCenterY - shieldSize * 0.5,
      );
      ctx.closePath();
      ctx.fill();

      // Shield mesh pattern
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      for (let i = 0; i < 6; i++) {
        const y = shieldCenterY - shieldSize * 0.8 + i * (shieldSize * 0.3);
        ctx.beginPath();
        ctx.moveTo(shieldCenterX - shieldSize * 0.6, y);
        ctx.lineTo(shieldCenterX + shieldSize * 0.6, y);
        ctx.stroke();
      }

      // Shield border with enterprise styling
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(shieldCenterX, shieldCenterY - shieldSize);
      ctx.lineTo(
        shieldCenterX - shieldSize * 0.7,
        shieldCenterY - shieldSize * 0.5,
      );
      ctx.lineTo(
        shieldCenterX - shieldSize * 0.7,
        shieldCenterY + shieldSize * 0.3,
      );
      ctx.lineTo(shieldCenterX, shieldCenterY + shieldSize);
      ctx.lineTo(
        shieldCenterX + shieldSize * 0.7,
        shieldCenterY + shieldSize * 0.3,
      );
      ctx.lineTo(
        shieldCenterX + shieldSize * 0.7,
        shieldCenterY - shieldSize * 0.5,
      );
      ctx.closePath();
      ctx.stroke();

      // Enterprise compliance badge
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('TRUST', shieldCenterX, shieldCenterY + 5);

      // Audit compliance indicator
      ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.font = '8px monospace';
      ctx.fillText('ALIGNED CONTROLS', shieldCenterX, shieldCenterY + 65);

      time += 1;
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      // Cleanup will happen when component unmounts
    };
  }, [isMobile]);

  return (
    <section
      ref={containerRef}
      className="relative py-16 sm:py-24 lg:py-32 bg-gradient-to-b from-[#0a0f1c] to-[#0d1421] overflow-hidden"
      style={{ position: 'relative' }}
    >
      {/* Background effects - simplified on mobile */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[450px] lg:w-[600px] h-[300px] sm:h-[450px] lg:h-[600px] bg-cyan-500/5 rounded-full blur-2xl sm:blur-3xl will-change-transform"
          style={{ transform: 'translateZ(0)' }}
        />

        {/* Subtle audit trace overlay - hidden on mobile */}
        <div
          className="absolute inset-0 opacity-10 sm:opacity-20 hidden sm:block"
          style={{
            backgroundImage: `linear-gradient(45deg, transparent 40%, rgba(6, 182, 212, 0.03) 50%, transparent 60%)`,
            backgroundSize: '60px 60px',
            animation: 'audit-flow 8s linear infinite',
          }}
        />
      </div>

      <motion.div
        style={{ opacity: isMobile ? 1 : opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12"
      >
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: isMobile ? 0 : -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Label badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs sm:text-sm font-medium mb-4 sm:mb-6"
            >
              <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-blue-400 animate-pulse" />
              Enterprise Security
            </motion.div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6">
              Security Built Into
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
                {' '}
                the Operating Layer
              </span>
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-3 sm:mb-4 leading-relaxed">
              Controls are enforced, not just recorded. Every action is logged,
              evidence activity is tracked, and audit trails are complete.
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8 leading-relaxed">
              Security is infrastructure, not features. Built into the operating
              layer where controls execute automatically and evidence is
              captured at the system level.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {securityFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="flex gap-3 sm:gap-4 group sm:hover:scale-105 transition-transform duration-200 will-change-transform"
                  >
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center sm:group-hover:shadow-lg sm:group-hover:shadow-cyan-500/25 transition-shadow">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base mb-0.5 sm:mb-1 group-hover:text-cyan-300 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Enhanced Visual - Canvas on desktop, static on mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-center order-first lg:order-last"
          >
            <div
              className="relative p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-gray-900/30 to-gray-950/30 border border-white/5 w-full max-w-[500px] overflow-hidden"
              style={{ backdropFilter: isMobile ? 'none' : 'blur(20px)' }}
            >
              {/* Desktop: Canvas animation */}
              {!isMobile && (
                <canvas ref={canvasRef} className="w-full h-full" />
              )}

              {/* Mobile: Static visual representation */}
              {isMobile && (
                <div className="relative h-[250px] sm:h-[300px]">
                  {/* Trust Shield */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-20 flex flex-col items-center justify-center">
                    <div className="w-14 h-16 border-2 border-cyan-400/60 rounded-b-full rounded-t-lg bg-gradient-to-b from-cyan-500/10 to-transparent flex items-center justify-center">
                      <span className="text-white/80 text-xs font-mono">
                        TRUST
                      </span>
                    </div>
                    <span className="text-cyan-400/60 text-[8px] font-mono mt-1">
                      ALIGNED CONTROLS
                    </span>
                  </div>

                  {/* Evidence Chain Labels */}
                  <div className="absolute bottom-6 left-0 right-0 flex justify-between px-4 text-[10px] font-mono text-cyan-400/60">
                    <span className="text-center">COLLECT</span>
                    <span className="text-center">ENCRYPT</span>
                    <span className="text-center">VERIFY</span>
                    <span className="text-center">AUDIT</span>
                  </div>

                  {/* Evidence blocks */}
                  <div className="absolute bottom-12 left-0 right-0 flex justify-between px-4 gap-2">
                    {['COLLECT', 'ENCRYPT', 'VERIFY', 'AUDIT'].map(
                      (label, i) => (
                        <div
                          key={label}
                          className={`flex-1 h-8 rounded border ${i < 3 ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-blue-500/50 bg-blue-500/10'}`}
                        />
                      ),
                    )}
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c]/10 via-transparent to-transparent rounded-2xl sm:rounded-3xl pointer-events-none" />

              {/* Enterprise compliance indicators */}
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex justify-between items-center text-[10px] sm:text-xs text-gray-500 font-mono">
                <span>AUDIT STATUS: ACTIVE</span>
                <span className="hidden sm:inline">COMPLIANCE: 100%</span>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <style jsx>{`
        @keyframes audit-flow {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 60px 60px;
          }
        }
      `}</style>
    </section>
  );
}

// ============================================
// CTA SECTION COMPONENT
// ============================================

function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctaButtonRef = useRef<HTMLAnchorElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8]);
  const glow = useTransform(scrollYProgress, [0, 1], [0.2, 0.6]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Enhanced ambient particle field and process-to-proof arc animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = 800 * dpr;
      canvas.height = 600 * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = '800px';
      canvas.style.height = '600px';
    };
    updateSize();

    let time = 0;

    // Ambient proof particles that converge toward center
    const proofParticles = Array.from({ length: 25 }, (_, i) => ({
      x: 100 + Math.random() * 600,
      y: 100 + Math.random() * 400,
      targetX: 400,
      targetY: 300,
      speed: 0.5 + Math.random() * 1,
      size: 1 + Math.random() * 3,
      opacity: 0.3 + Math.random() * 0.4,
      verified: false,
      verifyTime: 200 + i * 80,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, 800, 600);

      // Volumetric gradient background layers
      const bgGradient1 = ctx.createRadialGradient(400, 300, 0, 400, 300, 400);
      bgGradient1.addColorStop(0, 'rgba(6, 182, 212, 0.05)');
      bgGradient1.addColorStop(0.5, 'rgba(59, 130, 246, 0.03)');
      bgGradient1.addColorStop(1, 'rgba(147, 51, 234, 0.02)');
      ctx.fillStyle = bgGradient1;
      ctx.fillRect(0, 0, 800, 600);

      // Soft animated light sweep
      const sweepAngle = (time * 0.002) % (Math.PI * 2);
      const sweepGradient = ctx.createLinearGradient(
        400 + Math.cos(sweepAngle) * 300,
        300 + Math.sin(sweepAngle) * 300,
        400 + Math.cos(sweepAngle + Math.PI) * 300,
        300 + Math.sin(sweepAngle + Math.PI) * 300,
      );
      sweepGradient.addColorStop(0, 'rgba(6, 182, 212, 0)');
      sweepGradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.08)');
      sweepGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
      ctx.fillStyle = sweepGradient;
      ctx.fillRect(0, 0, 800, 600);

      // Parallax depth layer - slow moving nodes
      for (let i = 0; i < 8; i++) {
        const depthX = 100 + i * 100 + Math.sin(time * 0.001 + i) * 30;
        const depthY = 150 + Math.sin(time * 0.0008 + i * 0.5) * 100;
        const depthOpacity = 0.1 + Math.sin(time * 0.001 + i) * 0.05;

        const depthGradient = ctx.createRadialGradient(
          depthX,
          depthY,
          0,
          depthX,
          depthY,
          20,
        );
        depthGradient.addColorStop(0, `rgba(59, 130, 246, ${depthOpacity})`);
        depthGradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
        ctx.fillStyle = depthGradient;
        ctx.beginPath();
        ctx.arc(depthX, depthY, 15, 0, Math.PI * 2);
        ctx.fill();
      }

      // Evidence node halo - particles converging toward center
      proofParticles.forEach((particle, particleIndex) => {
        // Converge animation - accelerates as time progresses
        const convergeFactor = Math.min(time / 2000, 1);
        particle.x +=
          (particle.targetX - particle.x) *
          0.01 *
          particle.speed *
          (0.5 + convergeFactor);
        particle.y +=
          (particle.targetY - particle.y) *
          0.01 *
          particle.speed *
          (0.5 + convergeFactor);

        // Verify particles as they approach center
        const distanceToCenter = Math.sqrt(
          Math.pow(particle.x - particle.targetX, 2) +
            Math.pow(particle.y - particle.targetY, 2),
        );

        if (time > particle.verifyTime && distanceToCenter < 80) {
          particle.verified = true;
        }

        // Particle glow
        const particleGradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 3,
        );

        if (particle.verified) {
          particleGradient.addColorStop(
            0,
            `rgba(16, 185, 129, ${particle.opacity})`,
          );
          particleGradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
        } else {
          particleGradient.addColorStop(
            0,
            `rgba(6, 182, 212, ${particle.opacity * 0.7})`,
          );
          particleGradient.addColorStop(1, 'rgba(6, 182, 212, 0)');
        }

        ctx.fillStyle = particleGradient;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Verification pulse
        if (particle.verified) {
          const pulseSize =
            particle.size * (2 + Math.sin(time * 0.01 + particleIndex * 0.3));
          ctx.strokeStyle = `rgba(16, 185, 129, ${0.3 - (pulseSize - particle.size * 2) * 0.05})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
          ctx.stroke();
        }
      });

      // Central convergence point - the "proof" destination
      const centerGradient = ctx.createRadialGradient(
        400,
        300,
        0,
        400,
        300,
        30,
      );
      centerGradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
      centerGradient.addColorStop(0.7, 'rgba(59, 130, 246, 0.1)');
      centerGradient.addColorStop(1, 'rgba(6, 182, 212, 0.05)');
      ctx.fillStyle = centerGradient;
      ctx.beginPath();
      ctx.arc(400, 300, 25, 0, Math.PI * 2);
      ctx.fill();

      // Central proof symbol
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(392, 300);
      ctx.lineTo(397, 305);
      ctx.lineTo(408, 294);
      ctx.stroke();

      time += 16;
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      // Cleanup animation frame
    };
  }, []);

  // CTA button pulse effect
  useEffect(() => {
    const button = ctaButtonRef.current;
    if (!button) return;

    const pulseInterval = setInterval(() => {
      button.style.boxShadow = '0 0 40px rgba(6, 182, 212, 0.7)';
      setTimeout(() => {
        button.style.boxShadow = '0 0 20px rgba(6, 182, 212, 0.3)';
      }, 800);
    }, 7000);

    return () => clearInterval(pulseInterval);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative py-32 bg-gradient-to-b from-[#0d1421] to-[#0a0f1c] overflow-hidden"
      style={{ position: 'relative' }}
    >
      {/* Enhanced Background Motion Layers - Full Bleed */}
      <motion.div
        style={{ opacity: glow }}
        className="fixed inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/15 to-purple-500/20 pointer-events-none"
      />

      <motion.div
        style={{ y: backgroundY }}
        className="fixed inset-0 pointer-events-none"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10" />

        {/* Radial glow centers - Extended beyond container */}
        <div className="absolute top-1/4 left-1/4 w-[50vw] h-[50vh] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[50vw] h-[50vh] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] bg-purple-500/3 rounded-full blur-3xl" />
      </motion.div>

      {/* Proof-oriented visual element - Full Width */}
      <motion.div
        style={{ opacity }}
        className="fixed inset-0 flex items-center justify-center pointer-events-none"
      >
        <canvas ref={canvasRef} className="opacity-60" />
      </motion.div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <motion.div
          style={{ scale }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Enhanced badge with micro-motion */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </motion.div>
            <span className="text-sm text-cyan-400 font-medium">
              Start Your Free Trial
            </span>
          </motion.div>

          {/* Enhanced title with gradient text on key words */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          >
            Install the{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              Operating System
            </span>
            <br />
            <span className="bg-gradient-to-r from-green-400 via-cyan-500 to-blue-600 bg-clip-text text-transparent">
              Your Compliance Deserves
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Stop managing compliance manually. FormaOS enforces controls,
            captures evidence, and keeps you audit-ready. Every single day.
          </motion.p>

          {/* Enhanced CTA buttons with improved micro-interactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.a
              ref={ctaButtonRef}
              href={`${appBase}/auth/signup?plan=pro`}
              whileHover={{
                scale: 1.05,
                boxShadow:
                  '0 0 40px rgba(6, 182, 212, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.1)',
              }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-lg flex items-center gap-2 transition-all duration-300 shadow-lg shadow-cyan-500/25"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </motion.a>

            <motion.a
              href="/contact"
              whileHover={{
                scale: 1.05,
                boxShadow: '0 0 20px rgba(6, 182, 212, 0.3)',
                backgroundColor: 'rgba(6, 182, 212, 0.05)',
              }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-full border-2 border-gray-600 text-white font-semibold text-lg hover:border-cyan-400 transition-all duration-300"
            >
              Schedule Demo
            </motion.a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-sm text-gray-500 mt-8"
          >
            No credit card required • 14-day free trial • Cancel anytime
          </motion.p>

          {/* High-Trust Data Strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-16 pt-8 border-t border-white/5"
          >
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-center">
              {[
                { value: 'Audit-ready', label: 'Evidence workflows' },
                { value: 'Traceable', label: 'Evidence records' },
                { value: 'SOC 2-aligned', label: 'Trust framework' },
                { value: 'Priority', label: 'Support coverage' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className="flex flex-col items-center min-w-0"
                >
                  <div className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 uppercase tracking-wide font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Additional volumetric lighting effect - Full Bleed */}
      <div className="fixed inset-0 bg-gradient-to-t from-[#0a0f1c]/50 via-transparent to-transparent pointer-events-none" />
    </section>
  );
}

// ============================================
// TRUST SECTION COMPONENT
// ============================================

const trustedBy = [
  'Healthcare & NDIS teams',
  'Aged care operators',
  'Financial services teams',
  'Education & research',
  'Government programs',
  'Community services',
  'Enterprise compliance',
  'Multi-site operators',
];

function TrustSection() {
  return (
    <section className="relative py-20 bg-gradient-to-b from-[#0a0f1c] to-[#080c16] border-y border-white/5 overflow-hidden">
      {/* Subtle animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.4, 0.3],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-sm uppercase tracking-wider text-gray-500 mb-8">
            Built for regulated teams
          </p>
        </motion.div>

        {/* Logo Grid with glassmorphism */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {trustedBy.map((company, index) => (
            <motion.div
              key={company}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group relative flex items-center justify-center p-6 rounded-2xl bg-gradient-to-br from-gray-900/30 to-gray-950/30 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-300 cursor-pointer shadow-lg shadow-black/10"
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/0 to-blue-500/0 group-hover:from-cyan-500/10 group-hover:to-blue-500/5 transition-all duration-500" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/0 group-hover:via-cyan-400/40 to-transparent transition-all duration-500" />

              <span className="relative text-gray-400 group-hover:text-cyan-400 transition-colors duration-300 text-sm font-medium text-center">
                {company}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Stats Row with enhanced visuals */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
        >
          {[
            { value: 'Reliable uptime', label: 'High availability' },
            { value: 'Evidence-first', label: 'Operational traceability' },
            { value: 'Audit-ready', label: 'Continuous readiness' },
            { value: 'Fast access', label: 'Retrieval at speed' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.05, y: -3 }}
              className="text-center p-4 rounded-xl hover:bg-white/5 transition-all duration-300 cursor-default"
            >
              <motion.div
                className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 + index * 0.15 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-xs sm:text-sm text-gray-500">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ============================================
// MAIN HOMEPAGE COMPONENT (exports the complete homepage)
// ============================================

export default function FormaOSHomepage() {
  return (
    <MotionProvider>
      <ComplianceProvider>
        <div className="figma-homepage relative min-h-screen bg-[#0a0f1c] overflow-x-hidden">
          {/* Enhanced Global Particle Field - Performance Optimized */}
          <div className="fixed inset-0 z-0">
            <div className="opacity-40">
              <CinematicField />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
          </div>

          {/* Global WebGL Node System */}
          <div className="fixed inset-0 z-1 opacity-20 pointer-events-none">
            <WebGLNodeField state="model" />
          </div>

          {/* All sections with enhanced depth */}
          <div className="relative z-10">
            <Hero />
            <ValueProposition />
            <ScrollShowcase
              scenes={showcaseScenes}
              badge="Product Tour"
              sectionTitle="See FormaOS in Action"
              sectionSubtitle="Scroll through the key capabilities that make compliance operational, not aspirational."
            />
            <ScrollStory />
            <CapabilitiesGrid />
            <VersionControlHighlight />
            <Industries />
            <HealthcareHighlight />
            <Security />
            <CTASection />
            <TrustSection />
          </div>
        </div>
      </ComplianceProvider>
    </MotionProvider>
  );
}
