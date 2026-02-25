'use client';

import { useRef, useCallback, type ReactNode } from 'react';
import { motion, useMotionValue, useTransform, useSpring, useReducedMotion } from 'framer-motion';

interface GlassDepthCardProps {
  children: ReactNode;
  className?: string;
  /** Accent glow color as R,G,B string (default: '34,211,238' = cyan) */
  glowColor?: string;
  /** Enable cursor-tracking radial light sweep (default: true) */
  lightSweep?: boolean;
  /** Hover lift distance in px (default: 6) */
  liftDistance?: number;
  /** Glass intensity: controls opacity of background + border (default: 'normal') */
  intensity?: 'subtle' | 'normal' | 'strong';
  /** HTML element tag (default: 'div') */
  as?: 'div' | 'article' | 'section';
}

const INTENSITY_STYLES = {
  subtle: {
    bg: 'from-white/[0.03] to-white/[0.01]',
    border: 'border-white/[0.06]',
    blur: 'backdrop-blur-md',
  },
  normal: {
    bg: 'from-white/[0.08] to-white/[0.02]',
    border: 'border-white/[0.10]',
    blur: 'backdrop-blur-xl',
  },
  strong: {
    bg: 'from-white/[0.12] to-white/[0.04]',
    border: 'border-white/[0.15]',
    blur: 'backdrop-blur-xl',
  },
};

/**
 * GlassDepthCard
 * ──────────────
 * Premium glass morphism card with:
 *  - Cursor-tracking radial light sweep
 *  - Hover lift (y + translateZ)
 *  - Border glow intensification on hover
 *  - Reduced-motion safe
 */
export function GlassDepthCard({
  children,
  className = '',
  glowColor = '34,211,238',
  lightSweep = true,
  liftDistance = 6,
  intensity = 'normal',
  as: Tag = 'div',
}: GlassDepthCardProps) {
  const shouldReduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  // Local cursor position within card (0-1)
  const localX = useMotionValue(0.5);
  const localY = useMotionValue(0.5);
  const smoothX = useSpring(localX, { stiffness: 200, damping: 25 });
  const smoothY = useSpring(localY, { stiffness: 200, damping: 25 });

  // Light sweep gradient
  const lightGradient = useTransform(
    [smoothX, smoothY] as MotionValue<number>[],
    ([x, y]: number[]) =>
      `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(${glowColor},0.12) 0%, transparent 60%)`,
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (shouldReduceMotion || !lightSweep || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      localX.set((e.clientX - rect.left) / rect.width);
      localY.set((e.clientY - rect.top) / rect.height);
    },
    [shouldReduceMotion, lightSweep, localX, localY],
  );

  const handleMouseLeave = useCallback(() => {
    localX.set(0.5);
    localY.set(0.5);
  }, [localX, localY]);

  const s = INTENSITY_STYLES[intensity];
  const MotionTag = motion[Tag];

  if (shouldReduceMotion) {
    return (
      <div
        className={`rounded-2xl border ${s.border} ${s.blur} bg-gradient-to-br ${s.bg} ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <MotionTag
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ y: -liftDistance, scale: 1.02 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={`relative rounded-2xl border ${s.border} ${s.blur} bg-gradient-to-br ${s.bg} overflow-hidden transition-[border-color] hover:border-white/[0.18] ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
      {lightSweep && (
        <motion.div
          className="absolute inset-0 pointer-events-none rounded-[inherit] z-10"
          style={{ background: lightGradient } as Record<string, unknown>}
        />
      )}
    </MotionTag>
  );
}

// Need MotionValue import for the type assertion
import type { MotionValue } from 'framer-motion';

export default GlassDepthCard;
