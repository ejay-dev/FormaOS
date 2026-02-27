'use client';

import { memo, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

/* ── Tuning ──────────────────────────────────────────────── */

/** Vertical pixel offset for the impact centre.
 *  0 = centred exactly on the Section 2 top edge.
 *  Negative = shift up into hero, positive = shift down. */
const IMPACT_Y_OFFSET = 0;

/**
 * Section2LaserImpact
 * ───────────────────
 * Shockwave / landing glow rendered at the top edge of Section 2.
 * translateY(-50%) makes it straddle the hero–section boundary.
 *
 * Layers:
 * 1. Wide diffused haze ring (purple)
 * 2. Bright horizontal energy line
 * 3. Secondary bloom (wider, softer, cyan-tinted)
 * 4. Downward fog dissolving into Section 2 content
 * 5. Upward fog blending into hero
 *
 * Same colour temperature as HomeHeroLaser (#8B5CF6 + #06B6D4).
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

  const full = isDesktop && !prefersReduced;

  return (
    <div
      className="absolute top-0 left-0 right-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      {/* Impact container — centred on the boundary line */}
      <div
        className="absolute left-1/2"
        style={{
          width: 'min(1400px, 140vw)',
          height: 'min(600px, 70vh)',
          transform: 'translateX(-50%) translateY(-50%)',
          top: IMPACT_Y_OFFSET,
        }}
      >
        {full ? (
          <>
            {/* 1. Haze ring */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 70% 45% at 50% 50%, rgba(139,92,246,0.22) 0%, rgba(139,92,246,0.08) 35%, transparent 65%)',
                filter: 'blur(18px)',
              }}
            />

            {/* 2. Bright energy line */}
            <div
              className="absolute left-[8%] right-[8%]"
              style={{
                top: '50%',
                height: '2px',
                transform: 'translateY(-50%)',
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.35) 10%, rgba(139,92,246,0.6) 35%, rgba(167,139,250,0.7) 50%, rgba(139,92,246,0.6) 65%, rgba(139,92,246,0.35) 90%, transparent 100%)',
                filter: 'blur(0.5px)',
              }}
            />

            {/* 3. Secondary bloom */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 90% 35% at 50% 50%, rgba(139,92,246,0.10) 0%, rgba(6,182,212,0.04) 40%, transparent 70%)',
                filter: 'blur(28px)',
              }}
            />

            {/* 4. Downward fog */}
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

            {/* 5. Upward fog */}
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
          /* Mobile / reduced-motion — lightweight CSS glow */
          <>
            <div
              className="absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse 60% 35% at 50% 50%, rgba(139,92,246,0.14) 0%, transparent 60%)',
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
