'use client';

import { memo, useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useControlPlaneRuntime } from '@/lib/control-plane/runtime-client';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';
import { useDeviceTier } from '@/lib/device-tier';

/**
 * MarketingBackgroundLayer
 * ─────────────────────────
 * Shared fixed-position background for ALL marketing pages.
 * Provides: depth gradient · dot-grid · film grain · vignette · radial bloom.
 * Placed once in the marketing layout — no per-page duplication.
 *
 * Mobile: effects are now tiered instead of disabled.
 * - high: full dot-grid + film grain
 * - mid: bloom + vignette (no grain/grid — they're subtle and expensive)
 * - low: bloom + vignette only
 */
function MarketingBackgroundLayerInner() {
  const shouldReduceMotion = useReducedMotion();
  const tierConfig = useDeviceTier();
  const [enhancedReady, setEnhancedReady] = useState(false);
  const { snapshot } = useControlPlaneRuntime();
  const runtime = snapshot?.marketing.runtime ?? DEFAULT_RUNTIME_MARKETING.runtime;
  const expensiveEffectsEnabled = runtime.expensiveEffectsEnabled;
  const allowScrollDepthParallax =
    !shouldReduceMotion &&
    expensiveEffectsEnabled &&
    tierConfig.tier === 'high' &&
    !tierConfig.isTouch;

  useEffect(() => {
    if (!allowScrollDepthParallax) return;

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
  }, [allowScrollDepthParallax]);

  useEffect(() => {
    if (shouldReduceMotion || !expensiveEffectsEnabled) return;

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
  }, [shouldReduceMotion, expensiveEffectsEnabled]);

  const bloomGradient =
    runtime.backgroundVariant === 'sunrise'
      ? 'radial-gradient(ellipse 70% 50% at 50% 35%, rgba(251,146,60,0.08) 0%, transparent 70%)'
      : runtime.backgroundVariant === 'matrix'
        ? 'radial-gradient(ellipse 70% 50% at 50% 35%, rgba(34,197,94,0.08) 0%, transparent 70%)'
        : 'radial-gradient(ellipse 70% 50% at 50% 35%, rgba(6,182,212,0.06) 0%, transparent 70%)';

  // Tiered overlay rendering: grid + grain only on high-tier devices
  const showOverlays = enhancedReady && tierConfig.enableOverlays && expensiveEffectsEnabled;

  return (
    <div
      aria-hidden
      data-theme-variant={runtime.themeVariant}
      data-background-variant={runtime.backgroundVariant}
      className="mk-bg-layer pointer-events-none fixed inset-0 z-0"
    >
      {/* Vertical depth gradient */}
      <div className="mk-bg-depth mk-bg-depth--far absolute inset-0 bg-gradient-to-b from-transparent via-[#0d1421]/30 to-transparent" />

      {/* Dot-grid pattern — high tier only */}
      {showOverlays && (
        <div
          className="mk-bg-depth mk-bg-depth--near absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.15) 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* Radial bloom — soft center light (all tiers) */}
      {enhancedReady && (
        <div
          className="mk-bg-depth mk-bg-depth--mid absolute inset-0"
          style={{
            background: bloomGradient,
          }}
        />
      )}

      {/* Film grain — high tier only */}
      {!shouldReduceMotion && showOverlays && (
        <div className="mk-grain absolute inset-0" />
      )}

      {/* Vignette — edge darkening (all tiers) */}
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
