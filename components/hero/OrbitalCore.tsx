'use client';

import { memo, useRef, useMemo } from 'react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';

/* ─────────────────────────────────────────────────────────────────
   RING DIMENSIONS
───────────────────────────────────────────────────────────────── */
const R1 = 400; // inner ring diameter
const R2 = 560; // mid ring diameter
const R3 = 720; // outer ring diameter

/* ─────────────────────────────────────────────────────────────────
   DUST DATA — fixed values avoid hydration mismatch (client-only)
───────────────────────────────────────────────────────────────── */
type Dust = {
  x: number; y: number; sz: number; op: number;
  col: string; dur: number; delay: number; dx: number; dy: number;
};
const DUST: Dust[] = [
  { x:  8, y: 12, sz:1, op:0.18, col:'rgba(45,212,191,.8)',   dur:28, delay:0,    dx:14,  dy:-22 },
  { x: 82, y: 18, sz:1, op:0.14, col:'rgba(139,92,246,.8)',   dur:34, delay:3.5,  dx:-18, dy:-30 },
  { x: 22, y: 72, sz:2, op:0.12, col:'rgba(6,182,212,.8)',    dur:26, delay:7,    dx:20,  dy:-18 },
  { x: 68, y: 65, sz:1, op:0.20, col:'rgba(45,212,191,.8)',   dur:38, delay:1.5,  dx:-12, dy:-28 },
  { x: 45, y:  8, sz:1, op:0.16, col:'rgba(255,255,255,.22)', dur:31, delay:9,    dx:8,   dy:-32 },
  { x: 90, y: 42, sz:1, op:0.13, col:'rgba(139,92,246,.8)',   dur:42, delay:4,    dx:-22, dy:-14 },
  { x: 12, y: 45, sz:2, op:0.10, col:'rgba(45,212,191,.8)',   dur:23, delay:12,   dx:16,  dy:-24 },
  { x: 55, y: 88, sz:1, op:0.22, col:'rgba(6,182,212,.8)',    dur:36, delay:2,    dx:-10, dy:-40 },
  { x: 33, y: 30, sz:1, op:0.15, col:'rgba(255,255,255,.18)', dur:29, delay:14,   dx:24,  dy:-18 },
  { x: 78, y: 80, sz:2, op:0.11, col:'rgba(139,92,246,.8)',   dur:40, delay:5.5,  dx:-16, dy:-26 },
  { x: 48, y: 55, sz:1, op:0.17, col:'rgba(45,212,191,.8)',   dur:25, delay:8,    dx:10,  dy:-34 },
  { x: 18, y: 90, sz:1, op:0.13, col:'rgba(6,182,212,.8)',    dur:33, delay:0.5,  dx:18,  dy:-20 },
  { x: 92, y: 15, sz:1, op:0.19, col:'rgba(139,92,246,.8)',   dur:27, delay:11,   dx:-20, dy:-38 },
  { x: 62, y: 35, sz:2, op:0.14, col:'rgba(255,255,255,.16)', dur:35, delay:6,    dx:12,  dy:-16 },
  { x:  5, y: 60, sz:1, op:0.20, col:'rgba(45,212,191,.8)',   dur:30, delay:10,   dx:22,  dy:-28 },
  { x: 72, y: 50, sz:1, op:0.12, col:'rgba(6,182,212,.8)',    dur:38, delay:3,    dx:-14, dy:-22 },
  { x: 38, y: 20, sz:1, op:0.16, col:'rgba(139,92,246,.8)',   dur:24, delay:13,   dx:16,  dy:-42 },
  { x: 85, y: 70, sz:2, op:0.10, col:'rgba(45,212,191,.8)',   dur:41, delay:7.5,  dx:-8,  dy:-18 },
  { x: 28, y: 48, sz:1, op:0.18, col:'rgba(255,255,255,.20)', dur:32, delay:1,    dx:20,  dy:-30 },
  { x: 58, y: 78, sz:1, op:0.14, col:'rgba(6,182,212,.8)',    dur:28, delay:15,   dx:-18, dy:-24 },
  { x: 15, y: 25, sz:2, op:0.11, col:'rgba(139,92,246,.8)',   dur:36, delay:4.5,  dx:14,  dy:-36 },
  { x: 75, y: 28, sz:1, op:0.21, col:'rgba(45,212,191,.8)',   dur:22, delay:9.5,  dx:-24, dy:-20 },
  { x: 42, y: 92, sz:1, op:0.15, col:'rgba(255,255,255,.14)', dur:39, delay:2.5,  dx:10,  dy:-46 },
  { x: 95, y: 55, sz:1, op:0.13, col:'rgba(6,182,212,.8)',    dur:31, delay:8.5,  dx:-12, dy:-26 },
  { x: 52, y: 15, sz:2, op:0.17, col:'rgba(139,92,246,.8)',   dur:26, delay:12.5, dx:18,  dy:-32 },
  { x: 25, y: 68, sz:1, op:0.12, col:'rgba(45,212,191,.8)',   dur:43, delay:6.5,  dx:-16, dy:-14 },
  { x: 88, y: 38, sz:1, op:0.19, col:'rgba(255,255,255,.18)', dur:29, delay:11.5, dx:-20, dy:-38 },
  { x: 35, y: 82, sz:1, op:0.14, col:'rgba(6,182,212,.8)',    dur:37, delay:0.8,  dx:22,  dy:-22 },
  { x: 65, y: 22, sz:2, op:0.16, col:'rgba(139,92,246,.8)',   dur:23, delay:14.5, dx:-10, dy:-40 },
  { x: 10, y: 40, sz:1, op:0.13, col:'rgba(45,212,191,.8)',   dur:34, delay:5,    dx:16,  dy:-28 },
  { x: 50, y: 62, sz:1, op:0.20, col:'rgba(255,255,255,.16)', dur:27, delay:9.8,  dx:-14, dy:-18 },
  { x: 80, y: 85, sz:1, op:0.11, col:'rgba(6,182,212,.8)',    dur:40, delay:3.2,  dx:-8,  dy:-34 },
  { x: 20, y: 10, sz:1, op:0.22, col:'rgba(139,92,246,.8)',   dur:32, delay:7.8,  dx:20,  dy:-30 },
  { x: 40, y: 42, sz:2, op:0.14, col:'rgba(45,212,191,.8)',   dur:38, delay:1.8,  dx:12,  dy:-22 },
  { x: 70, y: 58, sz:1, op:0.16, col:'rgba(255,255,255,.13)', dur:24, delay:13.5, dx:-18, dy:-36 },
  { x:  3, y: 78, sz:1, op:0.13, col:'rgba(6,182,212,.8)',    dur:41, delay:4.8,  dx:14,  dy:-20 },
  { x: 97, y: 32, sz:1, op:0.18, col:'rgba(139,92,246,.8)',   dur:30, delay:10.5, dx:-22, dy:-42 },
  { x: 30, y: 95, sz:2, op:0.10, col:'rgba(45,212,191,.8)',   dur:35, delay:2.2,  dx:16,  dy:-48 },
];

