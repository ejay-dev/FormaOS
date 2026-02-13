'use client';

import { memo } from 'react';

/**
 * Lightweight CSS-only snow effect. No JS animation loop, no layout shift.
 * Uses a single container with pseudo-element keyframe animations.
 * Render inside a `position:relative; overflow:hidden` parent.
 */
function SnowParticlesInner({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`snow-field pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    />
  );
}

export const SnowParticles = memo(SnowParticlesInner);
export default SnowParticles;
