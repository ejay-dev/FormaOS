'use client';

import { memo } from 'react';
import { AmbientParticleLayer } from './AmbientParticleLayer';

/**
 * HeroAtmosphere
 * ──────────────
 * Shared hero background for all marketing pages (except Home).
 * Matches the /trust page aesthetic: static radial gradient blooms + subtle CSS snowfall.
 *
 * Performance:
 *  - Static CSS gradients (no JS animation, no blur-3xl on animated elements)
 *  - AmbientParticleLayer is CSS-only with requestIdleCallback deferral
 *  - Zero layout shift, zero blocking JS
 *  - Respects prefers-reduced-motion via AmbientParticleLayer
 *
 * Usage:
 *   <section className="relative ...">
 *     <HeroAtmosphere />
 *     <div className="relative z-10">...content...</div>
 *   </section>
 */

type GlowColor = 'cyan' | 'blue' | 'violet' | 'emerald' | 'rose';

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

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`} aria-hidden>
      {/* Static radial gradient blooms — paint-once, zero animation cost */}
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at 30% 15%, ${top.glow}0.18), transparent 50%)` }}
      />
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(circle at 70% 85%, ${bottom.glow}0.14), transparent 45%)` }}
      />

      {/* Dot grid */}
      {gc && (
        <div
          className="absolute inset-0"
          style={{
            opacity: gridOpacity,
            backgroundImage: `radial-gradient(circle at 1px 1px, ${gc.grid} 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* CSS snowfall particles — deferred via requestIdleCallback */}
      <AmbientParticleLayer intensity={particleIntensity} deferMode="idle" />
    </div>
  );
}

export const HeroAtmosphere = memo(HeroAtmosphereInner);
export default HeroAtmosphere;
