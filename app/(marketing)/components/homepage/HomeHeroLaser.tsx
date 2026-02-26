'use client';

import { memo, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { LaserFlow } from '@/components/motion/LaserFlow';

/**
 * HomeHeroLaser
 * ─────────────
 * Cinematic LaserFlow background for the homepage hero.
 * Mounted once, never unmounts — LaserFlow pauses internally when off-screen.
 *
 * Performance:
 * - Desktop: full WebGL beam (lower intensity than product page)
 * - Mobile: static gradient fallback
 * - Reduced motion: static fallback
 */

function HomeHeroLaserInner() {
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
      style={{ zIndex: -1 }}
      aria-hidden
    >
      {/* Oversized canvas — bleeds past viewport edges, extends to hero bottom */}
      <div
        className="absolute"
        style={{
          width: '140vw',
          height: '120vh',
          top: '-10vh',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        {/* Radial mask: bright center, dissolves at horizontal edges,
            keeps vertical reach so beam "lands" at hero bottom */}
        <div
          className="w-full h-full"
          style={{
            WebkitMaskImage:
              'radial-gradient(ellipse 75% 70% at 50% 45%, black 40%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.15) 75%, transparent 100%)',
            maskImage:
              'radial-gradient(ellipse 75% 70% at 50% 45%, black 40%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.15) 75%, transparent 100%)',
          }}
        >
          {showWebGL ? (
            <LaserFlow
              color="#8B5CF6"
              horizontalBeamOffset={0.0}
              verticalBeamOffset={-0.1}
              flowSpeed={0.22}
              verticalSizing={3.2}
              horizontalSizing={0.9}
              fogIntensity={0.55}
              fogScale={0.3}
              wispDensity={0.75}
              wispSpeed={10}
              wispIntensity={6}
              flowStrength={0.25}
              decay={1.15}
              falloffStart={1.3}
              fogFallSpeed={0.45}
            />
          ) : (
            /* Static gradient fallback — mobile + reduced motion */
            <div
              className="w-full h-full"
              style={{
                background: `
                  radial-gradient(ellipse 40% 55% at 50% 45%, rgba(139,92,246,0.18) 0%, transparent 70%),
                  radial-gradient(ellipse 60% 45% at 50% 50%, rgba(6,182,212,0.08) 0%, transparent 65%),
                  radial-gradient(ellipse 30% 30% at 50% 48%, rgba(139,92,246,0.12) 0%, transparent 50%)
                `,
              }}
            />
          )}
        </div>
      </div>

      {/* Noise overlay — breaks color banding */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Text readability scrim — subtle dark overlay so headline stays crisp */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at center, rgba(10,10,20,0.1) 0%, rgba(10,10,20,0.6) 70%)',
        }}
      />

      {/* Bottom vignette — soft fade so beam glow reaches hero edge
          (the hard cutoff + impact shockwave lives in Section 2) */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[25%] pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(10,15,28,0.7) 0%, rgba(10,15,28,0.3) 40%, transparent 100%)',
        }}
      />
    </div>
  );
}

export const HomeHeroLaser = memo(HomeHeroLaserInner);
