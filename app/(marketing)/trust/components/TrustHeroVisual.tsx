'use client';

import { memo, useMemo } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';
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
  parallaxScale: number; // multiplier for cursor parallax
}

const RADIUS = 200;
const LABELS = ['ISO 27001', 'SOC 2', 'GDPR', 'HIPAA', 'NIST', 'PCI DSS'] as const;
const DOT_COLORS_TW = ['bg-emerald-400', 'bg-cyan-400', 'bg-blue-400', 'bg-violet-400', 'bg-amber-400', 'bg-rose-400'];
const DOT_COLORS_HEX = ['#34d399', '#22d3ee', '#60a5fa', '#a78bfa', '#fbbf24', '#fb7185'];
const Z_DEPTHS = [-10, -20, -30, -40, -50, -15];
const PARALLAX_SCALES = [1.2, 1.0, 0.8, 1.4, 0.6, 1.1];

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
    parallaxScale: PARALLAX_SCALES[i],
  };
});

// ─── Particle Data ──────────────────────────────────────────────────────────

interface Particle {
  id: number;
  nodeIndex: number;
  offset: number;   // 0-1 along the path
  speed: number;     // seconds for full loop
  delay: number;     // animation-delay
}

const PARTICLES: Particle[] = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  nodeIndex: i % 6,
  offset: Math.random(),
  speed: 4 + Math.random() * 4,
  delay: Math.random() * -8,
}));

// ─── SVG bezier path builder ────────────────────────────────────────────────

