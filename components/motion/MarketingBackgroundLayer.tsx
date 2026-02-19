'use client';

import { memo, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { CanvasShaderBackground } from './CanvasShaderBackground';

/**
 * MarketingBackgroundLayer
 * ─────────────────────────
 * Shared fixed-position background for ALL marketing pages.
 * Provides: depth gradient · dot-grid · film grain · vignette · radial bloom.
 * Placed once in the marketing layout — no per-page duplication.
 */
function MarketingBackgroundLayerInner() {
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [enhancedReady, setEnhancedReady] = useState(false);

  useEffect(() => {
    const updateMobile = () => setIsMobile(window.innerWidth < 768);
    updateMobile();
    window.addEventListener('resize', updateMobile);
    return () => window.removeEventListener('resize', updateMobile);
  }, []);

  useEffect(() => {
    if (shouldReduceMotion) return;

    let rafId = 0;

    const updateScrollDepth = () => {
      rafId = 0;
      const depth = Math.min(window.scrollY, 2400);
      document.documentElement.style.setProperty('--mk-scroll-depth', `${depth}px`);
    };

    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(updateScrollDepth);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateScrollDepth();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
      document.documentElement.style.removeProperty('--mk-scroll-depth');
    };
  }, [shouldReduceMotion]);

  useEffect(() => {
    if (isMobile || shouldReduceMotion) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const activate = () => setEnhancedReady(true);
    if ('requestIdleCallback' in window) {
      idleId = (window as Window & {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
      }).requestIdleCallback(activate, { timeout: 1200 });
    } else {
      timeoutId = setTimeout(activate, 600);
    }

    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
      if (idleId !== null && 'cancelIdleCallback' in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
    };
  }, [isMobile, shouldReduceMotion]);

  return (
    <div
      aria-hidden
      className="mk-bg-layer pointer-events-none fixed inset-0 z-0"
    >
      {/* Canvas aurora + data streams (replaces dot-grid) */}
      {!shouldReduceMotion && !isMobile && <CanvasShaderBackground />}

      {/* Vertical depth gradient */}
      <div className="mk-bg-depth mk-bg-depth--far absolute inset-0 bg-gradient-to-b from-transparent via-[#0d1421]/30 to-transparent" />

      {/* Radial bloom fallback for mobile / reduced motion */}
      {(isMobile || shouldReduceMotion) && (
        <div
          className="mk-bg-depth mk-bg-depth--mid absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% 35%, rgba(6,182,212,0.06) 0%, transparent 70%)',
          }}
        />
      )}

      {/* Film grain (CSS noise) */}
      {!shouldReduceMotion && !isMobile && enhancedReady && <div className="mk-grain absolute inset-0" />}

      {/* Vignette — edge darkening */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35) 100%)',
        }}
      />
    </div>
  );
}

export const MarketingBackgroundLayer = memo(MarketingBackgroundLayerInner);
export default MarketingBackgroundLayer;
