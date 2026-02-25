'use client';

import { memo, useEffect, useState } from 'react';
import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { AmbientParticleLayer } from './AmbientParticleLayer';

/**
 * HeroAtmosphere
 * ──────────────
 * Shared hero background for all marketing pages (except Home).
 * Includes cursor-linked parallax depth on desktop for premium hero movement.
 *
 * Performance:
 *  - Static gradient foundation with lightweight transform-only parallax
 *  - AmbientParticleLayer defers rendering and uses unified particle engine
 *  - Zero layout shift, zero blocking JS
 *  - Respects prefers-reduced-motion via AmbientParticleLayer
 *
 * Usage:
 *   <section className="relative ...">
 *     <HeroAtmosphere />
 *     <div className="relative z-10">...content...</div>
 *   </section>
 */

type GlowColor = 'cyan' | 'teal' | 'blue' | 'violet' | 'emerald' | 'rose' | 'amber';

interface HeroAtmosphereProps {
  /** Top glow accent (default: cyan) */
  topColor?: GlowColor;
  /** Bottom glow accent (default: blue) */
  bottomColor?: GlowColor;
  /** @deprecated Dot grid removed — parameter kept for backward compat, ignored. */
  gridColor?: GlowColor | null;
  /** @deprecated Grid removed — parameter kept for backward compat, ignored. */
  gridOpacity?: number;
  /** Particle intensity (default: subtle) */
  particleIntensity?: 'subtle' | 'normal' | 'strong';
  className?: string;
}

const COLOR_MAP: Record<GlowColor, { glow: string; grid: string; rgb: string }> = {
  cyan:    { glow: 'rgba(34,211,238,',  grid: 'rgba(6,182,212,0.15)',   rgb: '34,211,238' },
  teal:    { glow: 'rgba(45,212,191,',  grid: 'rgba(20,184,166,0.15)',  rgb: '45,212,191' },
  blue:    { glow: 'rgba(59,130,246,',  grid: 'rgba(59,130,246,0.15)',  rgb: '59,130,246' },
  violet:  { glow: 'rgba(139,92,246,',  grid: 'rgba(139,92,246,0.15)', rgb: '139,92,246' },
  emerald: { glow: 'rgba(52,211,153,',  grid: 'rgba(16,185,129,0.15)', rgb: '52,211,153' },
  rose:    { glow: 'rgba(251,113,133,', grid: 'rgba(244,63,94,0.15)',  rgb: '251,113,133' },
  amber:   { glow: 'rgba(251,191,36,',  grid: 'rgba(245,158,11,0.15)', rgb: '251,191,36' },
};

function HeroAtmosphereInner({
  topColor = 'cyan',
  bottomColor = 'blue',
  // gridColor/gridOpacity kept for backward compat but no longer rendered
  particleIntensity = 'subtle',
  className = '',
}: HeroAtmosphereProps) {
  const top = COLOR_MAP[topColor];
  const bottom = COLOR_MAP[bottomColor];
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion ?? false;
  const [enableParallax, setEnableParallax] = useState(false);
  const mouseX = useSpring(0.5, { stiffness: 110, damping: 18 });
  const mouseY = useSpring(0.5, { stiffness: 110, damping: 18 });
  const farX = useTransform(mouseX, [0, 1], [-18, 18]);
  const farY = useTransform(mouseY, [0, 1], [-12, 12]);
  const nearX = useTransform(mouseX, [0, 1], [10, -10]);
  const nearY = useTransform(mouseY, [0, 1], [8, -8]);

  useEffect(() => {
    if (reducedMotion) return;

    const updateViewportGate = () => setEnableParallax(window.innerWidth >= 1024);
    updateViewportGate();
    window.addEventListener('resize', updateViewportGate);

    const onPointerMove = (event: PointerEvent) => {
      mouseX.set(event.clientX / window.innerWidth);
      mouseY.set(event.clientY / window.innerHeight);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    return () => {
      window.removeEventListener('resize', updateViewportGate);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [mouseX, mouseY, reducedMotion]);

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
      {/* Static radial gradient blooms — paint-once, zero animation cost */}
      <motion.div
        className="absolute inset-0"
        style={{
          ...(enableParallax && !reducedMotion ? { x: farX, y: farY } : {}),
          background: `radial-gradient(circle at 30% 15%, ${top.glow}0.18), transparent 50%)`,
        }}
      />
      <motion.div
        className="absolute inset-0"
        style={{
          ...(enableParallax && !reducedMotion ? { x: nearX, y: nearY } : {}),
          background: `radial-gradient(circle at 70% 85%, ${bottom.glow}0.14), transparent 45%)`,
        }}
      />

      {/* Subtle noise grain for depth */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* Bottom vignette fade */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent 60%, rgba(10,15,28,0.6) 100%)',
        }}
      />

      {/* Deferred ambient particles (unified engine) — themed to page colors */}
      <AmbientParticleLayer
        intensity={particleIntensity}
        deferMode="idle"
        color={top.rgb}
        secondaryColor={bottom.rgb}
      />
    </div>
  );
}

export const HeroAtmosphere = memo(HeroAtmosphereInner);
export default HeroAtmosphere;