/** Build a quadratic bezier from node position to center (0,0) with a curved control point */
function buildBezierPath(node: FrameworkNode): string {
  // Control point is offset perpendicular to the line for curvature
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
 * Compliance Framework Web — a 3D constellation of framework nodes
 * connected to a central FormaOS hub via animated bezier paths,
 * with cursor-reactive parallax and floating evidence particles.
 *
 * Rendered in the midground DepthLayer of ImmersiveHero.
 * Desktop-only (hidden on mobile for performance).
 */
function TrustHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const tierConfig = useDeviceTier();
  const sa =
    !shouldReduceMotion && tierConfig.tier === 'high' && !tierConfig.isTouch; // shouldAnimate
  const { mouseX, mouseY, isActive } = useCursorPosition();

  // Constellation tilt from cursor (±4°)
  const rotateX = useTransform(mouseY, [0, 1], [4, -4]);
  const rotateY = useTransform(mouseX, [0, 1], [-4, 4]);

  // Per-node parallax transforms — each node gets extra offset based on parallaxScale
  const nodeTransforms = useMemo(() => {
    return FRAMEWORK_NODES.map((node) => ({
      // We'll compute these as style in the render using the raw approach
      xRange: [-12 * node.parallaxScale, 12 * node.parallaxScale],
      yRange: [-12 * node.parallaxScale, 12 * node.parallaxScale],
    }));
  }, []);

  // Build individual useTransform calls for each node
  const n0x = useTransform(mouseX, [0, 1], nodeTransforms[0].xRange);
  const n0y = useTransform(mouseY, [0, 1], nodeTransforms[0].yRange);
  const n1x = useTransform(mouseX, [0, 1], nodeTransforms[1].xRange);
  const n1y = useTransform(mouseY, [0, 1], nodeTransforms[1].yRange);
  const n2x = useTransform(mouseX, [0, 1], nodeTransforms[2].xRange);
  const n2y = useTransform(mouseY, [0, 1], nodeTransforms[2].yRange);
  const n3x = useTransform(mouseX, [0, 1], nodeTransforms[3].xRange);
  const n3y = useTransform(mouseY, [0, 1], nodeTransforms[3].yRange);
  const n4x = useTransform(mouseX, [0, 1], nodeTransforms[4].xRange);
  const n4y = useTransform(mouseY, [0, 1], nodeTransforms[4].yRange);
  const n5x = useTransform(mouseX, [0, 1], nodeTransforms[5].xRange);
  const n5y = useTransform(mouseY, [0, 1], nodeTransforms[5].yRange);

  const nodeParallax = [
    { x: n0x, y: n0y },
    { x: n1x, y: n1y },
    { x: n2x, y: n2y },
    { x: n3x, y: n3y },
    { x: n4x, y: n4y },
    { x: n5x, y: n5y },
  ];

  // SVG viewBox is centered on 0,0 — size 500x500 → -250 to 250
  const svgSize = 500;
  const half = svgSize / 2;

  return (
    <div className="hidden lg:flex items-center justify-center pointer-events-none">
      <motion.div
        className="relative w-[600px] h-[500px]"
        style={
          sa && isActive
            ? {
                rotateX,
                rotateY,
                perspective: 800,
                transformStyle: 'preserve-3d' as const,
              }
            : { perspective: 800, transformStyle: 'preserve-3d' as const }
        }
      >
        {/* ── SVG connection paths ─────────────────────────────────── */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`-${half} -${half} ${svgSize} ${svgSize}`}
          fill="none"
        >
          <defs>
            <linearGradient id="trustWireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(52,211,153,0.5)" />
              <stop offset="100%" stopColor="rgba(34,211,238,0.5)" />
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

        {/* ── Floating evidence particles ──────────────────────────── */}
        {PARTICLES.map((p) => {
          const node = FRAMEWORK_NODES[p.nodeIndex];
          // Particle drifts between node position and center
          const startX = 300 + node.x; // offset to container coords (center = 300,250)
          const startY = 250 + node.y;
          const endX = 300;
          const endY = 250;
          return (
            <div
              key={`particle-${p.id}`}
              className="absolute rounded-full bg-white/30"
              style={{
                width: 3,
                height: 3,
                left: startX,
                top: startY,
                animation: sa
                  ? `trustParticleDrift-${p.id} ${p.speed}s linear infinite`
                  : 'none',
                animationDelay: `${p.delay}s`,
              }}
            />
          );
        })}

        {/* Particle keyframes injected via style tag */}
        <style>{PARTICLES.map((p) => {
          const node = FRAMEWORK_NODES[p.nodeIndex];
          const dx = -node.x;
          const dy = -node.y;
          return `
            @keyframes trustParticleDrift-${p.id} {
              0% { transform: translate(0px, 0px); opacity: 0; }
              10% { opacity: 0.6; }
              90% { opacity: 0.6; }
              100% { transform: translate(${dx}px, ${dy}px); opacity: 0; }
            }
          `;
        }).join('\n')}</style>

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
          {/* Pulsing glow ring */}
          <motion.div
            className="absolute rounded-full border border-emerald-500/40"
            style={{ width: 100, height: 100 }}
            animate={
              sa
                ? { scale: [1, 1.4, 1], opacity: [0.6, 0.15, 0.6] }
                : undefined
            }
            transition={
              sa
                ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                : undefined
            }
          />
          {/* Glass circle */}
          <div
            className="relative flex items-center justify-center rounded-full border border-emerald-500/40 backdrop-blur-xl bg-gradient-to-br from-white/[0.10] to-white/[0.03]"
            style={{ width: 100, height: 100 }}
          >
            <span className="text-xs font-bold text-emerald-300 tracking-wide select-none">
              FormaOS
            </span>
          </div>
        </motion.div>

        {/* ── Framework nodes ──────────────────────────────────────── */}
        {FRAMEWORK_NODES.map((node, i) => {
          const parallax = nodeParallax[i];
          return (
            <motion.div
              key={`node-${i}`}
              className="absolute flex items-center justify-center"
              style={{
                left: '50%',
                top: '50%',
                marginLeft: node.x - 40, // center 80px card
                marginTop: node.y - 18,  // center 36px card
                translateZ: node.z,
                ...(sa && isActive
                  ? { x: parallax.x, y: parallax.y }
                  : {}),
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
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/[0.10] backdrop-blur-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02]"
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
          );
        })}
      </motion.div>
    </div>
  );
}

export const TrustHeroVisual = memo(TrustHeroVisualInner);
export default TrustHeroVisual;
