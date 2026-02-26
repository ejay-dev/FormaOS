'use client';

import { memo } from 'react';
import { useReducedMotion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { LaserFlow } from '@/components/motion/LaserFlow';
import { useDeviceTier } from '@/lib/device-tier';

/**
 * SecurityHeroLaser
 * ─────────────────
 * Massive cinematic LaserFlow backdrop for the security hero.
 *
 * - Spans ~140vw × 90vh, centered behind headline/CTAs
 * - Masked with radial vignette so edges dissolve into dark bg
 * - Bottom gradient so it fades as page scrolls
 * - Pointer-events: none (fully behind content)
 * - Mobile low-tier / reduced-motion: static gradient fallback
 * - useInView gating: unmounts WebGL when hero leaves viewport
 */
function SecurityHeroLaserInner() {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const tierConfig = useDeviceTier();
  const isInView = useInView(ref, { once: false, margin: '100px' });

  const useFallback = prefersReduced || tierConfig.tier === 'low';

  return (
    <div
      ref={ref}
      className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
      aria-hidden
    >
      {/* Oversized laser container — bleeds beyond viewport edges */}
      <div
        className="absolute"
        style={{
          width: '140vw',
          height: '90vh',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        {/* Radial mask: bright center, fades to transparent at edges */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            WebkitMaskImage: 'radial-gradient(ellipse 70% 65% at 50% 48%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.15) 70%, transparent 90%)',
            maskImage: 'radial-gradient(ellipse 70% 65% at 50% 48%, rgba(0,0,0,1) 20%, rgba(0,0,0,0.6) 45%, rgba(0,0,0,0.15) 70%, transparent 90%)',
          }}
        >
          {useFallback ? (
            /* Static gradient fallback */
            <div
              className="w-full h-full"
              style={{
                background: `
                  radial-gradient(ellipse 60% 50% at 50% 50%, rgba(139,92,246,0.12) 0%, transparent 60%),
                  radial-gradient(ellipse 80% 70% at 50% 45%, rgba(6,182,212,0.06) 0%, transparent 65%)
                `,
              }}
            />
          ) : isInView ? (
            <LaserFlow
              color="#8B5CF6"
              horizontalBeamOffset={0.0}
              verticalBeamOffset={-0.08}
              flowSpeed={0.2}
              verticalSizing={2.5}
              horizontalSizing={1.0}
              fogIntensity={0.5}
              fogScale={0.3}
              wispDensity={0.7}
              wispSpeed={10}
              wispIntensity={5}
              flowStrength={0.25}
              decay={1.1}
              falloffStart={1.2}
              fogFallSpeed={0.45}
            />
          ) : null}
        </div>
      </div>

      {/* Bottom vignette: ensures laser dissolves before content below */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[30%] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(3,7,18,1) 0%, rgba(3,7,18,0.8) 40%, transparent 100%)',
        }}
      />

      {/* Top subtle vignette */}
      <div
        className="absolute top-0 left-0 right-0 h-[15%] pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(3,7,18,0.6) 0%, transparent 100%)',
        }}
      />
    </div>
  );
}

export const SecurityHeroLaser = memo(SecurityHeroLaserInner);
