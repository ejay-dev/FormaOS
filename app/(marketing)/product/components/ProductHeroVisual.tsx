'use client';

import { memo, useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { easing, duration } from '@/config/motion';

const signatureEase = [...easing.signature] as [number, number, number, number];

/**
 * ProductHeroVisual
 * ─────────────────
 * Scroll-driven 3-state UI transformation:
 * Observe → Explore → Deploy
 *
 * Each phase shows a different product UI panel that morphs
 * based on scroll progress through the hero section.
 * Desktop-only for performance.
 */
function ProductHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  // Phase transitions: 0-0.33 = Observe, 0.33-0.66 = Explore, 0.66-1 = Deploy
  const observeOpacity = useTransform(scrollYProgress, [0, 0.15, 0.28, 0.38], [0, 1, 1, 0]);
  const observeScale = useTransform(scrollYProgress, [0, 0.15, 0.28, 0.38], [0.9, 1, 1, 0.95]);
  const observeY = useTransform(scrollYProgress, [0, 0.15, 0.28, 0.38], [30, 0, 0, -20]);

  const exploreOpacity = useTransform(scrollYProgress, [0.28, 0.38, 0.55, 0.65], [0, 1, 1, 0]);
  const exploreScale = useTransform(scrollYProgress, [0.28, 0.38, 0.55, 0.65], [0.9, 1, 1, 0.95]);
  const exploreY = useTransform(scrollYProgress, [0.28, 0.38, 0.55, 0.65], [30, 0, 0, -20]);

  const deployOpacity = useTransform(scrollYProgress, [0.55, 0.65, 0.85, 1], [0, 1, 1, 0.6]);
  const deployScale = useTransform(scrollYProgress, [0.55, 0.65, 0.85, 1], [0.9, 1, 1, 0.98]);
  const deployY = useTransform(scrollYProgress, [0.55, 0.65, 0.85, 1], [30, 0, 0, -10]);

  // Progress indicator
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
    >
      <div className="hidden lg:block relative w-[550px] h-[400px] xl:w-[650px] xl:h-[450px]">
        {/* Phase indicator pills */}
        <motion.div
          className="absolute -top-8 left-1/2 -translate-x-1/2 flex gap-3 items-center"
          initial={sa ? { opacity: 0, y: 10 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={sa ? { duration: duration.slow, delay: 0.8, ease: signatureEase } : { duration: 0 }}
        >
          {PHASES.map((phase, i) => (
            <div key={phase.label} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-violet-400' : i === 1 ? 'bg-blue-400' : 'bg-emerald-400'}`} />
              <span className="text-xs text-gray-500 font-medium">{phase.label}</span>
              {i < 2 && <div className="w-8 h-px bg-white/10" />}
            </div>
          ))}
        </motion.div>

        {/* Progress bar */}
        <div className="absolute -top-2 left-0 right-0 h-px bg-white/5 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-violet-500 via-blue-500 to-emerald-500" style={{ width: progressWidth }} />
        </div>

        {/* ─── Phase 1: Observe (Compliance Dashboard) ─── */}
        <motion.div
          className="absolute inset-0"
          style={sa ? { opacity: observeOpacity, scale: observeScale, y: observeY } : undefined}
        >
          <UIPanel title="Compliance Dashboard" accentColor="violet">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/20 border border-violet-500/30" />
                <div className="flex-1">
                  <div className="w-32 h-2.5 bg-white/15 rounded" />
                  <div className="w-20 h-2 bg-white/8 rounded mt-1.5" />
                </div>
                <div className="w-16 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30" />
                <div className="flex-1">
                  <div className="w-28 h-2.5 bg-white/15 rounded" />
                  <div className="w-24 h-2 bg-white/8 rounded mt-1.5" />
                </div>
                <div className="w-16 h-6 rounded-full bg-amber-500/20 border border-amber-500/30" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30" />
                <div className="flex-1">
                  <div className="w-36 h-2.5 bg-white/15 rounded" />
                  <div className="w-16 h-2 bg-white/8 rounded mt-1.5" />
                </div>
                <div className="w-16 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30" />
              </div>
            </div>
          </UIPanel>
        </motion.div>

        {/* ─── Phase 2: Explore (Task Breakdown) ─── */}
        <motion.div
          className="absolute inset-0"
          style={sa ? { opacity: exploreOpacity, scale: exploreScale, y: exploreY } : undefined}
        >
          <UIPanel title="Evidence Collection" accentColor="blue">
            <div className="space-y-2.5">
              {['Access review completed', 'Policy attestation signed', 'Backup verification run', 'Vulnerability scan clear'].map((task, i) => (
                <div key={task} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.03]">
                  <div className={`w-5 h-5 rounded border ${i < 2 ? 'bg-blue-500/30 border-blue-500/40' : 'border-white/15'}`}>
                    {i < 2 && (
                      <svg viewBox="0 0 20 20" className="w-full h-full text-blue-300">
                        <path d="M6 10l3 3 5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{task}</span>
                </div>
              ))}
            </div>
          </UIPanel>
        </motion.div>

        {/* ─── Phase 3: Deploy (Audit Report) ─── */}
        <motion.div
          className="absolute inset-0"
          style={sa ? { opacity: deployOpacity, scale: deployScale, y: deployY } : undefined}
        >
          <UIPanel title="Audit Report" accentColor="emerald">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">Overall Score</span>
                <span className="text-sm font-semibold text-emerald-400">94%</span>
              </div>
              <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-[94%] bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full" />
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {[
                  { label: 'Controls', value: '142/148' },
                  { label: 'Evidence', value: '98%' },
                  { label: 'Findings', value: '3 Low' },
                ].map((stat) => (
                  <div key={stat.label} className="text-center p-2 rounded-lg bg-white/[0.03]">
                    <div className="text-xs text-emerald-400 font-semibold">{stat.value}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </UIPanel>
        </motion.div>
      </div>
    </div>
  );
}

// ─── UI Panel wrapper ───

function UIPanel({
  title,
  accentColor,
  children,
}: {
  title: string;
  accentColor: 'violet' | 'blue' | 'emerald';
  children: React.ReactNode;
}) {
  const accentMap = {
    violet: 'border-violet-500/20 shadow-[0_0_40px_rgba(139,92,246,0.08)]',
    blue: 'border-blue-500/20 shadow-[0_0_40px_rgba(59,130,246,0.08)]',
    emerald: 'border-emerald-500/20 shadow-[0_0_40px_rgba(52,211,153,0.08)]',
  };

  const dotMap = {
    violet: 'bg-violet-400',
    blue: 'bg-blue-400',
    emerald: 'bg-emerald-400',
  };

  return (
    <div className={`w-full h-full rounded-2xl bg-white/[0.04] backdrop-blur-md border ${accentMap[accentColor]} p-5`}>
      {/* Title bar */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
        <div className={`w-2.5 h-2.5 rounded-full ${dotMap[accentColor]}`} />
        <span className="text-sm font-medium text-gray-300">{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Data ───

const PHASES = [
  { label: 'Observe' },
  { label: 'Explore' },
  { label: 'Deploy' },
];

export const ProductHeroVisual = memo(ProductHeroVisualInner);
export default ProductHeroVisual;