/* ─────────────────────────────────────────────────────────────────
   HELPER — radian conversion
───────────────────────────────────────────────────────────────── */
const rad = (deg: number) => (deg * Math.PI) / 180;

/* ─────────────────────────────────────────────────────────────────
   NODE — glow halo + solid dot, positioned on a ring at angle°
───────────────────────────────────────────────────────────────── */
function Node({
  angle, radius, color, dot, glow, glowOp, pDelay, on,
}: {
  angle: number; radius: number; color: string;
  dot: number; glow: number; glowOp: number; pDelay: number; on: boolean;
}) {
  const x = Math.cos(rad(angle)) * radius;
  const y = Math.sin(rad(angle)) * radius;
  return (
    <div style={{
      position: 'absolute',
      left: `calc(50% + ${x}px - ${dot / 2}px)`,
      top:  `calc(50% + ${y}px - ${dot / 2}px)`,
      width: dot, height: dot,
    }}>
      {/* glow halo */}
      <motion.div style={{
        position: 'absolute',
        left: '50%', top: '50%', translate: '-50% -50%',
        width: glow, height: glow, borderRadius: '50%',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${Math.round(glow / 3)}px)`,
      }}
        animate={on ? { opacity: [glowOp * 0.5, glowOp, glowOp * 0.5] } : { opacity: glowOp * 0.65 }}
        transition={on ? { duration: 9, repeat: Infinity, ease: 'easeInOut', delay: pDelay } : undefined}
      />
      {/* solid dot */}
      <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: color, opacity: 0.92 }} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   RING 1 — inner, solid border + conic arc highlight
───────────────────────────────────────────────────────────────── */
const R1_MASK = 'radial-gradient(circle at center, transparent 46%, black 47% 49.5%, transparent 50%)';
function Ring1({ on }: { on: boolean }) {
  return (
    <motion.div style={{
      position: 'absolute',
      width: R1, height: R1,
      top: '50%', left: '50%',
      x: -R1 / 2, y: -R1 / 2,
      rotateX: 75,
      willChange: 'transform',
    }}
      animate={on ? { rotateZ: 360 } : { rotateZ: 15 }}
      initial={{ rotateZ: 0 }}
      transition={on ? { duration: 22, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
    >
      <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(45,212,191,0.22)' }} />
      {/* conic arc highlight */}
      <div style={{
        position:'absolute', inset:0, borderRadius:'50%',
        background:'conic-gradient(from 20deg, rgba(45,212,191,0.62) 0deg 14deg, transparent 14deg 360deg)',
        WebkitMaskImage: R1_MASK, maskImage: R1_MASK,
      }} />
      {[0, 120, 240].map((a, i) => (
        <Node key={a} angle={a} radius={R1/2} color="rgba(45,212,191,0.9)" dot={7} glow={22} glowOp={0.65} pDelay={i*2.8} on={on} />
      ))}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   RING 2 — mid, segmented tick marks via conic-gradient masked to ring
───────────────────────────────────────────────────────────────── */
const R2_MASK = 'radial-gradient(circle at center, transparent 46.5%, black 47.5% 49.5%, transparent 50.5%)';
function Ring2({ on }: { on: boolean }) {
  const tickBg = useMemo(() => {
    const N = 12, tick = 5, step = 360 / N;
    const stops: string[] = [];
    for (let i = 0; i < N; i++) {
      const s = i * step, e = s + tick;
      stops.push(`rgba(139,92,246,0.20) ${s}deg ${e}deg`, `transparent ${e}deg ${s+step}deg`);
    }
    return `conic-gradient(from 0deg, ${stops.join(',')})`;
  }, []);

  return (
    <motion.div style={{
      position: 'absolute',
      width: R2, height: R2,
      top: '50%', left: '50%',
      x: -R2 / 2, y: -R2 / 2,
      rotateX: 65,
      willChange: 'transform',
    }}
      animate={on ? { rotateZ: -360 } : { rotateZ: -8 }}
      initial={{ rotateZ: 0 }}
      transition={on ? { duration: 32, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
    >
      <div style={{ position:'absolute', inset:0, borderRadius:'50%', background: tickBg, WebkitMaskImage:R2_MASK, maskImage:R2_MASK }} />
      <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(139,92,246,0.08)' }} />
      {[45, 135, 225, 315].map((a, i) => (
        <Node key={a} angle={a} radius={R2/2} color="rgba(139,92,246,0.9)" dot={6} glow={18} glowOp={0.55} pDelay={i*1.8+1.2} on={on} />
      ))}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   RING 3 — outer, thinnest, slowest
───────────────────────────────────────────────────────────────── */
const R3_MASK = 'radial-gradient(circle at center, transparent 47%, black 48% 49.5%, transparent 50%)';
function Ring3({ on }: { on: boolean }) {
  return (
    <motion.div style={{
      position: 'absolute',
      width: R3, height: R3,
      top: '50%', left: '50%',
      x: -R3 / 2, y: -R3 / 2,
      rotateX: 70,
      willChange: 'transform',
    }}
      animate={on ? { rotateZ: 360 } : { rotateZ: 25 }}
      initial={{ rotateZ: 0 }}
      transition={on ? { duration: 50, repeat: Infinity, ease: 'linear' } : { duration: 0 }}
    >
      <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(6,182,212,0.10)' }} />
      <div style={{
        position:'absolute', inset:0, borderRadius:'50%',
        background:'conic-gradient(from 150deg, rgba(6,182,212,0.24) 0deg 10deg, transparent 10deg 360deg)',
        WebkitMaskImage: R3_MASK, maskImage: R3_MASK,
      }} />
      {[60, 240].map((a, i) => (
        <Node key={a} angle={a} radius={R3/2} color="rgba(6,182,212,0.85)" dot={5} glow={16} glowOp={0.45} pDelay={i*3.5+2.5} on={on} />
      ))}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   DUST PARTICLES
───────────────────────────────────────────────────────────────── */
function DustField({ on, slim }: { on: boolean; slim: boolean }) {
  const list = slim ? DUST.slice(0, 18) : DUST;
  return (
    <div style={{ position:'absolute', inset:0, pointerEvents:'none', overflow:'hidden' }}>
      {list.map((p, i) => (
        <motion.div key={i} style={{
          position:'absolute',
          left: `${p.x}%`, top: `${p.y}%`,
          width: p.sz, height: p.sz,
          borderRadius: '50%',
          background: p.col,
        }}
          animate={on ? { x: p.dx, y: p.dy, opacity: [p.op, p.op*0.3, p.op] } : { opacity: p.op * 0.5 }}
          initial={{ x: 0, y: 0, opacity: p.op }}
          transition={on ? { duration: p.dur, delay: p.delay, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' } : undefined}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   ORBITAL CORE — main export
───────────────────────────────────────────────────────────────── */
export interface OrbitalCoreProps {
  /** Pass HeroSection's shouldAnimateIntro flag */
  shouldAnimate?: boolean;
  className?: string;
}

function OrbitalCoreInner({ shouldAnimate = true, className }: OrbitalCoreProps) {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const on = shouldAnimate && !prefersReduced;

  /* Scroll parallax — stage drifts up at ~0.2x hero scroll speed */
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ['start start', 'end start'] });
  const stageY    = useTransform(scrollYProgress, [0, 1], [0, -160]);
  const stageRotZ = useTransform(scrollYProgress, [0, 1], [0, 4]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none ${className ?? ''}`}
      style={{ zIndex: -1 }}
      aria-hidden
    >
      {/* ── Dust particles (full hero area, behind everything) ── */}
      <DustField on={on} slim={false} />

      {/* ── Text readability scrim ─────────────────────────── */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        width: 700, height: 360,
        transform: 'translate(-50%, -56%)',
        background: 'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(10,15,28,0.48) 0%, transparent 76%)',
        pointerEvents: 'none',
      }} />

      {/* ── Orbital stage ─────────────────────────────────────
          Mobile: scale down via Tailwind class on a wrapper.
          Framer Motion handles parallax + micro-drift.
      ─────────────────────────────────────────────────────── */}
      <div
        /* Mobile scale via CSS class defined in marketing.css */
        className="orbital-core-stage"
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: 900, height: 900,
          marginLeft: -450, marginTop: -450,
        }}
      >
        <motion.div
          style={{
            width: '100%', height: '100%',
            perspective: '1200px',
            isolation: 'isolate',
            willChange: 'transform',
            ...(prefersReduced ? {} : { y: stageY, rotateZ: stageRotZ }),
          }}
          animate={on ? {
            rotateY: [0, 1.2, -0.8, 1.5, -1.0, 0],
            rotateX: [0, 0.4, -0.3, 0.6, -0.4, 0],
          } : undefined}
          transition={on ? {
            duration: 20, repeat: Infinity, ease: 'easeInOut',
            times: [0, 0.2, 0.4, 0.6, 0.8, 1],
          } : undefined}
        >
          {/* ── Micro-grid field ─────────────────────── */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            WebkitMaskImage: 'radial-gradient(ellipse 62% 55% at 50% 50%, black 30%, transparent 74%)',
            maskImage: 'radial-gradient(ellipse 62% 55% at 50% 50%, black 30%, transparent 74%)',
            opacity: 0.05,
          }} />

          {/* ── Core halo pulse ──────────────────────── */}
          <motion.div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 820, height: 420,
            translate: '-50% -50%',
            background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(45,212,191,0.09) 0%, rgba(139,92,246,0.06) 42%, transparent 70%)',
            filter: 'blur(40px)',
          }}
            animate={on ? { opacity: [0.45, 1, 0.45] } : { opacity: 0.6 }}
            transition={on ? { duration: 8, repeat: Infinity, ease: 'easeInOut' } : undefined}
          />

          {/* ── Core glow orb ────────────────────────── */}
          <motion.div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 240, height: 240,
            translate: '-50% -50%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(45,212,191,0.78) 0%, rgba(56,189,248,0.44) 20%, rgba(139,92,246,0.28) 46%, rgba(139,92,246,0.07) 66%, transparent 82%)',
            filter: 'blur(8px)',
          }}
            animate={on ? { scale: [0.97, 1.04, 0.97], opacity: [0.82, 1, 0.82] } : { scale: 1, opacity: 0.9 }}
            transition={on ? { duration: 7, repeat: Infinity, ease: 'easeInOut' } : undefined}
          />

          {/* ── Core sheen (glass diagonal) ──────────── */}
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 120, height: 56,
            translate: '-50% -50%',
            borderRadius: '50%',
            background: 'linear-gradient(132deg, rgba(255,255,255,0.15) 0%, transparent 60%)',
            transform: 'translate(-50%, -50%) rotate(-28deg)',
          }} />

          {/* ── Rings (outer → inner so inner renders on top) ── */}
          <Ring3 on={on} />
          <Ring2 on={on} />
          <Ring1 on={on} />
        </motion.div>
      </div>
    </div>
  );
}

export const OrbitalCore = memo(OrbitalCoreInner);
