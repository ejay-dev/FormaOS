/**
 * =========================================================
 * FORMAOS IMMERSIVE HERO THEME SYSTEM
 * =========================================================
 * Per-page hero configurations for the ImmersiveHero component.
 * Each theme defines unique visual identity while sharing
 * the same architectural shell.
 */

export type GlowColor = 'cyan' | 'teal' | 'blue' | 'violet' | 'emerald' | 'rose' | 'amber';

export interface HeroTheme {
  /** Atmosphere gradient configuration */
  gradient: {
    topColor: GlowColor;
    bottomColor: GlowColor;
  };
  /** CursorTilt configuration */
  tilt: {
    intensity: number;
    glowColor: string;
    perspective: number;
  };
  /** 3D entrance animation */
  entrance: {
    initialBlur: number;
    initialScale: number;
    initialZ: number;
    duration: number;
  };
  /** Scroll exit cinematic fade */
  scrollExit: {
    holdUntil: number;
    fadeStart: number;
    fadeEnd: number;
  };
  /** Parallax layer speed multipliers */
  parallax: {
    foreground: number;
    midground: number;
    background: number;
  };
  /** Ambient particle intensity */
  particleIntensity: 'subtle' | 'normal' | 'strong';
}

// =========================================================
// Default shared values
// =========================================================

const defaultEntrance: HeroTheme['entrance'] = {
  initialBlur: 12,
  initialScale: 0.92,
  initialZ: -60,
  duration: 1.0,
};

const defaultScrollExit: HeroTheme['scrollExit'] = {
  holdUntil: 0.24,
  fadeStart: 0.82,
  fadeEnd: 0.96,
};

const defaultParallax: HeroTheme['parallax'] = {
  foreground: 1.0,
  midground: 0.6,
  background: 0.3,
};

// =========================================================
// Per-page hero themes
// =========================================================

