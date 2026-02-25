'use client';

import { memo } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';

/**
 * AboutHeroVisual — "Timeline Pillar"
 * ────────────────────────────────────
 * Vertical glass pillar with animated energy line and 5 milestone nodes.
 * Nodes alternate left/right at different Z depths.
 * Cursor tilts entire structure via rotateX/Y; nodes get extra parallax.
 * Desktop-only, pointer-events-none.
 */

const MILESTONES = [
  { year: '2022', label: 'Founded', color: 'rgb(16,185,129)', z: -10 },
  { year: '2023', label: 'First Client', color: 'rgb(6,182,212)', z: -25 },
  { year: '2024', label: 'SOC 2', color: 'rgb(59,130,246)', z: -35 },
  { year: '2025', label: 'Series A', color: 'rgb(139,92,246)', z: -45 },
  { year: '2026', label: 'Global', color: 'rgb(245,158,11)', z: -50 },
] as const;

function AboutHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const cursor = useCursorPosition();

  // Cursor-driven tilt for the whole structure (±4°)
  const rotateY = useTransform(cursor.mouseX, [0, 1], [-4, 4]);
  const rotateX = useTransform(cursor.mouseY, [0, 1], [4, -4]);

  const pillarHeight = 400;
  const nodeSpacing = pillarHeight / (MILESTONES.length - 1);

  // Static layout for reduced motion
  if (shouldReduceMotion) {
    return (
      <div className="hidden lg:flex items-center justify-center pointer-events-none w-[300px] h-[450px]">
        <div className="relative w-[40px] h-[400px] rounded-2xl border border-emerald-500/20 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02]">
          {MILESTONES.map((m, i) => {
            const isLeft = i % 2 === 0;
            const top = i * nodeSpacing;
            return (
              <div
                key={m.year}
                className="absolute flex items-center gap-2"
                style={{
                  top,
                  [isLeft ? 'right' : 'left']: 52,
                }}
              >
                <div
                  className="rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-2 py-1 flex items-center gap-1.5"
                  style={{ width: 90, height: 30 }}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-[10px] text-white/70 font-medium whitespace-nowrap">
                    {m.year} {m.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:flex items-center justify-center pointer-events-none w-[300px] h-[450px]">
      <motion.div
        className="relative"
        style={{
          perspective: 800,
          transformStyle: 'preserve-3d',
          width: 300,
          height: 450,
          rotateX: cursor.isActive ? rotateX : 0,
          rotateY: cursor.isActive ? rotateY : 0,
        }}
      >
        {/* Central glass pillar */}
        <motion.div
          className="absolute left-1/2 top-[25px] -translate-x-1/2 rounded-2xl border border-emerald-500/20 backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] overflow-hidden"
          style={{
            width: 40,
            height: pillarHeight,
            transformStyle: 'preserve-3d',
          }}
          initial={{ scaleY: 0, opacity: 0 }}
          animate={{ scaleY: 1, opacity: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Animated energy line running upward */}
          <motion.div
            className="absolute inset-0"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent 0px, transparent 30px, rgba(16,185,129,0.25) 30px, rgba(16,185,129,0.25) 60px)',
              backgroundSize: '100% 120px',
            }}
            animate={{ backgroundPositionY: [0, -120] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          {/* Inner glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 via-transparent to-cyan-500/10" />
        </motion.div>

        {/* Milestone nodes */}
        {MILESTONES.map((m, i) => {
          const isLeft = i % 2 === 0;
          const top = 25 + i * nodeSpacing;
          const centerX = 150; // half of 300

          // Extra parallax per node based on Z depth
          const nodeParallaxX = useTransform(cursor.mouseX, [0, 1], [m.z * 0.15, -m.z * 0.15]);
          const nodeParallaxY = useTransform(cursor.mouseY, [0, 1], [m.z * 0.1, -m.z * 0.1]);

          return (
            <motion.div
              key={m.year}
              className="absolute"
              style={{
                top: top - 15,
                left: isLeft ? centerX - 120 : centerX + 30,
                translateX: cursor.isActive ? nodeParallaxX : 0,
                translateY: cursor.isActive ? nodeParallaxY : 0,
                translateZ: m.z,
                transformStyle: 'preserve-3d',
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.8 + i * 0.15,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Glass card node */}
              <div
                className="rounded-2xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-2 py-1 flex items-center gap-1.5"
                style={{ width: 90, height: 30 }}
              >
                {/* Colored dot */}
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: m.color,
                    boxShadow: `0 0 6px ${m.color}`,
                  }}
                />
                <span className="text-[10px] text-white/70 font-medium whitespace-nowrap">
                  {m.year} {m.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

export const AboutHeroVisual = memo(AboutHeroVisualInner);
export default AboutHeroVisual;
