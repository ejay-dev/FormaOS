'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';

type RevealVariant = 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scaleUp' | 'blurIn' | 'slideUp';

interface ScrollRevealProps {
  children: ReactNode;
  /** Animation variant (default: fadeUp) */
  variant?: RevealVariant;
  /** Scroll range where animation happens: [start, end] as fractions 0-1 (default: [0, 0.4]) */
  range?: [number, number];
  /** Additional className */
  className?: string;
  /** Whether to add parallax depth effect */
  parallax?: boolean;
  /** Parallax intensity in px (default: 30) */
  parallaxDistance?: number;
}

const VARIANT_CONFIG: Record<RevealVariant, { from: Record<string, number>; to: Record<string, number> }> = {
  fadeUp: { from: { opacity: 0, y: 40 }, to: { opacity: 1, y: 0 } },
  fadeDown: { from: { opacity: 0, y: -30 }, to: { opacity: 1, y: 0 } },
  fadeLeft: { from: { opacity: 0, x: -40 }, to: { opacity: 1, x: 0 } },
  fadeRight: { from: { opacity: 0, x: 40 }, to: { opacity: 1, x: 0 } },
  scaleUp: { from: { opacity: 0, scale: 0.92 }, to: { opacity: 1, scale: 1 } },
  blurIn: { from: { opacity: 0, filter: 'blur(8px)' as unknown as number }, to: { opacity: 1, filter: 'blur(0px)' as unknown as number } },
  slideUp: { from: { opacity: 0, y: 60 }, to: { opacity: 1, y: 0 } },
};

export function ScrollReveal({
  children,
  variant = 'fadeUp',
  range = [0, 0.4],
  className = '',
  parallax = false,
  parallaxDistance = 30,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const config = VARIANT_CONFIG[variant];

  // Map scroll progress to animation values
  const opacity = useTransform(scrollYProgress, [range[0], range[1]], [config.from.opacity ?? 0, config.to.opacity ?? 1]);
  const y = useTransform(scrollYProgress, [range[0], range[1]], [config.from.y ?? 0, config.to.y ?? 0]);
  const x = useTransform(scrollYProgress, [range[0], range[1]], [config.from.x ?? 0, config.to.x ?? 0]);
  const scale = useTransform(scrollYProgress, [range[0], range[1]], [config.from.scale ?? 1, config.to.scale ?? 1]);

  // Parallax effect (continues after reveal)
  const parallaxY = useTransform(scrollYProgress, [0, 1], [parallaxDistance, -parallaxDistance]);

  if (shouldReduceMotion) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      <motion.div
        style={{
          opacity,
          y: parallax ? parallaxY : y,
          x,
          scale,
          willChange: 'opacity, transform',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

/** Depth parallax wrapper — 3 layers at different speeds */
interface ParallaxDepthProps {
  children: ReactNode;
  /** Speed multiplier: 'slow' = background, 'medium' = midground, 'fast' = foreground */
  layer?: 'slow' | 'medium' | 'fast';
  className?: string;
}

const LAYER_SPEEDS = { slow: 15, medium: 30, fast: 50 };

export function ParallaxDepth({ children, layer = 'medium', className = '' }: ParallaxDepthProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const distance = LAYER_SPEEDS[layer];

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance]);

  if (shouldReduceMotion) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

export default ScrollReveal;
