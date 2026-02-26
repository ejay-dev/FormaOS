'use client';

import { memo, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/* ── Tuning constants ── */

/** Vertical offset (px) for the impact center relative to Section 2 top edge.
 *  Negative = above boundary, positive = below. 0 = centered on boundary. */
const IMPACT_Y_OFFSET = 0;

/**
 * Section2LaserImpact
 * ───────────────────
 * Laser impact shockwave rendered at the top edge of Section 2.
 * Sits half above / half below the hero–section boundary.
 *
 * Composition:
 * 1. Large haze ring (diffused purple glow)
 * 2. Bright horizontal energy line
 * 3. Wide secondary bloom (softer, cyan-tinted)
 * 4. Fog / smoke gradient beneath
 *
 * Same color temperature as the beam (#8B5CF6 purple + #06B6D4 cyan accent).
 *
 * Desktop: full effect. Mobile / reduced-motion: lighter CSS-only version.
 */
function Section2LaserImpactInner() {
  const prefersReduced = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const fullEffect = isDesktop && !prefersReduced;

  return (
    <div
      className="absolute top-0 left-0 right-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      {/* Impact container — centered on boundary, half above / half below */}
      <div
        className="absolute left-1/2"
        style={{
          width: 'min(1400px, 140vw)',
          height: 'min(600px, 70vh)',
          transform: `translateX(-50%) translateY(-50%)`,
          top: IMPACT_Y_OFFSET,
        }}
      >
        {fullEffect ? (
          <>
            {/* 1. Large haze ring — primary impact glow */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0.08) 35%, transparent 65%)',
                filter: 'blur(18px)',
              }}
            />

            {/* 2. Bright horizontal energy line — the "crack" */}
            <div
              className="absolute left-[10%] right-[10%]"
              style={{
                top: '50%',
                height: '2px',
                transform: 'translateY(-50%)',
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.35) 10%, rgba(139,92,246,0.6) 35%, rgba(167,139,250,0.7) 50%, rgba(139,92,246,0.6) 65%, rgba(139,92,246,0.35) 90%, transparent 100%)',
                filter: 'blur(0.5px)',
              }}
            />

            {/* 3. Secondary bloom — wider, softer, slight cyan tint */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 90% 40% at 50% 50%, rgba(139,92,246,0.10) 0%, rgba(6,182,212,0.04) 40%, transparent 70%)',
                filter: 'blur(28px)',
              }}
            />

            {/* 4. Downward fog / smoke — dissolves into section content area */}
            <div
              className="absolute left-0 right-0"
              style={{
                top: '50%',
                height: '50%',
                background:
                  'linear-gradient(to bottom, rgba(139,92,246,0.08) 0%, rgba(139,92,246,0.03) 30%, transparent 100%)',
                filter: 'blur(12px)',
              }}
            />

            {/* 5. Upward fog — dissolves into hero area above */}
            <div
              className="absolute left-0 right-0"
              style={{
                bottom: '50%',
                height: '50%',
                background:
                  'linear-gradient(to top, rgba(139,92,246,0.06) 0%, rgba(139,92,246,0.02) 30%, transparent 100%)',
                filter: 'blur(12px)',
              }}
            />
          </>
        ) : (
          /* Mobile / reduced-motion: lightweight CSS glow */
          <>
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(139,92,246,0.14) 0%, transparent 60%)',
              }}
            />
            <div
              className="absolute left-[15%] right-[15%]"
              style={{
                top: '50%',
                height: '1px',
                transform: 'translateY(-50%)',
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.25) 20%, rgba(139,92,246,0.4) 50%, rgba(139,92,246,0.25) 80%, transparent 100%)',
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}

export const Section2LaserImpact = memo(Section2LaserImpactInner);
