'use client';

import { memo, useRef, useEffect, useState, useCallback } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { LaserFlow } from '@/components/motion/LaserFlow';

/**
 * ProductHeroLaser
 * ────────────────
 * Cinematic LaserFlow that drops from the hero into the top edge of the
 * showcase panel. Sits behind hero content as an absolute layer.
 *
 * Beam alignment:
 * - Measures the showcase panel's DOMRect on load + resize
 * - Sets CSS variables for beam position: --beam-x, --beam-y
 * - Laser container positioned so the bright "impact" area
 *   lands exactly at the showcase panel's top border
 *
 * Performance:
 * - Desktop: full WebGL beam
 * - Mobile: static gradient fallback (always visible)
 * - Reduced motion: static fallback
 * - Mounted once, never unmounts — pauses internally when off-screen
 */

interface ProductHeroLaserProps {
  /** Ref to the showcase panel element for beam alignment */
  showcaseRef: React.RefObject<HTMLDivElement | null>;
}

function ProductHeroLaserInner({ showcaseRef }: ProductHeroLaserProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const prefersReduced = useReducedMotion();
  const [isDesktop, setIsDesktop] = useState(false);
  const [beamY, setBeamY] = useState<number | null>(null);

  // Desktop-only WebGL
  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsDesktop(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Measure showcase panel position relative to our container
  const measureBeam = useCallback(() => {
    const wrapper = containerRef.current;
    const panel = showcaseRef.current;
    if (!wrapper || !panel) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();

    // Distance from top of wrapper to top of showcase panel
    const y = panelRect.top - wrapperRect.top;
    setBeamY(y);
  }, [showcaseRef]);

  useEffect(() => {
    measureBeam();
    // Re-measure on resize (throttled)
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onResize = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(measureBeam, 150);
    };
    window.addEventListener('resize', onResize, { passive: true });
    // Also measure after fonts/images load
    window.addEventListener('load', measureBeam);
    // Re-measure periodically for first 3 seconds (dynamic content loading)
    const intervals = [500, 1000, 2000, 3000].map((ms) =>
      setTimeout(measureBeam, ms),
    );
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('load', measureBeam);
      intervals.forEach(clearTimeout);
      if (timer) clearTimeout(timer);
    };
  }, [measureBeam]);

  // Scroll parallax — laser drifts slightly slower than scroll
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const laserY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const showWebGL = isDesktop && !prefersReduced;

  // Beam vertical offset: position the beam's bright center ~40% from top,
  // so the "impact" lands at the showcase panel edge
  const beamVerticalOffset = beamY != null
    ? -0.15 + (beamY / (typeof window !== 'undefined' ? window.innerHeight : 900)) * 0.1
    : -0.08;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      {/* Parallax wrapper */}
      <motion.div
        className="absolute inset-0"
        style={prefersReduced ? undefined : { y: laserY }}
      >
        {/* Oversized canvas — bleeds past viewport edges for cinematic feel */}
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
          {/* Radial mask: bright center, dissolves at edges */}
          <div
            className="w-full h-full"
            style={{
              WebkitMaskImage: 'radial-gradient(ellipse 60% 55% at 50% 45%, black 10%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.15) 55%, transparent 75%)',
              maskImage: 'radial-gradient(ellipse 60% 55% at 50% 45%, black 10%, rgba(0,0,0,0.7) 30%, rgba(0,0,0,0.15) 55%, transparent 75%)',
            }}
          >
            {showWebGL ? (
              <LaserFlow
                color="#8B5CF6"
                horizontalBeamOffset={0.0}
                verticalBeamOffset={beamVerticalOffset}
                flowSpeed={0.22}
                verticalSizing={3.2}
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
      </motion.div>

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

      {/* Impact glow — horizontal strip at showcase panel top edge */}
      {beamY != null && (
        <div
          className="absolute left-0 right-0 pointer-events-none"
          style={{ top: beamY - 30 }}
        >
          {/* Wide diffused glow */}
          <div
            className="mx-auto"
            style={{
              width: '60%',
              height: '60px',
              background: 'radial-gradient(ellipse 100% 100% at 50% 50%, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.06) 40%, transparent 70%)',
              filter: 'blur(12px)',
            }}
          />
          {/* Tight bright line */}
          <div
            className="mx-auto"
            style={{
              width: '40%',
              height: '2px',
              marginTop: '-30px',
              background: 'linear-gradient(90deg, transparent 0%, rgba(139,92,246,0.25) 20%, rgba(139,92,246,0.4) 50%, rgba(139,92,246,0.25) 80%, transparent 100%)',
              filter: 'blur(1px)',
            }}
          />
        </div>
      )}

      {/* Bottom vignette — dissolves laser into page below */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[30%] pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(3,7,18,1) 0%, rgba(3,7,18,0.6) 50%, transparent 100%)',
        }}
      />
    </div>
  );
}

export const ProductHeroLaser = memo(ProductHeroLaserInner);
