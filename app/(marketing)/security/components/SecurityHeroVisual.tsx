'use client';

import { memo } from 'react';
import { motion, useReducedMotion, useTransform } from 'framer-motion';
import { useCursorPosition } from '@/components/motion/CursorContext';

// ─── Constants ───

const VAULT_SIZE = 380;
const SHIELD_W = 120;
const SHIELD_H = 140;

const RINGS = [
  { radius: 200, color: 'rgba(6,182,212,0.3)', speed: 12, z: -20, parallax: 0.5 },
  { radius: 260, color: 'rgba(59,130,246,0.25)', speed: 18, z: -40, parallax: 0.7 },
  { radius: 320, color: 'rgba(139,92,246,0.2)', speed: 25, z: -60, parallax: 1.0 },
] as const;

/** 8 constellation nodes positioned around the vault */
const CONSTELLATION_NODES = [
  { x: 60, y: 40, size: 10 },
  { x: 420, y: 70, size: 8 },
  { x: 470, y: 250, size: 12 },
  { x: 440, y: 410, size: 9 },
  { x: 80, y: 440, size: 10 },
  { x: 30, y: 220, size: 8 },
  { x: 250, y: 20, size: 11 },
  { x: 280, y: 470, size: 9 },
] as const;

/** Lines connecting constellation nodes to vault center (250, 250) */
const CONSTELLATION_LINES = CONSTELLATION_NODES.map((n) => ({
  x1: n.x,
  y1: n.y,
  x2: 250,
  y2: 250,
}));

// ─── Component ───

