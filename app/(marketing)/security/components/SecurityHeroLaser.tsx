'use client';

import { memo, useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { LaserFlow } from '@/components/motion/LaserFlow';

/**
 * SecurityHeroLaser
 * ─────────────────
 * Massive cinematic LaserFlow that sits BEHIND the hero section.
 *
 * Must be rendered as a SIBLING to ImmersiveHero (not inside it)
 * because ImmersiveHero has overflow-hidden which clips oversized content.
 *
 * Visual composition:
 * - ~160vw × 110vh canvas, centered, beam offset upward for hero alignment
 * - Radial mask dissolves edges naturally
 * - Bottom vignette blends into page
 * - Text scrim: subtle dark gradient behind hero text area for readability
 * - Noise overlay: breaks WebGL color banding
 *
 * Performance:
 * - Desktop only: matchMedia("(hover:hover) and (pointer:fine)")
 * - Mobile: rich static gradient fallback (always visible)
 * - Reduced motion: static gradient fallback
 * - Always mounted (no unmount flicker), pauses via internal IO
 * - Scroll parallax at 0.15x speed (transform only, no layout)
 */
function SecurityHeroLaserInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);

  // Desktop-only check — WebGL only on devices with hover + fine pointer
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Scroll parallax — laser drifts slower than content
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const laserY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const showWebGL = isDesktop && !prefersReduced;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      {/* Parallax wrapper — moves at ~0.15x scroll speed */}
      <motion.div
        className="absolute inset-0"
        style={prefersReduced ? undefined : { y: laserY }}
      >
        {/* Oversized canvas — bleeds past viewport edges */}
        <div
          className="absolute"
          style={{
            width: '160vw',
            height: '110vh',
            top: '-5vh',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          {/* Radial mask: bright center, dissolves at edges */}
          <div
            className="w-full h-full"
            style={{
              WebkitMaskImage: 'radial-gradient(ellipse 65% 58% at 50% 48%, black 10%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.2) 55%, transparent 75%)',
              maskImage: 'radial-gradient(ellipse 65% 58% at 50% 48%, black 10%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.2) 55%, transparent 75%)',
            }}
          >
            {showWebGL ? (
              <LaserFlow
                color="#8B5CF6"
                horizontalBeamOffset={0.0}
                verticalBeamOffset={-0.05}
                flowSpeed={0.22}
                verticalSizing={3.0}
                horizontalSizing={1.2}
                fogIntensity={0.65}
                fogScale={0.32}
                wispDensity={0.9}
                wispSpeed={12}
                wispIntensity={8}
                flowStrength={0.3}
                decay={1.15}
                falloffStart={1.3}
                fogFallSpeed={0.5}
              />
            ) : (
              /* Static gradient fallback — visible on mobile + reduced motion */
              <div
                className="w-full h-full"
                style={{
                  background: `
                    radial-gradient(ellipse 50% 40% at 50% 48%, rgba(139,92,246,0.2) 0%, transparent 70%),
                    radial-gradient(ellipse 70% 55% at 50% 45%, rgba(6,182,212,0.1) 0%, transparent 65%),
                    radial-gradient(ellipse 35% 25% at 50% 50%, rgba(139,92,246,0.15) 0%, transparent 50%)
                  `,
                }}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* Text scrim — subtle darkening behind hero text for readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 55% 40% at 50% 45%, rgba(3,7,18,0.35) 0%, transparent 70%)
          `,
        }}
      />

      {/* Noise overlay — breaks color banding from WebGL gradients */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
          mixBlendMode: 'overlay',
        }}
      />

      {/* Bottom vignette — dissolves laser into page content below */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[35%] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(3,7,18,1) 0%, rgba(3,7,18,0.7) 50%, transparent 100%)',
        }}
      />
    </div>
  );
}

export const SecurityHeroLaser = memo(SecurityHeroLaserInner);
