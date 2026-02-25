'use client';

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { easing, duration } from '@/config/motion';

const signatureEase = [...easing.signature] as [number, number, number, number];

/**
 * AboutHeroVisual
 * ───────────────
 * Unique visual for the About page hero:
 * - Vertical timeline line drawn with SVG pathLength animation
 * - 5 milestone nodes with pulsing glow rings
 * - Year labels alternating left/right
 * - Staggered scale+opacity entrance for nodes
 *
 * Rendered in the midground DepthLayer of ImmersiveHero.
 * Desktop-only (hidden on mobile for performance).
 */

const MILESTONES = [
  { year: '2022', label: 'Founded', side: 'left' as const },
  { year: '2023', label: 'First Enterprise Client', side: 'right' as const },
  { year: '2024', label: 'SOC 2 Certified', side: 'left' as const },
  { year: '2025', label: 'Series A', side: 'right' as const },
  { year: '2026', label: 'Global Expansion', side: 'left' as const },
];

function AboutHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;

  const lineHeight = 400;
  const startY = 100;
  const nodeSpacing = lineHeight / (MILESTONES.length - 1);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Timeline with milestones — desktop only */}
      <div className="hidden lg:block relative w-[600px] h-[600px] xl:w-[700px] xl:h-[700px]">
        {/* Central vertical line */}
        <svg
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          width="4"
          height={lineHeight + 40}
          viewBox={`0 0 4 ${lineHeight + 40}`}
          fill="none"
        >
          <motion.line
            x1="2"
            y1="0"
            x2="2"
            y2={lineHeight + 40}
            stroke="rgba(107,114,128,0.3)"
            strokeWidth="1.5"
            initial={sa ? { pathLength: 0, opacity: 0 } : false}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={sa ? {
              pathLength: { duration: 2, ease: signatureEase },
              opacity: { duration: 0.3 },
            } : { duration: 0 }}
          />
        </svg>

        {/* Milestone nodes */}
        {MILESTONES.map((milestone, i) => {
          const yPos = startY + i * nodeSpacing;
          const centerX = 300; // half of 600px container
          const isLeft = milestone.side === 'left';

          return (
            <motion.div
              key={i}
              className="absolute"
              style={{
                top: yPos - 6,
                left: centerX - 6,
              }}
              initial={sa ? { opacity: 0, scale: 0 } : false}
              animate={{ opacity: 1, scale: 1 }}
              transition={sa ? {
                duration: duration.slow,
                delay: 0.6 + i * 0.2,
                ease: signatureEase,
              } : { duration: 0 }}
            >
              {/* Pulsing glow ring */}
              <motion.div
                className="absolute -inset-2 rounded-full bg-violet-500/20"
                animate={sa ? {
                  scale: [1, 1.6, 1],
                  opacity: [0.3, 0.1, 0.3],
                } : undefined}
                transition={sa ? {
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.4,
                } : undefined}
              />

              {/* Node circle */}
              <div className="relative w-3 h-3 rounded-full bg-violet-500/60 border border-violet-400/40" />

              {/* Year + label */}
              <div
                className="absolute top-1/2 -translate-y-1/2 whitespace-nowrap"
                style={{
                  [isLeft ? 'right' : 'left']: 24,
                }}
              >
                <span className="text-xs font-medium text-violet-400/70">
                  {milestone.year}
                </span>
                <span className="text-xs text-gray-500 ml-1.5">
                  {milestone.label}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export const AboutHeroVisual = memo(AboutHeroVisualInner);
export default AboutHeroVisual;