function SecurityHeroVisualInner() {
  const shouldReduceMotion = useReducedMotion();
  const animate = !shouldReduceMotion;
  const { mouseX, mouseY } = useCursorPosition();

  // Vault door cursor reactivity: +-5 degrees
  const vaultRotateX = useTransform(mouseY, [0, 1], [5, -5]);
  const vaultRotateY = useTransform(mouseX, [0, 1], [-5, 5]);

  // Per-ring parallax offsets (additional rotation from cursor)
  const ringOffsets = RINGS.map((ring) => ({
    // eslint-disable-next-line react-hooks/rules-of-hooks
    rotateX: useTransform(mouseY, [0, 1], [8 * ring.parallax, -8 * ring.parallax]),
    // eslint-disable-next-line react-hooks/rules-of-hooks
    rotateY: useTransform(mouseX, [0, 1], [-8 * ring.parallax, 8 * ring.parallax]),
  }));

  return (
    <div className="hidden lg:flex items-center justify-center pointer-events-none">
      {/* 500x500 container with 3D perspective */}
      <div
        className="relative w-[500px] h-[500px]"
        style={{ perspective: '1200px' }}
      >
        {/* ── Constellation lines (behind everything) ── */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 500 500"
          fill="none"
        >
          {CONSTELLATION_LINES.map((line, i) => (
            <motion.line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
              initial={animate ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={animate ? { duration: 0.6, delay: 1.2 + i * 0.08 } : { duration: 0 }}
            />
          ))}
        </svg>

        {/* ── Constellation nodes ── */}
        {CONSTELLATION_NODES.map((node, i) => (
          <motion.div
            key={`node-${i}`}
            className="absolute rounded-full bg-cyan-400/40"
            style={{
              width: node.size,
              height: node.size,
              left: node.x - node.size / 2,
              top: node.y - node.size / 2,
              boxShadow: '0 0 6px rgba(6,182,212,0.3)',
            }}
            initial={animate ? { opacity: 0, scale: 0 } : false}
            animate={
              animate
                ? { opacity: [0.3, 0.7, 0.3], scale: 1 }
                : { opacity: 0.5, scale: 1 }
            }
            transition={
              animate
                ? {
                    opacity: {
                      duration: 2.5 + i * 0.4,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 1.4 + i * 0.1,
                    },
                    scale: { duration: 0.4, delay: 1.2 + i * 0.08 },
                  }
                : { duration: 0 }
            }
          />
        ))}

        {/* ── 3 orbiting chain rings ── */}
        {RINGS.map((ring, i) => (
          <motion.div
            key={`ring-${i}`}
            className="absolute rounded-full"
            style={{
              width: ring.radius * 2,
              height: ring.radius * 2,
              left: `calc(50% - ${ring.radius}px)`,
              top: `calc(50% - ${ring.radius}px)`,
              border: `2px solid ${ring.color}`,
              transformStyle: 'preserve-3d',
              rotateX: animate ? ringOffsets[i].rotateX : 0,
              rotateY: animate ? ringOffsets[i].rotateY : 0,
              translateZ: ring.z,
            }}
            initial={animate ? { opacity: 0, scale: 0.7 } : false}
            animate={
              animate
                ? { opacity: 1, scale: 1, rotate: 360 }
                : { opacity: 1, scale: 1 }
            }
            transition={
              animate
                ? {
                    opacity: { duration: 0.6, delay: 0.6 + i * 0.3 },
                    scale: { duration: 0.8, delay: 0.6 + i * 0.3, ease: [0.22, 1, 0.36, 1] },
                    rotate: {
                      duration: ring.speed,
                      repeat: Infinity,
                      ease: 'linear',
                    },
                  }
                : { duration: 0 }
            }
          />
        ))}

        {/* ── Vault door ── */}
        <motion.div
          className="absolute rounded-3xl bg-gradient-to-b from-slate-500/40 via-slate-600/50 to-slate-700/40 backdrop-blur-sm"
          style={{
            width: VAULT_SIZE,
            height: VAULT_SIZE,
            left: `calc(50% - ${VAULT_SIZE / 2}px)`,
            top: `calc(50% - ${VAULT_SIZE / 2}px)`,
            boxShadow: [
              'inset 0 2px 0 rgba(255,255,255,0.12)',
              'inset 0 -2px 0 rgba(0,0,0,0.3)',
              'inset 2px 0 0 rgba(255,255,255,0.06)',
              'inset -2px 0 0 rgba(0,0,0,0.15)',
              '0 0 80px rgba(6,182,212,0.08)',
              '0 25px 60px rgba(0,0,0,0.5)',
              '0 8px 20px rgba(0,0,0,0.4)',
            ].join(', '),
            border: '1px solid rgba(255,255,255,0.08)',
            transformStyle: 'preserve-3d',
            rotateX: animate ? vaultRotateX : 0,
            rotateY: animate ? vaultRotateY : 0,
          }}
          initial={animate ? { opacity: 0, scale: 0.85, filter: 'blur(12px)' } : false}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={
            animate
              ? { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
              : { duration: 0 }
          }
        >
          {/* Metallic bevel ring on vault face */}
          <div
            className="absolute inset-6 rounded-2xl"
            style={{
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow:
                'inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.2)',
            }}
          />

          {/* Inner recessed panel */}
          <div
            className="absolute inset-12 rounded-xl bg-slate-800/30"
            style={{
              boxShadow:
                'inset 0 2px 8px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(255,255,255,0.04)',
            }}
          />

          {/* Shield SVG with path animation */}
          <motion.svg
            viewBox="0 0 120 140"
            className="absolute"
            style={{
              width: SHIELD_W,
              height: SHIELD_H,
              left: `calc(50% - ${SHIELD_W / 2}px)`,
              top: `calc(50% - ${SHIELD_H / 2}px)`,
              filter: 'drop-shadow(0 0 20px rgba(6,182,212,0.4)) drop-shadow(0 0 40px rgba(6,182,212,0.15))',
            }}
            initial={animate ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={animate ? { duration: 0.6, delay: 0.4 } : { duration: 0 }}
          >
            {/* Shield outline — pathLength animation */}
            <motion.path
              d="M60 8 L108 34 L108 76 Q108 118 60 138 Q12 118 12 76 L12 34 Z"
              fill="none"
              stroke="rgba(6,182,212,0.6)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              initial={animate ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={
                animate
                  ? { duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }
                  : { duration: 0 }
              }
            />
            {/* Shield inner glow fill */}
            <path
              d="M60 16 L100 38 L100 74 Q100 112 60 130 Q20 112 20 74 L20 38 Z"
              fill="rgba(6,182,212,0.05)"
            />
            {/* Lock body */}
            <motion.rect
              x="45"
              y="64"
              width="30"
              height="24"
              rx="4"
              fill="none"
              stroke="rgba(6,182,212,0.6)"
              strokeWidth="2"
              initial={animate ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={
                animate
                  ? { duration: 1.2, delay: 0.7, ease: [0.22, 1, 0.36, 1] }
                  : { duration: 0 }
              }
            />
            {/* Lock shackle */}
            <motion.path
              d="M50 64 V56 Q50 44 60 44 Q70 44 70 56 V64"
              fill="none"
              stroke="rgba(6,182,212,0.6)"
              strokeWidth="2"
              strokeLinecap="round"
              initial={animate ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={
                animate
                  ? { duration: 1.2, delay: 0.6, ease: [0.22, 1, 0.36, 1] }
                  : { duration: 0 }
              }
            />
            {/* Keyhole */}
            <motion.g
              initial={animate ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={animate ? { duration: 0.5, delay: 1.4 } : { duration: 0 }}
            >
              <circle cx="60" cy="74" r="3.5" fill="rgba(6,182,212,0.7)" />
              <rect x="58.5" y="76" width="3" height="6" rx="1" fill="rgba(6,182,212,0.7)" />
            </motion.g>
          </motion.svg>

          {/* Subtle pulsing core glow behind shield */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: 160,
              height: 160,
              left: 'calc(50% - 80px)',
              top: 'calc(50% - 80px)',
              background:
                'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)',
            }}
            animate={
              animate
                ? { scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }
                : undefined
            }
            transition={
              animate
                ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                : undefined
            }
          />
        </motion.div>
      </div>
    </div>
  );
}

export const SecurityHeroVisual = memo(SecurityHeroVisualInner);
export default SecurityHeroVisual;
