'use client';

import { memo, useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { LaserFlow } from '@/components/motion/LaserFlow';

/* ── Tuning ────────────────────────────────────────────────
 *  Adjust these to fine-tune the beam position without
 *  hunting through nested CSS.
 * ──────────────────────────────────────────────────────── */

/** Beam vertical offset fed to LaserFlow — negative shifts the bright
 *  center downward so it "lands" near the hero bottom edge. */
const BEAM_VERTICAL_OFFSET = -0.12;

/** How far up (0–1 fraction of hero height) the bottom vignette starts.
 *  Lower = softer fade, more beam visible at bottom. */
const BEAM_BOTTOM_FADE_START = 0.75;

/** Noise SVG — breaks colour banding on smooth gradients. */
const NOISE_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`;

/** Static gradient fallback — mobile + reduced-motion. */
const FALLBACK_BG = `
  radial-gradient(ellipse 40% 60% at 50% 40%, rgba(139,92,246,0.20) 0%, transparent 70%),
  radial-gradient(ellipse 60% 45% at 50% 50%, rgba(6,182,212,0.08) 0%, transparent 65%),
  radial-gradient(ellipse 30% 35% at 50% 55%, rgba(139,92,246,0.14) 0%, transparent 50%)
`;

/**
 * HomeHeroLaser
 * ─────────────
 * Cinematic LaserFlow background for the homepage hero section.
 * The beam fills the hero and its bright centre is aimed at the
 * hero's bottom edge so it visually "lands" at the Section 2 boundary.
 *
 * The actual shockwave / impact glow lives in Section2LaserImpact
 * and is rendered inside FrameworkTrustStrip's wrapper.
 *
 * Anti-flicker:
 * - Mounted once, never unmounts (LaserFlow pauses internally via IO)
 * - No useInView, no dynamic keys, no state-driven re-mounts
 * - Props in refs (inside LaserFlow) — never triggers re-init
 * - Memoised outer shell
 */
function HomeHeroLaserInner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);

  // Desktop-only WebGL
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Scroll parallax — beam drifts slightly slower than scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const laserY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const showWebGL = isDesktop && !prefersReduced;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: -10 }}
      aria-hidden
    >
      {/* Parallax wrapper */}
      <motion.div
        className="absolute inset-0"
        style={prefersReduced ? undefined : { y: laserY }}
      >
        {/* Oversized canvas — bleeds past viewport edges */}
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
          {/* Radial mask — bright core, dissolves at edges, vertical
              reach preserved so beam extends to hero bottom. */}
          <div
            className="w-full h-full"
            style={{
              WebkitMaskImage:
                'radial-gradient(ellipse 65% 65% at 50% 42%, black 15%, rgba(0,0,0,0.65) 35%, rgba(0,0,0,0.15) 60%, transparent 78%)',
              maskImage:
                'radial-gradient(ellipse 65% 65% at 50% 42%, black 15%, rgba(0,0,0,0.65) 35%, rgba(0,0,0,0.15) 60%, transparent 78%)',
            }}
          >
            {showWebGL ? (
              <LaserFlow
                color="#8B5CF6"
                horizontalBeamOffset={0.0}
                verticalBeamOffset={BEAM_VERTICAL_OFFSET}
                flowSpeed={0.22}
                verticalSizing={3.4}
                horizontalSizing={1.0}
                fogIntensity={0.6}
                fogScale={0.3}
                wispDensity={0.85}
                wispSpeed={10}
                wispIntensity={7}
                flowStrength={0.28}
                decay={1.15}
                falloffStart={1.3}
                fogFallSpeed={0.45}
              />
            ) : (
              <div className="w-full h-full" style={{ background: FALLBACK_BG }} />
            )}
          </div>
        </div>
      </motion.div>

      {/* Noise overlay */}
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
            'radial-gradient(circle at 50% 40%, rgba(10,10,20,0.05) 0%, rgba(10,10,20,0.5) 65%)',
        }}
      />

      {/* Bottom vignette — soft fade so beam glow reaches hero edge.
          The hard "landing" lives in Section2LaserImpact. */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: `${(1 - BEAM_BOTTOM_FADE_START) * 100}%`,
          background:
            'linear-gradient(to top, rgba(10,15,28,0.6) 0%, rgba(10,15,28,0.2) 50%, transparent 100%)',
        }}
      />
    </div>
  );
}

export const HomeHeroLaser = memo(HomeHeroLaserInner);