export const heroThemes: Record<string, HeroTheme> = {
  home: {
    gradient: { topColor: 'cyan', bottomColor: 'blue' },
    tilt: { intensity: 4, glowColor: '34,211,238', perspective: 1400 },
    entrance: { ...defaultEntrance, initialBlur: 16, initialScale: 0.88, initialZ: -80, duration: 1.2 },
    scrollExit: defaultScrollExit,
    parallax: { foreground: 1.0, midground: 0.5, background: 0.25 },
    particleIntensity: 'strong',
  },

  product: {
    gradient: { topColor: 'violet', bottomColor: 'blue' },
    tilt: { intensity: 3, glowColor: '139,92,246', perspective: 1200 },
    entrance: { ...defaultEntrance, duration: 1.1 },
    scrollExit: { holdUntil: 0.15, fadeStart: 0.6, fadeEnd: 0.85 },
    parallax: defaultParallax,
    particleIntensity: 'normal',
  },

  security: {
    gradient: { topColor: 'cyan', bottomColor: 'blue' },
    tilt: { intensity: 3, glowColor: '34,211,238', perspective: 1200 },
    entrance: defaultEntrance,
    scrollExit: defaultScrollExit,
    parallax: defaultParallax,
    particleIntensity: 'normal',
  },

  trust: {
    gradient: { topColor: 'emerald', bottomColor: 'cyan' },
    tilt: { intensity: 3, glowColor: '52,211,153', perspective: 1200 },
    entrance: defaultEntrance,
    scrollExit: defaultScrollExit,
    parallax: defaultParallax,
    particleIntensity: 'normal',
  },

  pricing: {
    gradient: { topColor: 'violet', bottomColor: 'cyan' },
    tilt: { intensity: 4, glowColor: '139,92,246', perspective: 1100 },
    entrance: { ...defaultEntrance, initialScale: 0.9, initialZ: -50 },
    scrollExit: defaultScrollExit,
    parallax: { foreground: 1.0, midground: 0.55, background: 0.3 },
    particleIntensity: 'subtle',
  },

  industries: {
    gradient: { topColor: 'blue', bottomColor: 'emerald' },
    tilt: { intensity: 3, glowColor: '59,130,246', perspective: 1200 },
    entrance: defaultEntrance,
    scrollExit: defaultScrollExit,
    parallax: defaultParallax,
    particleIntensity: 'normal',
  },

  blog: {
    gradient: { topColor: 'violet', bottomColor: 'rose' },
    tilt: { intensity: 2, glowColor: '139,92,246', perspective: 1300 },
    entrance: { ...defaultEntrance, initialBlur: 8, initialScale: 0.95, initialZ: -40, duration: 0.8 },
    scrollExit: defaultScrollExit,
    parallax: defaultParallax,
    particleIntensity: 'subtle',
  },

  about: {
    gradient: { topColor: 'violet', bottomColor: 'rose' },
    tilt: { intensity: 3, glowColor: '139,92,246', perspective: 1200 },
    entrance: defaultEntrance,
    scrollExit: defaultScrollExit,
    parallax: defaultParallax,
    particleIntensity: 'normal',
  },

  contact: {
    gradient: { topColor: 'blue', bottomColor: 'violet' },
    tilt: { intensity: 2, glowColor: '59,130,246', perspective: 1300 },
    entrance: { ...defaultEntrance, initialBlur: 8, initialScale: 0.95, initialZ: -40, duration: 0.8 },
    scrollExit: defaultScrollExit,
    parallax: defaultParallax,
    particleIntensity: 'subtle',
  },

  docs: {
    gradient: { topColor: 'blue', bottomColor: 'cyan' },
    tilt: { intensity: 2, glowColor: '59,130,246', perspective: 1200 },
    entrance: { ...defaultEntrance, initialBlur: 8, initialScale: 0.95, initialZ: -30, duration: 0.7 },
    scrollExit: defaultScrollExit,
    parallax: defaultParallax,
    particleIntensity: 'subtle',
  },

  frameworks: {
    gradient: { topColor: 'blue', bottomColor: 'violet' },
    tilt: { intensity: 3, glowColor: '59,130,246', perspective: 1200 },
    entrance: defaultEntrance,
    scrollExit: defaultScrollExit,
    parallax: defaultParallax,
    particleIntensity: 'normal',
  },

  faq: {
    gradient: { topColor: 'cyan', bottomColor: 'emerald' },
    tilt: { intensity: 2, glowColor: '34,211,238', perspective: 1200 },
    entrance: { ...defaultEntrance, initialBlur: 8, initialScale: 0.95, initialZ: -30, duration: 0.7 },
    scrollExit: defaultScrollExit,
    parallax: defaultParallax,
    particleIntensity: 'subtle',
  },

  compare: {
    gradient: { topColor: 'cyan', bottomColor: 'blue' },
    tilt: { intensity: 3, glowColor: '34,211,238', perspective: 1200 },
    entrance: defaultEntrance,
    scrollExit: defaultScrollExit,
    parallax: defaultParallax,
    particleIntensity: 'normal',
  },

  'use-cases': {
    gradient: { topColor: 'emerald', bottomColor: 'blue' },
    tilt: { intensity: 3, glowColor: '52,211,153', perspective: 1200 },
    entrance: defaultEntrance,
    scrollExit: defaultScrollExit,
    parallax: defaultParallax,
    particleIntensity: 'normal',
  },

  'our-story': {
    gradient: { topColor: 'violet', bottomColor: 'cyan' },
    tilt: { intensity: 3, glowColor: '139,92,246', perspective: 1200 },
    entrance: defaultEntrance,
    scrollExit: defaultScrollExit,
    parallax: defaultParallax,
    particleIntensity: 'normal',
  },

  'customer-stories': {
    gradient: { topColor: 'cyan', bottomColor: 'blue' },
    tilt: { intensity: 2, glowColor: '34,211,238', perspective: 1300 },
    entrance: { ...defaultEntrance, initialBlur: 8, initialScale: 0.95, initialZ: -40, duration: 0.8 },
    scrollExit: defaultScrollExit,
    parallax: defaultParallax,
    particleIntensity: 'subtle',
  },

  'security-review': {
    gradient: { topColor: 'rose', bottomColor: 'blue' },
    tilt: { intensity: 3, glowColor: '251,113,133', perspective: 1200 },
    entrance: defaultEntrance,
    scrollExit: defaultScrollExit,
    parallax: defaultParallax,
    particleIntensity: 'normal',
  },

  'outcome-journey': {
    gradient: { topColor: 'cyan', bottomColor: 'violet' },
    tilt: { intensity: 3, glowColor: '34,211,238', perspective: 1200 },
    entrance: defaultEntrance,
    scrollExit: defaultScrollExit,
    parallax: defaultParallax,
    particleIntensity: 'normal',
  },
} as const;

export function getHeroTheme(key: string): HeroTheme {
  return heroThemes[key] ?? heroThemes.security;
}
