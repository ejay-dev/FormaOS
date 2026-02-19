'use client';

import Link from 'next/link';
import type { MotionValue } from 'framer-motion';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { useRef } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';

const procurementFlow = [
  {
    step: '01',
    title: 'Align stakeholders early',
    detail:
      'Bring security, compliance, procurement, and operations into one evaluation flow from day one.',
    icon: Building2,
    color: 'from-cyan-400 to-blue-500',
  },
  {
    step: '02',
    title: 'Run security review in parallel',
    detail:
      'Use the security packet and trust center artifacts while teams validate workspace fit in trial.',
    icon: ShieldCheck,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    step: '03',
    title: 'Close with defensible proof',
    detail:
      'Present ownership trails, evidence chains, and readiness posture for approval without rework.',
    icon: FileCheck2,
    color: 'from-indigo-500 to-purple-500',
  },
] as const;

const artifactBadges = [
  'Security review packet',
  'Framework coverage mapping',
  'Evidence chain posture',
  'Role-based governance model',
  'Audit-ready workflow history',
] as const;

/* ── Horizontal timeline step ── */
function TimelineStep({
  item,
  index,
  isLast,
  scrollProgress,
}: {
  item: (typeof procurementFlow)[number];
  index: number;
  isLast: boolean;
  scrollProgress: MotionValue<number>;
}) {
  const Icon = item.icon;
  const shouldReduceMotion = useReducedMotion();

  // Each step activates at 1/3 intervals
  const stepStart = index * 0.33;
  const stepMid = stepStart + 0.15;
  const nodeScale = useTransform(scrollProgress, [stepStart, stepMid], [0.6, 1]);
  const nodeOpacity = useTransform(scrollProgress, [stepStart, stepMid], [0.3, 1]);
  const contentOpacity = useTransform(scrollProgress, [stepStart, stepMid + 0.05], [0.2, 1]);
  const contentY = useTransform(scrollProgress, [stepStart, stepMid + 0.05], [12, 0]);
  const connectorScaleX = useTransform(scrollProgress, [stepStart + 0.1, stepStart + 0.3], [0, 1]);

  return (
    <div className="relative flex-1 min-w-0">
      {/* Timeline connector line */}
      {!isLast && (
        <div className="absolute top-5 left-[calc(50%+20px)] right-0 h-px bg-white/[0.08] hidden md:block">
          <motion.div
            className={`h-full origin-left bg-gradient-to-r ${item.color}`}
            style={{
              scaleX: shouldReduceMotion ? 1 : connectorScaleX,
            }}
          />
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        {/* Timeline node */}
        <motion.div
          style={shouldReduceMotion ? undefined : { scale: nodeScale, opacity: nodeOpacity }}
          className={`relative z-10 w-10 h-10 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg mb-5`}
        >
          <Icon className="w-5 h-5 text-white" />
        </motion.div>

        {/* Step number */}
        <motion.div
          style={shouldReduceMotion ? undefined : { opacity: contentOpacity, y: contentY }}
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/60 mb-2 block">
            Step {item.step}
          </span>

          <h3 className="text-base font-semibold text-white mb-2">
            {item.title}
          </h3>

          <p className="text-sm leading-relaxed text-slate-400 max-w-[260px] mx-auto">
            {item.detail}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export function ProcurementFlowSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  return (
    <section ref={sectionRef} className="mk-section relative overflow-hidden">
      {/* Process section treatment: subtle top/bottom borders, clean background */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-emerald-400/15 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal variant="blurIn" range={[0, 0.3]} className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-200">
            <BadgeCheck className="h-3.5 w-3.5" />
            Procurement Workflow
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Move from evaluation to procurement without narrative drift
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300 sm:text-base">
            FormaOS connects trust artifacts, product workflows, and buyer
            assurance so enterprise deals progress with fewer blockers.
          </p>
        </ScrollReveal>

        {/* Horizontal timeline */}
        <div className="mt-12 flex flex-col md:flex-row gap-8 md:gap-4">
          {procurementFlow.map((item, idx) => (
            <TimelineStep
              key={item.title}
              item={item}
              index={idx}
              isLast={idx === procurementFlow.length - 1}
              scrollProgress={scrollYProgress}
            />
          ))}
        </div>

        {/* Artifact badges panel */}
        <ScrollReveal variant="fadeUp" range={[0.05, 0.35]} className="mt-12">
          <div className="rounded-2xl bg-[#080c18] border border-white/[0.06] p-5 overflow-hidden relative">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/15 to-transparent" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Buyer-Facing Artifacts
            </p>
            <div className="flex flex-wrap gap-2.5">
              {artifactBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-cyan-400/20 bg-cyan-500/[0.06] px-3 py-1.5 text-xs text-cyan-200"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/trust"
            className="mk-btn mk-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
          >
            Open Trust Center
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/security-review"
            className="mk-btn mk-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
          >
            Review Security Packet
          </Link>
        </div>
      </div>
    </section>
  );
}
