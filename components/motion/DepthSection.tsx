'use client';

import { type ReactNode, useRef } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

interface DepthSectionProps {
  children: ReactNode;
  /** Optional background decoration content (slower parallax) */
  backgroundContent?: ReactNode;
  /** Fade in/out as section enters/exits viewport */
  fade?: boolean;
  /** Additional className */
  className?: string;
  /** Background parallax rate (default: 0.3) */
  backgroundRate?: number;
}

/**
 * DepthSection
 * ────────────
 * Section-level depth wrapper for non-hero content.
 * Provides optional background parallax layer and
 * scroll-driven fade for the foreground.
 */
export function DepthSection({
  children,
  backgroundContent,
  fade = false,
  className = '',
  backgroundRate = 0.3,
}: DepthSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Background parallax — slower scroll
  const bgY = useTransform(
    scrollYProgress,
    [0, 1],
    [40 * backgroundRate, -40 * backgroundRate],
  );

  // Optional fade envelope
  const contentOpacity = useTransform(
    scrollYProgress,
    [0, 0.15, 0.85, 1],
    fade ? [0, 1, 1, 0] : [1, 1, 1, 1],
  );

  if (shouldReduceMotion) {
    return (
      <div ref={ref} className={`relative ${className}`}>
        {backgroundContent && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {backgroundContent}
          </div>
        )}
        <div className="relative z-10">{children}</div>
      </div>
    );
  }

  return (
    <div ref={ref} className={`relative ${className}`}>
      {backgroundContent && (
        <motion.div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ y: bgY }}
        >
          {backgroundContent}
        </motion.div>
      )}
      <motion.div
        className="relative z-10"
        style={{ opacity: contentOpacity }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export default DepthSection;
