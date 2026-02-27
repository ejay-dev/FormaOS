'use client';

import { useRef } from 'react';
import { ArrowRight, CheckCircle, Activity, UserCheck } from 'lucide-react';
import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import dynamic from 'next/dynamic';

const DemoComplianceChain = dynamic(() => import('@/components/marketing/demo/DemoComplianceChain'), { ssr: false });

const flow = [
  { step: 'Obligations', becomes: 'structured controls', color: 'from-violet-400 to-purple-500' },
  { step: 'Controls', becomes: 'owned tasks', color: 'from-purple-500 to-violet-600' },
  { step: 'Tasks', becomes: 'live evidence', color: 'from-violet-600 to-purple-600' },
  { step: 'Evidence', becomes: 'complete audit trail', color: 'from-fuchsia-500 to-violet-500' },
];

/** Glow node overlay for each card when the scroll path reaches it */
function NodeGlow({ progress, threshold }: { progress: MotionValue<number>; threshold: number }) {
  const opacity = useTransform(progress, [Math.max(0, threshold - 0.08), threshold, threshold + 0.1], [0, 1, 0.6]);
  const scale = useTransform(progress, [Math.max(0, threshold - 0.08), threshold], [0.8, 1]);
  return (
    <motion.div
      style={{ opacity, scale }}
      className="absolute -inset-1 rounded-2xl bg-violet-400/15 blur-md pointer-events-none z-0"
    />
  );
}

export function ObligationToExecution() {
  const sectionRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Drive the SVG path length from 0 to 1 as the section scrolls into view
  const pathLength = useTransform(scrollYProgress, [0.1, 0.55], [0, 1]);

  // Thresholds at which each node should glow (evenly spaced across scroll range)
  const nodeThresholds = [0.18, 0.30, 0.42, 0.54];

  return (
    <section ref={sectionRef} className="product-section product-section--process relative py-32 overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.35]}>
          <div className="text-center mb-16">
            <ScrollReveal variant="scaleUp" range={[0, 0.3]}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-violet-400" />
                From Obligation to Execution
              </div>
            </ScrollReveal>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
              You Don't Just Record
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                {' '}
                Compliance. You Run It.
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Most compliance platforms stop at documentation. FormaOS goes
              further. It operationalizes compliance across your organization.
            </p>
          </div>
        </ScrollReveal>

        {/* Scroll-driven SVG connection path (desktop only) */}
        {!prefersReducedMotion && (
          <div className="hidden lg:block absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
            <svg
              className="absolute top-0 left-0 w-full h-full"
              viewBox="0 0 1000 200"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Horizontal bezier path connecting 4 nodes across the card grid */}
              <motion.path
                d="M 100 100 C 200 40, 300 160, 375 100 C 450 40, 550 160, 625 100 C 700 40, 800 160, 900 100"
                stroke="url(#connection-gradient)"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
                filter="drop-shadow(0 0 12px rgba(192,132,252,0.6))"
                style={{ pathLength }}
              />
              {/* Glow duplicate for the drawn portion */}
              <motion.path
                d="M 100 100 C 200 40, 300 160, 375 100 C 450 40, 550 160, 625 100 C 700 40, 800 160, 900 100"
                stroke="url(#connection-gradient)"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
                opacity="0.25"
                filter="blur(6px)"
                style={{ pathLength }}
              />
              <defs>
                <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#B46CFF" />
                  <stop offset="50%" stopColor="#C084FC" />
                  <stop offset="100%" stopColor="#F0ABFC" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        )}

        <SectionChoreography pattern="cascade" stagger={0.04} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {flow.map((item, index) => (
            <div key={item.step} className="relative group">
              {/* Node glow that pulses when the scroll path reaches this card */}
              {!prefersReducedMotion && (
                <NodeGlow progress={scrollYProgress} threshold={nodeThresholds[index]} />
              )}
              <div className="product-panel product-panel--interactive relative z-10 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-2xl border border-white/10 p-6 hover:border-violet-500/30 transition-all">
                <div className={`inline-flex px-3 py-1 rounded-full bg-gradient-to-r ${item.color} text-white text-xs font-semibold mb-4`}>
                  {item.step}
                </div>
                <p className="text-gray-400">
                  become{' '}
                  <span className="text-white font-medium">{item.becomes}</span>
                </p>
              </div>
              {index < flow.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                  <ArrowRight className="w-5 h-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}
        </SectionChoreography>

        <ScrollReveal variant="depthSlide" range={[0.1, 0.4]}>
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="product-panel product-panel--strong rounded-2xl p-2">
              <DemoComplianceChain glowColor="from-purple-500/15 to-pink-500/15" />
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal variant="perspectiveUp" range={[0.12, 0.42]}>
          <div className="mt-12 grid sm:grid-cols-3 gap-6 text-center">
            <div className="product-panel product-panel--soft flex items-center justify-center gap-2 rounded-xl p-4 text-sm text-gray-400">
              <Activity className="w-4 h-4 text-violet-400" />
              Every action is tracked
            </div>
            <div className="product-panel product-panel--soft flex items-center justify-center gap-2 rounded-xl p-4 text-sm text-gray-400">
              <UserCheck className="w-4 h-4 text-purple-400" />
              Every control has an owner
            </div>
            <div className="product-panel product-panel--soft flex items-center justify-center gap-2 rounded-xl p-4 text-sm text-gray-400">
              <CheckCircle className="w-4 h-4 text-fuchsia-400" />
              Every outcome is provable
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
