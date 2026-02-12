/**
 * =========================================================
 * FORMAOS SIGNATURE MOTION SYSTEM
 * =========================================================
 * Premium, performance-safe motion design system
 *
 * Principles:
 * - Functional motion that enhances hierarchy and clarity
 * - GPU-accelerated transforms only (transform, opacity)
 * - Respects prefers-reduced-motion
 * - Subtle, sophisticated, never gimmicky
 * - One-way reveals (no disappearing on scroll up)
 */

// =========================================================
// EASING CURVES
// =========================================================

export const easing = {
  // FormaOS signature easing - smooth, premium feel
  signature: [0.22, 1, 0.36, 1] as const,

  // Standard easings
  smooth: [0.4, 0, 0.2, 1] as const,
  spring: [0.5, 1, 0.89, 1] as const,
  snappy: [0.25, 0.46, 0.45, 0.94] as const,

  // Entrance/exit
  enter: [0, 0, 0.2, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
} as const;

// =========================================================
// DURATION SYSTEM
// =========================================================

export const duration = {
  instant: 0.15,
  fast: 0.25,
  normal: 0.4,
  slow: 0.6,
  slower: 0.8,
  slowest: 1.2,
} as const;

// =========================================================
// MOTION GOVERNANCE (LAYERED SYSTEM)
// =========================================================

export const motionLayers = {
  orientation: 'orientation',
  feedback: 'feedback',
  delight: 'delight',
} as const;

export type MotionLayer = keyof typeof motionLayers;

export const motionBudgets = {
  orientation: {
    maxDistancePx: 24,
    maxDuration: duration.slow,
  },
  feedback: {
    maxScaleDelta: 0.04,
    maxDuration: duration.fast,
  },
  delight: {
    maxDistancePx: 12,
    maxDuration: duration.slower,
  },
} as const;

const motionLayerTransitions = {
  orientation: {
    duration: duration.normal,
    ease: [...easing.signature],
  },
  feedback: {
    duration: duration.fast,
    ease: [...easing.smooth],
  },
  delight: {
    duration: duration.slow,
    ease: [...easing.signature],
  },
} as const;

type MotionLayerTransition = {
  duration: number;
  ease: [number, number, number, number];
  delay?: number;
  repeat?: number;
  repeatType?: 'loop' | 'reverse' | 'mirror';
};

export function getMotionLayerTransition(
  layer: MotionLayer,
  overrides?: Partial<MotionLayerTransition>,
): MotionLayerTransition {
  const base = motionLayerTransitions[layer];
  return {
    duration: base.duration,
    ease: [...base.ease] as [number, number, number, number],
    ...overrides,
  };
}

// =========================================================
// STAGGER DELAYS
// =========================================================

export const stagger = {
  tight: 0.05,
  normal: 0.1,
  relaxed: 0.15,
  loose: 0.2,
} as const;

// =========================================================
// ANIMATION VARIANTS
// =========================================================

export const variants = {
  // One-way fade in (never reverses on scroll up)
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: {
      duration: duration.normal,
      ease: easing.signature,
    },
  },

  // One-way fade in from direction
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: duration.slow,
      ease: easing.signature,
    },
  },

  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: duration.slow,
      ease: easing.signature,
    },
  },

  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: {
      duration: duration.slow,
      ease: easing.signature,
    },
  },

  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: {
      duration: duration.slow,
      ease: easing.signature,
    },
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: {
      duration: duration.normal,
      ease: easing.signature,
    },
  },

  // Blur reveal (for glass cards)
  blurReveal: {
    initial: { opacity: 0, filter: 'blur(10px)' },
    animate: { opacity: 1, filter: 'blur(0px)' },
    transition: {
      duration: duration.slow,
      ease: easing.signature,
    },
  },
} as const;

// =========================================================
// PARALLAX CONFIGURATION
// =========================================================

export const parallax = {
  // Decorative elements (icons, dots, shapes)
  decorative: {
    min: -8,
    max: 8,
    intensity: 'subtle',
  },

  // Background layers
  background: {
    min: -15,
    max: 15,
    intensity: 'medium',
  },

  // Hero elements
  hero: {
    min: -20,
    max: 20,
    intensity: 'strong',
  },
} as const;

// =========================================================
// SCROLL REVEAL CONFIGURATION
// =========================================================

export const scrollReveal = {
  // Standard reveal (appears when 10% visible)
  default: {
    once: true,
    margin: '-10% 0px -10% 0px',
    amount: 0.1,
  },

  // Early reveal (appears when approaching)
  early: {
    once: true,
    margin: '0px 0px -20% 0px',
    amount: 0,
  },

  // Late reveal (only when mostly visible)
  late: {
    once: true,
    margin: '-30% 0px -30% 0px',
    amount: 0.3,
  },

  // Continuous (for parallax - doesn't lock once)
  continuous: {
    once: false,
    margin: '0px',
    amount: 0,
  },
} as const;

// =========================================================
// GRADIENT TRANSITIONS
// =========================================================

