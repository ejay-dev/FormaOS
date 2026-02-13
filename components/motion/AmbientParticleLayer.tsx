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
}

function AmbientParticleLayerInner({
  className = '',
  intensity = 'normal',
}: AmbientParticleLayerProps) {
  const [enabled, setEnabled] = useState(true);

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

  if (!enabled) return null;

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
