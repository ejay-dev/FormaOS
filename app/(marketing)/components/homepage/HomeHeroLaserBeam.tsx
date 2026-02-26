'use client';

import { memo, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { LaserFlow } from '@/components/motion/LaserFlow';

/* ── Tuning constants ── */

/** How far up (as % of hero) the bottom fade begins. Higher = fade starts earlier. */
const BEAM_BOTTOM_FADE_START = 0.72;

/** Noise overlay for SVG fractalNoise — breaks color banding */
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/* ── Static gradient fallback (mobile / reduced-motion) ── */
const FALLBACK_BG = `
  radial-gradient(ellipse 40% 60% at 50% 40%, rgba(139,92,246,0.20) 0%, transparent 70%),
  radial-gradient(ellipse 60% 45% at 50% 50%, rgba(6,182,212,0.08) 0%, transparent 65%),
  radial-gradient(ellipse 30% 35% at 50% 55%, rgba(139,92,246,0.14) 0%, transparent 50%)
`;

/* ── Mask: bright core, dissolves at edges, vertical reach preserved ── */
const BEAM_MASK =
  'radial-gradient(ellipse 75% 72% at 50% 42%, black 35%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.12) 72%, transparent 100%)';

/**
 * HomeHeroLaserBeam
 * ─────────────────
 * Full-bleed WebGL laser beam background for the homepage hero.
 * Beam ONLY — no impact / shockwave (that lives in Section2LaserImpact).
 *
 * Mounted once, never unmounts. LaserFlow pauses internally when off-screen.
 * No useInView, no dynamic keys, no state-driven re-mounts.
 */
function HomeHeroLaserBeamInner() {
  const prefersReduced = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const showWebGL = isDesktop && !prefersReduced;

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: -10 }}
      aria-hidden
    >
      {/* Oversized canvas — origin above viewport, extends past hero bottom */}
      <div
        className="absolute"
        style={{
          width: '160vw',
          height: '120vh',
          top: '-10vh',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <div
          className="w-full h-full"
          style={{
            WebkitMaskImage: BEAM_MASK,
            maskImage: BEAM_MASK,
          }}
        >
          {showWebGL ? (
            <LaserFlow
              color="#8B5CF6"
              horizontalBeamOffset={0.0}
              verticalBeamOffset={-0.08}
              flowSpeed={0.22}
              verticalSizing={3.4}
              horizontalSizing={1.0}
              fogIntensity={0.55}
              fogScale={0.3}
              wispDensity={0.8}
              wispSpeed={10}
              wispIntensity={6}
              flowStrength={0.25}
              decay={1.15}
              falloffStart={1.3}
              fogFallSpeed={0.45}
            />
          ) : (
            <div className="w-full h-full" style={{ background: FALLBACK_BG }} />
          )}
        </div>
      </div>

      {/* Noise overlay — breaks color banding */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: NOISE_SVG,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Text readability scrim */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 40%, rgba(10,10,20,0.05) 0%, rgba(10,10,20,0.55) 65%)',
        }}
      />

      {/* Bottom fade — beam appears to continue past hero edge into Section 2.
          BEAM_BOTTOM_FADE_START controls where the fade begins. */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: `${(1 - BEAM_BOTTOM_FADE_START) * 100}%`,
          background:
            'linear-gradient(to top, rgba(10,15,28,0.55) 0%, rgba(10,15,28,0.2) 50%, transparent 100%)',
        }}
      />
    </div>
  );
}

export const HomeHeroLaserBeam = memo(HomeHeroLaserBeamInner);
