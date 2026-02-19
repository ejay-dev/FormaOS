'use client';

import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from 'framer-motion';
import { useRef } from 'react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import {
  Box,
  Zap,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';

const steps = [
  {
    id: 'model',
    title: 'Structure',
    description:
      'Define your governance architecture. Map obligations to controls, controls to owners, and owners to evidence requirements. The OS knows who is accountable for what.',
    icon: Box,
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
    color: 'from-pink-500 to-cyan-500',
    features: [
      'Pre-assembled evidence packages',
      'Immutable audit trail',
      'One-click regulatory export',
    ],
  },
];

/* ── Step indicator (left column, desktop pinned layout) ── */
function VerticalStepIndicator({
  scrollYProgress,
}: {
  scrollYProgress: MotionValue<number>;
}) {
  const lineScaleY = useTransform(scrollYProgress, [0, 0.95], [0, 1]);

  // Per-step opacity: active step = 1, others = 0.35
  const step0Opacity = useTransform(scrollYProgress, [0, 0.22, 0.28], [1, 1, 0.35]);
  const step1Opacity = useTransform(scrollYProgress, [0.2, 0.25, 0.47, 0.53], [0.35, 1, 1, 0.35]);
  const step2Opacity = useTransform(scrollYProgress, [0.45, 0.5, 0.72, 0.78], [0.35, 1, 1, 0.35]);
  const step3Opacity = useTransform(scrollYProgress, [0.7, 0.75, 1], [0.35, 1, 1]);
  const stepOpacities = [step0Opacity, step1Opacity, step2Opacity, step3Opacity];

  // Per-step dot scale: active = 1, inactive = 0.6
  const step0Scale = useTransform(scrollYProgress, [0, 0.22, 0.28], [1, 1, 0.6]);
  const step1Scale = useTransform(scrollYProgress, [0.2, 0.25, 0.47, 0.53], [0.6, 1, 1, 0.6]);
  const step2Scale = useTransform(scrollYProgress, [0.45, 0.5, 0.72, 0.78], [0.6, 1, 1, 0.6]);
  const step3Scale = useTransform(scrollYProgress, [0.7, 0.75, 1], [0.6, 1, 1]);
  const stepScales = [step0Scale, step1Scale, step2Scale, step3Scale];

  return (
    <div className="relative flex flex-col justify-between h-[320px]">
      {/* Background line */}
      <div className="absolute left-[9px] top-2 bottom-2 w-px bg-white/10" />

      {/* Progress line */}
      <motion.div
        className="absolute left-[9px] top-2 bottom-2 w-px origin-top bg-gradient-to-b from-cyan-400 via-blue-500 via-purple-500 to-pink-500"
        style={{ scaleY: lineScaleY }}
      />

      {steps.map((step, i) => (
        <motion.div
          key={step.id}
          className="relative flex items-center gap-4 z-10"
          style={{ opacity: stepOpacities[i] }}
        >
          <motion.div
            className={`w-[18px] h-[18px] rounded-full bg-gradient-to-br ${step.color} shadow-lg`}
            style={{ scale: stepScales[i] }}
          />
          <span className="text-sm font-medium text-white whitespace-nowrap">
            {step.title}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

/* ── Pinned card (right column, desktop pinned layout) ── */
function PinnedStoryCard({
  step,
  index,
  scrollYProgress,
}: {
  step: (typeof steps)[0];
  index: number;
  scrollYProgress: MotionValue<number>;
}) {
  const Icon = step.icon;

  const fadeInStart = Math.max(0, index * 0.25 - 0.05);
  const fadeInEnd = index * 0.25 + 0.02;
  const activeEnd = (index + 1) * 0.25 - 0.02;
  const fadeOutEnd = Math.min(1, (index + 1) * 0.25 + 0.03);

  const cardOpacity = useTransform(
    scrollYProgress,
    index === 0
      ? [activeEnd, fadeOutEnd]
      : index === 3
        ? [fadeInStart, fadeInEnd]
        : [fadeInStart, fadeInEnd, activeEnd, fadeOutEnd],
    index === 0
      ? [1, 0]
      : index === 3
        ? [0, 1]
        : [0, 1, 1, 0],
  );

  const cardY = useTransform(
    scrollYProgress,
    [fadeInStart, fadeInEnd],
    index === 0 ? [0, 0] : [24, 0],
  );

  return (
    <motion.div
      style={{ opacity: cardOpacity, y: cardY }}
      className="absolute inset-0 flex items-center"
    >
      <div className="w-full p-8 lg:p-10 rounded-3xl bg-gradient-to-br from-gray-900/70 to-gray-950/70 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/30">
        {/* Gradient overlay */}
        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.color} opacity-[0.04]`} />
        {/* Top glow line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent rounded-t-3xl" />

        <div className="relative">
          {/* Icon + Title */}
          <div className="flex items-center gap-5 mb-5">
            <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-xl`}>
              <Icon className="w-8 h-8 lg:w-10 lg:h-10 text-white" />
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-white">{step.title}</h3>
          </div>

          <p className="text-base lg:text-lg text-gray-300 leading-relaxed mb-6">
            {step.description}
          </p>

          <div className="space-y-3">
            {step.features.map((feature) => (
              <div key={feature} className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${step.color} mt-2 flex-shrink-0`} />
                <span className="text-sm text-gray-400">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Mobile card (normal scroll, no pinning) ── */
function MobileStoryCard({ step, index }: { step: (typeof steps)[0]; index: number }) {
  const Icon = step.icon;
  return (
    <ScrollReveal variant="clipUp" range={[index * 0.04, 0.35 + index * 0.04]}>
      <motion.div
        whileHover={{ y: -4 }}
        className="group relative p-8 rounded-3xl bg-gradient-to-br from-gray-900/50 to-gray-950/50 backdrop-blur-xl border border-white/5 hover:border-cyan-500/20 transition-all duration-500 shadow-xl shadow-black/20"
      >
        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

        <div className="flex items-center gap-4 mb-6">
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold group-hover:text-cyan-400 transition-colors duration-300">
            {step.title}
          </h3>
        </div>

        <p className="text-gray-400 leading-relaxed mb-6">{step.description}</p>

        <div className="space-y-3">
          {step.features.map((feature) => (
            <div key={feature} className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${step.color}`} />
              <span className="text-sm text-gray-500">{feature}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </ScrollReveal>
  );
}

/* ── Section header (shared between layouts) ── */
function SectionHeader() {
  return (
    <>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
        <span className="w-2 h-2 rounded-full bg-cyan-400" />
        How It Works
      </div>

      <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
        The Compliance
        <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-500 bg-clip-text text-transparent">
          {' '}Lifecycle
        </span>
      </h2>
      <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
        From framework mapping to audit defense — a complete workflow that
        transforms obligations into enforceable controls with clear ownership.
      </p>
    </>
  );
}

/* ── Main export ── */
export function ScrollStory() {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Horizontal progress bar (desktop only)
  const progressScale = useTransform(scrollYProgress, [0, 1], [0.02, 1]);

  /* ── Mobile / reduced-motion: normal scrolling grid ── */
  if (shouldReduceMotion) {
    return (
      <section className="mk-section relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-20">
            <SectionHeader />
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {steps.map((step, i) => (
              <MobileStoryCard key={step.id} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      {/* Mobile layout (< lg): normal scroll grid */}
      <section className="lg:hidden mk-section relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <SectionHeader />
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {steps.map((step, i) => (
              <MobileStoryCard key={step.id} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Desktop layout (lg+): pinned scroll experience */}
      <section
        ref={containerRef}
        className="hidden lg:block relative"
        style={{ height: '400vh' }}
      >
        <div className="sticky top-0 h-screen flex items-center overflow-hidden">
          <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-12">
            {/* Background ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-cyan-500/[0.03] via-blue-500/[0.04] to-purple-500/[0.03] rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Left column: header + step indicator */}
              <div className="col-span-4 xl:col-span-3">
                <div className="mb-12">
                  <SectionHeader />
                </div>

                {/* Progress bar */}
                <div className="mb-10 h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    className="h-full origin-left bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500"
                    style={{ scaleX: progressScale }}
                  />
                </div>

                <VerticalStepIndicator scrollYProgress={scrollYProgress} />
              </div>

              {/* Right column: pinned cards */}
              <div className="col-span-8 xl:col-span-9 relative" style={{ minHeight: '420px' }}>
                {steps.map((step, i) => (
                  <PinnedStoryCard
                    key={step.id}
                    step={step}
                    index={i}
                    scrollYProgress={scrollYProgress}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
