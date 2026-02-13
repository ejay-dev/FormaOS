'use client';

import { memo, useEffect, useState } from 'react';

/**
 * AmbientParticleLayer
 * ────────────────────
 * Cinematic slow-drift snow / particle effect — CSS-only rendering.
 * GPU-friendly (transform + opacity), no JS animation loop.
 *
 * Auto-disables on:
 *  · prefers-reduced-motion
 *  · viewports < 768 px
 *  · low battery (< 20 %, discharging)
 *
 * Intensity variants control density and speed via CSS class modifiers.
 */

interface AmbientParticleLayerProps {
  className?: string;
  /** Visual density: subtle (hero bg), normal (default), strong (CTA zones) */
  intensity?: 'subtle' | 'normal' | 'strong';
  /** Defer rendering to protect first paint on marketing routes. */
  deferMode?: 'none' | 'idle' | 'interaction';
}

function AmbientParticleLayerInner({
  className = '',
  intensity = 'normal',
  deferMode = 'idle',
}: AmbientParticleLayerProps) {
  const [enabled, setEnabled] = useState(true);
  const [ready, setReady] = useState(deferMode === 'none');

  useEffect(() => {
    // Reduced motion
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      setEnabled(false);
      return;
    }

    // Small screens — disable to save resources
    if (window.innerWidth < 768) {
      setEnabled(false);
      return;
    }

    // Low-power detection (Battery API, Safari / Chrome)
    if ('getBattery' in navigator) {
      (navigator as unknown as { getBattery(): Promise<{ level: number; charging: boolean }> })
        .getBattery()
        .then((battery) => {
          if (battery.level < 0.2 && !battery.charging) setEnabled(false);
        })
        .catch(() => {});
    }

    const handler = (e: MediaQueryListEvent) => setEnabled(!e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (deferMode === 'none') {
      setReady(true);
      return;
    }

    if (deferMode === 'interaction') {
      const onIntent = () => {
        setReady(true);
        window.removeEventListener('pointerdown', onIntent);
        window.removeEventListener('keydown', onIntent);
        window.removeEventListener('scroll', onIntent);
      };
      window.addEventListener('pointerdown', onIntent, { once: true, passive: true });
      window.addEventListener('keydown', onIntent, { once: true });
      window.addEventListener('scroll', onIntent, { once: true, passive: true });
      return () => {
        window.removeEventListener('pointerdown', onIntent);
        window.removeEventListener('keydown', onIntent);
        window.removeEventListener('scroll', onIntent);
      };
    }

    // idle mode
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    const activate = () => setReady(true);
    const schedule = () => {
      if ('requestIdleCallback' in window) {
        idleId = (window as Window & {
          requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
        }).requestIdleCallback(activate, { timeout: 1400 });
      } else {
        timeoutId = setTimeout(activate, 700);
      }
    };

    if (document.readyState === 'complete') {
      schedule();
    } else {
      const onLoad = () => {
        schedule();
        window.removeEventListener('load', onLoad);
      };
      window.addEventListener('load', onLoad, { once: true });
      return () => window.removeEventListener('load', onLoad);
    }

    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
      if (idleId !== null && 'cancelIdleCallback' in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
    };
  }, [deferMode, enabled]);

  if (!enabled || !ready) return null;

  const mod =
    intensity === 'subtle'
      ? 'snow-field--subtle'
      : intensity === 'strong'
        ? 'snow-field--strong'
        : '';

  return (
    <div
      aria-hidden
      className={`snow-field ${mod} pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    />
  );
}

export const AmbientParticleLayer = memo(AmbientParticleLayerInner);
export default AmbientParticleLayer;
