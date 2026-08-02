'use client';

import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useDeviceTier } from '@/lib/device-tier';

// ─── Framework Data ─────────────────────────────────────────────────────────

interface FrameworkNode {
  label: string;
  color: string;       // Tailwind bg class for the dot
  dotColor: string;     // Hex for SVG stroke
  angle: number;        // radians
  x: number;            // px from center
  y: number;            // px from center
  z: number;            // translateZ depth
}

const RADIUS = 200;
const LABELS = ['ISO 27001', 'SOC 2', 'GDPR', 'HIPAA', 'NIST', 'PCI DSS'] as const;
const DOT_COLORS_TW = ['bg-slate-300', 'bg-slate-400', 'bg-slate-400', 'bg-slate-500', 'bg-slate-400', 'bg-slate-500'];
const DOT_COLORS_HEX = ['#cbd5e1', '#94a3b8', '#94a3b8', '#64748b', '#94a3b8', '#64748b'];
const Z_DEPTHS = [-10, -20, -30, -40, -50, -15];

const FRAMEWORK_NODES: FrameworkNode[] = LABELS.map((label, i) => {
  const angle = (Math.PI * 2 * i) / LABELS.length - Math.PI / 2;
  return {
    label,
    color: DOT_COLORS_TW[i],
    dotColor: DOT_COLORS_HEX[i],
    angle,
    x: RADIUS * Math.cos(angle),
    y: RADIUS * Math.sin(angle),
    z: Z_DEPTHS[i],
  };
});

// ─── SVG bezier path builder ────────────────────────────────────────────────

/** Build a quadratic bezier from node position to center (0,0) with a curved control point */
function buildBezierPath(node: FrameworkNode): string {
  const midX = node.x * 0.5;
  const midY = node.y * 0.5;
  // Perpendicular offset for curvature
  const perpX = -node.y * 0.15;
  const perpY = node.x * 0.15;
  const cpX = midX + perpX;
  const cpY = midY + perpY;
  return `M ${node.x} ${node.y} Q ${cpX} ${cpY} 0 0`;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * TrustHeroVisual
 * ───────────────
 * Compliance Framework Web - a constellation of framework nodes
 * connected to a central FormaOS hub via bezier paths. Paths and nodes
 * draw in once on entrance; no perpetual motion, cursor spotlight, or
 * floating particles (kept enterprise-restrained).
 *
 * Rendered in the midground DepthLayer of ImmersiveHero. Desktop-only.
 */
function TrustHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const tierConfig = useDeviceTier();
  const sa =
    !shouldReduceMotion && tierConfig.tier === 'high' && !tierConfig.isTouch; // shouldAnimate

  // SVG viewBox is centered on 0,0 - size 500x500 → -250 to 250
  const svgSize = 500;
  const half = svgSize / 2;

  return (
    <div className="hidden lg:flex items-center justify-center pointer-events-none">
      <div
        className="relative w-[600px] h-[500px]"
        style={{ perspective: 800, transformStyle: 'preserve-3d' as const }}
      >
        {/* ── SVG connection paths ─────────────────────────────────── */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`-${half} -${half} ${svgSize} ${svgSize}`}
          fill="none"
        >
          <defs>
            <linearGradient id="trustWireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(203,213,225,0.5)" />
              <stop offset="100%" stopColor="rgba(148,163,184,0.5)" />
            </linearGradient>
          </defs>

          {FRAMEWORK_NODES.map((node, i) => {
            const d = buildBezierPath(node);
            return (
              <motion.path
                key={`path-${i}`}
                d={d}
                stroke="url(#trustWireGrad)"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                initial={sa ? { pathLength: 0, opacity: 0 } : false}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={
                  sa
                    ? {
                        pathLength: {
                          duration: 0.8,
                          delay: 0.6 + i * 0.15,
                          ease: [0.25, 0.1, 0.25, 1],
                        },
                        opacity: { duration: 0.3, delay: 0.6 + i * 0.15 },
                      }
                    : { duration: 0 }
                }
              />
            );
          })}
        </svg>

        {/* ── Central hub ──────────────────────────────────────────── */}
        <motion.div
          className="absolute flex items-center justify-center"
          style={{
            width: 100,
            height: 100,
            left: '50%',
            top: '50%',
            marginLeft: -50,
            marginTop: -50,
          }}
          initial={sa ? { opacity: 0, scale: 0.8 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={
            sa
              ? { duration: 0.6, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }
              : { duration: 0 }
          }
        >
          {/* Glass circle */}
          <div
            className="relative flex items-center justify-center rounded-full border border-white/25 bg-white/[0.05]"
            style={{ width: 100, height: 100 }}
          >
            <span className="text-xs font-bold text-white tracking-wide select-none">
              FormaOS
            </span>
          </div>
        </motion.div>

        {/* ── Framework nodes ──────────────────────────────────────── */}
        {FRAMEWORK_NODES.map((node, i) => (
          <motion.div
            key={`node-${i}`}
            className="absolute flex items-center justify-center"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: node.x - 40, // center 80px card
              marginTop: node.y - 18,  // center 36px card
              translateZ: node.z,
            }}
            initial={sa ? { opacity: 0, scale: 0.85 } : false}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              sa
                ? {
                    duration: 0.5,
                    delay: 0.8 + i * 0.1,
                    ease: [0.25, 0.1, 0.25, 1],
                  }
                : { duration: 0 }
            }
          >
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.10] bg-white/[0.04]"
              style={{ width: 80, height: 36 }}
            >
              {/* Colored dot */}
              <div
                className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${node.color}`}
              />
              <span className="text-[10px] font-medium text-white/80 whitespace-nowrap leading-none select-none">
                {node.label}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export const TrustHeroVisual = memo(TrustHeroVisualInner);
export default TrustHeroVisual;
