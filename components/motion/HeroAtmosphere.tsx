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

type GlowColor = 'cyan' | 'blue' | 'violet' | 'emerald' | 'rose' | 'amber';

interface HeroAtmosphereProps {
  /** Top glow accent (default: cyan) */
  topColor?: GlowColor;
  /** Bottom glow accent (default: blue) */
  bottomColor?: GlowColor;
  /** Dot grid accent color — set to null to hide grid (default: matches topColor) */
  gridColor?: GlowColor | null;
  /** Grid opacity 0–1 (default: 0.06) */
  gridOpacity?: number;
  /** Particle intensity (default: subtle) */
  particleIntensity?: 'subtle' | 'normal' | 'strong';
  className?: string;
}

const COLOR_MAP: Record<GlowColor, { glow: string; grid: string }> = {
  cyan:    { glow: 'rgba(34,211,238,',  grid: 'rgba(6,182,212,0.15)' },
  blue:    { glow: 'rgba(59,130,246,',  grid: 'rgba(59,130,246,0.15)' },
  violet:  { glow: 'rgba(139,92,246,',  grid: 'rgba(139,92,246,0.15)' },
  emerald: { glow: 'rgba(52,211,153,',  grid: 'rgba(16,185,129,0.15)' },
  rose:    { glow: 'rgba(251,113,133,', grid: 'rgba(244,63,94,0.15)' },
  amber:   { glow: 'rgba(251,191,36,',  grid: 'rgba(245,158,11,0.15)' },
};

function HeroAtmosphereInner({
  topColor = 'cyan',
  bottomColor = 'blue',
  gridColor,
  gridOpacity = 0.06,
  particleIntensity = 'subtle',
  className = '',
}: HeroAtmosphereProps) {
  const top = COLOR_MAP[topColor];
  const bottom = COLOR_MAP[bottomColor];
  const gc = gridColor === null ? null : COLOR_MAP[gridColor ?? topColor];
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = prefersReducedMotion ?? false;
  const [enableParallax, setEnableParallax] = useState(false);
  const mouseX = useSpring(0.5, { stiffness: 110, damping: 18 });
  const mouseY = useSpring(0.5, { stiffness: 110, damping: 18 });
  const farX = useTransform(mouseX, [0, 1], [-18, 18]);
  const farY = useTransform(mouseY, [0, 1], [-12, 12]);
  const nearX = useTransform(mouseX, [0, 1], [10, -10]);
  const nearY = useTransform(mouseY, [0, 1], [8, -8]);
  const gridX = useTransform(mouseX, [0, 1], [-4, 4]);
  const gridY = useTransform(mouseY, [0, 1], [-4, 4]);

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

      {/* Dot grid */}
      {gc && (
        <motion.div
          className="absolute inset-0"
          style={{
            ...(enableParallax && !reducedMotion ? { x: gridX, y: gridY } : {}),
            opacity: gridOpacity,
            backgroundImage: `radial-gradient(circle at 1px 1px, ${gc.grid} 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* Deferred ambient particles (unified engine) */}
      <AmbientParticleLayer intensity={particleIntensity} deferMode="idle" />
    </div>
  );
}

export const HeroAtmosphere = memo(HeroAtmosphereInner);
export default HeroAtmosphere;
