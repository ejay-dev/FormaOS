'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

type LayerType = 'foreground' | 'midground' | 'background';

interface DepthLayerProps {
  children: ReactNode;
  /** Depth layer preset (default: midground) */
  layer?: LayerType;
  /** Custom parallax rate override: 0-1 where 1 = full scroll speed */
  parallaxRate?: number;
  /** translateZ in px for 3D depth positioning (default: layer-based) */
  z?: number;
  /** Scroll displacement in px (default: layer-based) */
  distance?: number;
  className?: string;
}

/**
 * DepthLayer
 * ──────────
 * Parallax depth layer that lives inside a DepthStage.
 * Each layer has a translateZ value (true 3D depth) and a
 * scroll-linked Y displacement (parallax effect).
 *
 * Layer presets:
 *   foreground: rate=1.0, z=0, distance=50px   (moves with scroll)
 *   midground:  rate=0.6, z=-40px, distance=35px (slower)
 *   background: rate=0.3, z=-80px, distance=20px (slowest)
 *
 * Performance:
 *   - Transform-only animations (GPU-accelerated)
 *   - Uses useScroll + useTransform for efficient scroll tracking
 *   - No layout thrashing
 */

const LAYER_DEFAULTS: Record<LayerType, { rate: number; z: number; distance: number }> = {
  foreground: { rate: 1.0, z: 0, distance: 50 },
  midground:  { rate: 0.6, z: -40, distance: 35 },
  background: { rate: 0.3, z: -80, distance: 20 },
};

export function DepthLayer({
  children,
  layer = 'midground',
  parallaxRate,
  z,
  distance,
  className = '',
}: DepthLayerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const defaults = LAYER_DEFAULTS[layer];
  const resolvedZ = z ?? defaults.z;
  const resolvedDistance = distance ?? defaults.distance;
  const resolvedRate = parallaxRate ?? defaults.rate;

  // Scroll-linked displacement scaled by parallax rate
  const scaledDistance = resolvedDistance * resolvedRate;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [scaledDistance, -scaledDistance],
  );

  if (shouldReduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <div ref={ref} className={className}>
      <motion.div
        style={{
          y,
          translateZ: resolvedZ,
          willChange: 'transform',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default DepthLayer;
