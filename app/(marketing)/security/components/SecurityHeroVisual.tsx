'use client';

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { easing, duration } from '@/config/motion';

const signatureEase = [...easing.signature] as [number, number, number, number];

/**
 * SecurityHeroVisual
 * ──────────────────
 * Unique visual for the Security page hero:
 * - Animated shield SVG with pulsing core glow
 * - Encrypted chain links orbiting the shield
 * - Network node constellation connecting outward
 *
 * Rendered in the midground DepthLayer of ImmersiveHero.
 * Desktop-only (hidden on mobile for performance).
 */
function SecurityHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Shield + chain constellation — desktop only */}
      <div className="hidden lg:block relative w-[600px] h-[600px] xl:w-[700px] xl:h-[700px]">
        {/* Central shield glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40"
          animate={sa ? {
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.5, 0.3],
          } : undefined}
          transition={sa ? {
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          } : undefined}
        >
          <div className="w-full h-full rounded-full bg-cyan-500/20 blur-3xl" />
        </motion.div>

        {/* Shield icon SVG */}
        <motion.svg
          viewBox="0 0 120 140"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-28 xl:w-28 xl:h-32"
          initial={sa ? { opacity: 0, scale: 0.8 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={sa ? { duration: duration.slower, delay: 0.5, ease: signatureEase } : { duration: 0 }}
        >
          {/* Shield body */}
          <motion.path
            d="M60 10 L105 35 L105 75 Q105 115 60 135 Q15 115 15 75 L15 35 Z"
            fill="none"
            stroke="rgba(34,211,238,0.5)"
            strokeWidth="2"
            initial={sa ? { pathLength: 0 } : false}
            animate={{ pathLength: 1 }}
            transition={sa ? { duration: 1.5, delay: 0.6, ease: signatureEase } : { duration: 0 }}
          />
          {/* Inner shield glow fill */}
          <path
            d="M60 18 L98 40 L98 74 Q98 110 60 128 Q22 110 22 74 L22 40 Z"
            fill="rgba(34,211,238,0.04)"
          />
          {/* Lock icon inside shield */}
          <motion.g
            initial={sa ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={sa ? { duration: duration.slow, delay: 1.2 } : { duration: 0 }}
          >
            <rect x="47" y="62" width="26" height="22" rx="4" fill="none" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5" />
            <path d="M52 62 V55 Q52 45 60 45 Q68 45 68 55 V62" fill="none" stroke="rgba(34,211,238,0.6)" strokeWidth="1.5" />
            <circle cx="60" cy="73" r="3" fill="rgba(34,211,238,0.6)" />
          </motion.g>
        </motion.svg>

        {/* Orbiting chain nodes */}
        {CHAIN_NODES.map((node, i) => (
          <motion.div
            key={i}
            className="absolute w-3 h-3 rounded-full"
            style={{
              top: node.y,
              left: node.x,
              background: `radial-gradient(circle, ${node.color}40, ${node.color}10)`,
              border: `1px solid ${node.color}30`,
            }}
            initial={sa ? { opacity: 0, scale: 0 } : false}
            animate={sa ? {
              opacity: [0.4, 0.7, 0.4],
              scale: [0.8, 1.1, 0.8],
            } : { opacity: 0.5 }}
            transition={sa ? {
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.8 + i * 0.15,
            } : { duration: 0 }}
          />
        ))}

        {/* Connecting wire paths */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 700 700">
          {WIRE_PATHS.map((path, i) => (
            <motion.path
              key={i}
              d={path}
              fill="none"
              stroke="rgba(34,211,238,0.12)"
              strokeWidth="1"
              initial={sa ? { pathLength: 0, opacity: 0 } : false}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={sa ? {
                pathLength: { duration: 1.8, delay: 1 + i * 0.2, ease: signatureEase },
                opacity: { duration: 0.3, delay: 1 + i * 0.2 },
              } : { duration: 0 }}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

// ─── Data ───

const CHAIN_NODES = [
  { x: '18%', y: '25%', color: 'rgba(34,211,238)' },
  { x: '78%', y: '20%', color: 'rgba(59,130,246)' },
  { x: '85%', y: '55%', color: 'rgba(34,211,238)' },
  { x: '72%', y: '78%', color: 'rgba(52,211,153)' },
  { x: '25%', y: '75%', color: 'rgba(59,130,246)' },
  { x: '12%', y: '50%', color: 'rgba(34,211,238)' },
  { x: '42%', y: '12%', color: 'rgba(139,92,246)' },
  { x: '58%', y: '88%', color: 'rgba(52,211,153)' },
];

const WIRE_PATHS = [
  'M 126 175 Q 250 200 350 350',    // top-left → center
  'M 546 140 Q 450 200 350 350',    // top-right → center
  'M 595 385 Q 480 370 350 350',    // right → center
  'M 504 546 Q 430 460 350 350',    // bottom-right → center
  'M 175 525 Q 260 440 350 350',    // bottom-left → center
  'M 84 350 Q 210 350 350 350',     // left → center
];

export const SecurityHeroVisual = memo(SecurityHeroVisualInner);
export default SecurityHeroVisual;