export const gradientStops = {
  top: {
    from: 'rgba(15, 23, 42, 1)', // slate-900
    via: 'rgba(30, 41, 59, 1)', // slate-800
    to: 'rgba(15, 23, 42, 1)', // slate-900
  },

  middle: {
    from: 'rgba(15, 23, 42, 1)', // slate-900
    via: 'rgba(15, 35, 70, 1)', // blue-tinted
    to: 'rgba(30, 41, 59, 1)', // slate-800
  },

  bottom: {
    from: 'rgba(30, 41, 59, 1)', // slate-800
    via: 'rgba(30, 27, 75, 1)', // purple-tinted
    to: 'rgba(15, 23, 42, 1)', // slate-900
  },
} as const;

// =========================================================
// AMBIENT ORB CONFIGURATION
// =========================================================

export const ambientOrbs = {
  // Minimal orb presence
  subtle: {
    count: 2,
    maxSize: 400,
    minSize: 250,
    opacity: [0.03, 0.06],
    blur: 120,
    colors: [
      'rgba(59, 130, 246, 1)', // blue-500
      'rgba(139, 92, 246, 1)', // violet-500
    ],
  },

  // Standard orb presence
  normal: {
    count: 3,
    maxSize: 500,
    minSize: 300,
    opacity: [0.05, 0.08],
    blur: 100,
    colors: [
      'rgba(59, 130, 246, 1)', // blue-500
      'rgba(6, 182, 212, 1)', // cyan-500
      'rgba(139, 92, 246, 1)', // violet-500
    ],
  },

  // Strong orb presence
  strong: {
    count: 4,
    maxSize: 600,
    minSize: 350,
    opacity: [0.06, 0.1],
    blur: 80,
    colors: [
      'rgba(59, 130, 246, 1)', // blue-500
      'rgba(6, 182, 212, 1)', // cyan-500
      'rgba(139, 92, 246, 1)', // violet-500
      'rgba(16, 185, 129, 1)', // emerald-500
    ],
  },
} as const;

// =========================================================
// SPACING SYSTEM
// =========================================================

export const spacing = {
  // Section padding (vertical)
  section: {
    mobile: 'py-16',
    tablet: 'sm:py-20',
    desktop: 'lg:py-24',
    desktopLarge: 'xl:py-32',
  },

  // Section padding (combined)
  sectionFull: 'py-16 sm:py-20 lg:py-24 xl:py-32',
  sectionCompact: 'py-12 sm:py-16 lg:py-20',

  // Card spacing
  cardGap: {
    tight: 'gap-4',
    normal: 'gap-6',
    relaxed: 'gap-8',
  },

  // Container padding
  container: 'px-4 sm:px-6 lg:px-8',
  containerWide: 'px-6 sm:px-8 lg:px-12',
} as const;

// =========================================================
// DEPTH SYSTEM (Shadows & Glass)
// =========================================================

export const depth = {
  // Glass morphism
  glass: {
    subtle: 'bg-white/[0.02] backdrop-blur-sm',
    normal: 'bg-white/[0.03] backdrop-blur-md',
    strong: 'bg-white/[0.05] backdrop-blur-lg',
    intense: 'bg-white/[0.08] backdrop-blur-xl',
  },

  // Box shadows
  shadow: {
    subtle: 'shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
    normal: 'shadow-[0_12px_48px_rgba(0,0,0,0.18)]',
    strong: 'shadow-[0_20px_80px_rgba(0,0,0,0.24)]',
    intense: 'shadow-[0_24px_100px_rgba(0,0,0,0.32)]',
  },

  // Glow effects
  glow: {
    blue: 'shadow-[0_0_60px_rgba(59,130,246,0.15)]',
    cyan: 'shadow-[0_0_60px_rgba(6,182,212,0.15)]',
    purple: 'shadow-[0_0_60px_rgba(139,92,246,0.15)]',
    mixed:
      'shadow-[0_0_80px_rgba(59,130,246,0.1),0_0_40px_rgba(139,92,246,0.1)]',
  },

  // Border treatments
  border: {
    subtle: 'border border-white/[0.05]',
    normal: 'border border-white/[0.08]',
    glow: 'border border-white/[0.1] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]',
  },
} as const;

// =========================================================
// BORDER RADIUS SYSTEM
// =========================================================

export const radius = {
  card: 'rounded-2xl',
  cardLarge: 'rounded-3xl',
  container: 'rounded-[24px]',
  button: 'rounded-xl',
  input: 'rounded-lg',
  full: 'rounded-full',
} as const;

// =========================================================
// HELPER FUNCTIONS
// =========================================================

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get viewport-based configuration
 */
export function getViewportConfig(type: keyof typeof scrollReveal = 'default') {
  return scrollReveal[type];
}

/**
 * Calculate parallax transform based on scroll progress
 */
export function calculateParallax(
  scrollProgress: number,
  config: typeof parallax.decorative,
): number {
  const range = config.max - config.min;
  return config.min + scrollProgress * range;
}

export type MotionConfig = typeof variants;
export type EasingConfig = typeof easing;
export type DurationConfig = typeof duration;
