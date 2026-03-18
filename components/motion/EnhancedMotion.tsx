'use client';

import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { ReactNode, useRef } from 'react';
import {
  variants,
  scrollReveal,
  parallax as parallaxConfig,
  easing,
  duration,
} from '@/config/motion';

/**
 * =========================================================
 * ONE-WAY REVEAL
 * =========================================================
 * Appears on scroll, never disappears when scrolling back up
 * Fixes the "disappearing content" bug
 */

interface RevealProps {
  children: ReactNode;
  variant?: keyof typeof variants;
  delay?: number;
  className?: string;
  viewport?: keyof typeof scrollReveal;
}

export function Reveal({
  children,
  variant = 'fadeInUp',
  delay = 0,
  className = '',
  viewport = 'default',
}: RevealProps) {
  const shouldReduceMotion = useReducedMotion();
  const viewportConfig = scrollReveal[viewport];
  const animationVariant = variants[variant];

  // Skip animation if reduced motion is preferred
  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={animationVariant.initial}
      whileInView={animationVariant.animate}
      viewport={viewportConfig}
      transition={{
        ...animationVariant.transition,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * =========================================================
 * STAGGER CONTAINER
 * =========================================================
 * Reveals children one after another
 */

interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className = '',
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={scrollReveal.default}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * =========================================================
 * STAGGER ITEM
 * =========================================================
 * Use inside StaggerContainer
 */

interface StaggerItemProps {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}

export function StaggerItem({
  children,
  variant = 'fadeInUp',
  className = '',
}: StaggerItemProps) {
  const animationVariant = variants[variant];

  return (
    <motion.div
      variants={{
        hidden: animationVariant.initial,
        visible: animationVariant.animate,
      }}
      transition={animationVariant.transition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * =========================================================
 * PARALLAX ELEMENT
 * =========================================================
 * Subtle parallax motion for decorative elements
 * GPU-accelerated, scroll-based
 */

interface ParallaxProps {
  children: ReactNode;
  intensity?: 'subtle' | 'medium' | 'strong';
  direction?: 'up' | 'down';
  className?: string;
}

export function Parallax({
  children,
  intensity = 'subtle',
  direction = 'up',
  className = '',
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const parallaxIntensity = {
    subtle: parallaxConfig.decorative,
    medium: parallaxConfig.background,
    strong: parallaxConfig.hero,
  }[intensity];

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    direction === 'up'
      ? [parallaxIntensity.max, parallaxIntensity.min]
      : [parallaxIntensity.min, parallaxIntensity.max],
  );

  // No parallax if reduced motion
  if (shouldReduceMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}

/**
 * =========================================================
 * SCROLL-REACTIVE GRADIENT
 * =========================================================
 * Background gradient that shifts based on scroll position
 */

interface ScrollGradientProps {
  children: ReactNode;
  className?: string;
}

export function ScrollGradient({
  children,
  className = '',
}: ScrollGradientProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const gradientBackground = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    [
      'linear-gradient(to bottom, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      'linear-gradient(to bottom, #0f172a 0%, #0f2346 50%, #1e293b 100%)',
      'linear-gradient(to bottom, #1e293b 0%, #1e1b4b 50%, #0f172a 100%)',
    ],
  );

  if (shouldReduceMotion) {
    return (
      <div
        ref={ref}
        className={`bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      style={{
        background: gradientBackground,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * =========================================================
 * AMBIENT FLOATING ORBS
 * =========================================================
 * 2-3 large blurred gradient orbs for atmosphere
 */

interface AmbientOrbsProps {
  intensity?: 'subtle' | 'normal' | 'strong';
  className?: string;
}

export function AmbientOrbs({
  intensity = 'normal',
  className = '',
}: AmbientOrbsProps) {
  const shouldReduceMotion = useReducedMotion();

  const config = {
    subtle: {
      count: 2,
      sizes: [350, 300],
      positions: [
        [15, 10],
        [85, 80],
      ],
      colors: ['rgba(59, 130, 246, 0.04)', 'rgba(139, 92, 246, 0.03)'],
      blur: 120,
      durations: [20, 25],
    },
    normal: {
      count: 3,
      sizes: [400, 350, 320],
      positions: [
        [10, 15],
        [90, 20],
        [50, 75],
      ],
      colors: [
        'rgba(59, 130, 246, 0.06)',
        'rgba(6, 182, 212, 0.05)',
        'rgba(139, 92, 246, 0.04)',
      ],
      blur: 100,
      durations: [22, 28, 25],
    },
    strong: {
      count: 4,
      sizes: [500, 420, 380, 350],
      positions: [
        [8, 12],
        [92, 18],
        [25, 70],
        [75, 85],
      ],
      colors: [
        'rgba(59, 130, 246, 0.08)',
        'rgba(6, 182, 212, 0.06)',
        'rgba(139, 92, 246, 0.05)',
        'rgba(16, 185, 129, 0.04)',
      ],
      blur: 80,
      durations: [24, 30, 27, 33],
    },
  }[intensity];

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {Array.from({ length: config.count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: config.sizes[i],
            height: config.sizes[i],
            left: `${config.positions[i][0]}%`,
            top: `${config.positions[i][1]}%`,
            background: config.colors[i],
            filter: `blur(${config.blur}px)`,
            willChange: 'transform, opacity',
          }}
          initial={{
            x: 0,
            y: 0,
            opacity: 0,
          }}
          animate={
            shouldReduceMotion
              ? {
                  opacity: 1,
                }
              : {
                  x: [
                    0,
                    `${10}%`,
                    `${-8}%`,
                    0,
                  ],
                  y: [
                    0,
                    `${-12}%`,
                    `${8}%`,
                    0,
                  ],
                  opacity: [0, 1, 0.8, 1],
                  scale: [0.9, 1.1, 0.95, 0.9],
                }
          }
          transition={{
            duration: config.durations[i],
            repeat: Infinity,
            ease: easing.signature,
          }}
        />
      ))}
    </div>
  );
}

/**
 * =========================================================
 * GLASS CARD
 * =========================================================
 * Premium glassmorphism card with depth
 */

interface GlassCardProps {
  children: ReactNode;
  intensity?: 'subtle' | 'normal' | 'strong' | 'intense';
  glow?: boolean;
  className?: string;
}

export function GlassCard({
  children,
  intensity = 'normal',
  glow = false,
  className = '',
}: GlassCardProps) {
  const glassClasses = {
    subtle: 'bg-white/[0.02] backdrop-blur-sm',
    normal: 'bg-white/[0.03] backdrop-blur-md',
    strong: 'bg-white/[0.05] backdrop-blur-lg',
    intense: 'bg-white/[0.08] backdrop-blur-xl',
  }[intensity];

  const shadowClass = glow
    ? 'shadow-[0_20px_80px_rgba(0,0,0,0.24),0_0_60px_rgba(59,130,246,0.08)]'
    : 'shadow-[0_12px_48px_rgba(0,0,0,0.18)]';

  return (
    <div
      className={`
        ${glassClasses}
        ${shadowClass}
        border border-white/[0.08]
        rounded-2xl
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * =========================================================
 * HOVER LIFT
 * =========================================================
 * Subtle lift on hover for interactive cards
 */

interface HoverLiftProps {
  children: ReactNode;
  className?: string;
}

export function HoverLift({ children, className = '' }: HoverLiftProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      whileHover={{
        y: -4,
        transition: {
          duration: duration.fast,
          ease: easing.signature,
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
