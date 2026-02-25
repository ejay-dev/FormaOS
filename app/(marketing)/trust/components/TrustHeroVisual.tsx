'use client';

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { easing, duration } from '@/config/motion';

const signatureEase = [...easing.signature] as [number, number, number, number];

/**
 * TrustHeroVisual
 * ───────────────
 * Unique visual for the Trust page hero:
 * - Central compliance core node with emerald pulsing glow
 * - 6 framework nodes in hexagonal arrangement (ISO 27001, SOC 2, etc.)
 * - SVG wire connections with staggered path-drawing animations
 *
 * Rendered in the midground DepthLayer of ImmersiveHero.
 * Desktop-only (hidden on mobile for performance).
 */
function TrustHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const sa = !shouldReduceMotion;

  const cx = 350;
  const cy = 350;
  const radius = 200;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      {/* Compliance graph constellation — desktop only */}
      <div className="hidden lg:block relative w-[600px] h-[600px] xl:w-[700px] xl:h-[700px]">
        {/* Central core glow */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32"
          animate={sa ? {
            scale: [1, 1.2, 1],
            opacity: [0.25, 0.45, 0.25],
          } : undefined}
          transition={sa ? {
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          } : undefined}
        >
          <div className="w-full h-full rounded-full bg-emerald-500/20 blur-3xl" />
        </motion.div>

        {/* SVG layer for wires + nodes */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 700 700">
          {/* Wire connections from each framework node to center */}
          {FRAMEWORK_NODES.map((node, i) => (
            <motion.line
              key={`wire-${i}`}
              x1={cx}
              y1={cy}
              x2={node.x}
              y2={node.y}
              stroke="url(#wireGradient)"
              strokeWidth="1.5"
              initial={sa ? { pathLength: 0, opacity: 0 } : false}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={sa ? {
                pathLength: { duration: 1.4, delay: 0.8 + i * 0.15, ease: signatureEase },
                opacity: { duration: 0.3, delay: 0.8 + i * 0.15 },
              } : { duration: 0 }}
            />
          ))}

          {/* Gradient definition for wires */}
          <defs>
            <linearGradient id="wireGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(52,211,153,0.35)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0.35)" />
            </linearGradient>
            <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(52,211,153,0.3)" />
              <stop offset="100%" stopColor="rgba(52,211,153,0.05)" />
            </radialGradient>
          </defs>

          {/* Central compliance core */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={28}
            fill="url(#coreGradient)"
            stroke="rgba(52,211,153,0.4)"
            strokeWidth="1.5"
            initial={sa ? { opacity: 0, scale: 0.5 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={sa ? { duration: duration.slower, delay: 0.3, ease: signatureEase } : { duration: 0 }}
          />
          <motion.circle
            cx={cx}
            cy={cy}
            r={28}
            fill="none"
            stroke="rgba(52,211,153,0.2)"
            strokeWidth="1"
            animate={sa ? {
              r: [28, 36, 28],
              opacity: [0.3, 0.1, 0.3],
            } : undefined}
            transition={sa ? {
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            } : undefined}
          />
          <motion.text
            x={cx}
            y={cy + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-emerald-400/70 text-[9px] font-medium tracking-wider"
            initial={sa ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={sa ? { duration: duration.slow, delay: 0.6 } : { duration: 0 }}
          >
            CORE
          </motion.text>
        </svg>

        {/* Framework nodes */}
        {FRAMEWORK_NODES.map((node, i) => (
          <motion.div
            key={`node-${i}`}
            className="absolute flex items-center justify-center"
            style={{
              left: `${(node.x / 700) * 100}%`,
              top: `${(node.y / 700) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={sa ? { opacity: 0, scale: 0.5 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={sa ? {
              duration: duration.slower,
              delay: 1.0 + i * 0.12,
              ease: signatureEase,
            } : { duration: 0 }}
          >
            {/* Node pulse animation */}
            <motion.div
              className="absolute inset-0 rounded-xl bg-emerald-500/10 blur-md"
              animate={sa ? {
                scale: [1, 1.3, 1],
                opacity: [0.2, 0.4, 0.2],
              } : undefined}
              transition={sa ? {
                duration: node.pulseDuration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.3,
              } : undefined}
            />
            {/* Glass card */}
            <div className="relative px-3 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] backdrop-blur-sm">
              <span className="text-[10px] xl:text-[11px] font-medium text-emerald-300/80 whitespace-nowrap tracking-wide">
                {node.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Data ───

const FRAMEWORK_NODES = (() => {
  const cx = 350;
  const cy = 350;
  const r = 200;
  const labels = ['ISO 27001', 'SOC 2', 'GDPR', 'HIPAA', 'NIST', 'PCI DSS'];
  const pulseDurations = [3.5, 4.2, 3.8, 4.5, 3.2, 4.0];

  return labels.map((label, i) => {
    const angle = (Math.PI * 2 * i) / labels.length - Math.PI / 2;
    return {
      label,
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      pulseDuration: pulseDurations[i],
    };
  });
})();

export const TrustHeroVisual = memo(TrustHeroVisualInner);
export default TrustHeroVisual;
