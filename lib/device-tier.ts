'use client';

import { useState, useEffect, useMemo } from 'react';

// =========================================================
// DEVICE PERFORMANCE TIER SYSTEM
// =========================================================
// Classifies devices into low / mid / high tiers based on
// hardware signals. Used by motion components to scale effects
// instead of disabling them entirely on mobile.

export type DeviceTier = 'low' | 'mid' | 'high';

export interface TierConfig {
  tier: DeviceTier;
  /** Whether this is a touch-primary device */
  isTouch: boolean;
  /** Whether reduced motion is preferred */
  reducedMotion: boolean;
  /** Particle count multiplier (0.15–1) */
  particleMultiplier: number;
  /** Whether to render blur-heavy effects */
  enableBlur: boolean;
  /** Whether to render film grain / dot-grid overlays */
  enableOverlays: boolean;
  /** Whether to use connection lines between particles */
  enableConnections: boolean;
  /** Max number of concurrent animated layers */
  maxLayers: number;
  /** FPS cap for canvas animations */
  fpsCap: number;
  /** Whether cursor-following tilt is available (desktop pointer) */
  cursorTilt: boolean;
  /** Whether to use auto-drift motion (mobile replacement for cursor tilt) */
  autoDrift: boolean;
  /** Parallax intensity multiplier (0–1) */
  parallaxIntensity: number;
}

// Tier presets
const TIER_CONFIGS: Record<DeviceTier, Omit<TierConfig, 'tier' | 'isTouch' | 'reducedMotion' | 'cursorTilt' | 'autoDrift'>> = {
  low: {
    particleMultiplier: 0.25,
    enableBlur: false,
    enableOverlays: false,
    enableConnections: false,
    maxLayers: 2,
    fpsCap: 20,
    parallaxIntensity: 0.3,
  },
  mid: {
    particleMultiplier: 0.5,
    enableBlur: true,
    enableOverlays: false,
    enableConnections: false,
    maxLayers: 3,
    fpsCap: 30,
    parallaxIntensity: 0.6,
  },
  high: {
    particleMultiplier: 1,
    enableBlur: true,
    enableOverlays: true,
    enableConnections: true,
    maxLayers: 5,
    fpsCap: 30,
    parallaxIntensity: 1,
  },
};

/**
 * Detect device performance tier using available browser heuristics.
 * Runs once on mount (client-side only).
 */
function detectTier(): { tier: DeviceTier; isTouch: boolean; reducedMotion: boolean } {
  if (typeof window === 'undefined') {
    return { tier: 'mid', isTouch: false, reducedMotion: false };
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  const width = window.innerWidth;

  // Scoring system: higher = more capable
  let score = 0;

  // CPU cores
  const cores = (navigator as Navigator & { hardwareConcurrency?: number }).hardwareConcurrency;
  if (cores !== undefined) {
    if (cores >= 8) score += 3;
    else if (cores >= 4) score += 2;
    else score += 0;
  } else {
    score += 1; // unknown, assume mid
  }

  // Device memory (Chrome/Edge only)
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
  if (memory !== undefined) {
    if (memory >= 8) score += 3;
    else if (memory >= 4) score += 2;
    else if (memory >= 2) score += 1;
    else score += 0;
  } else {
    score += 1; // unknown, assume mid
  }

  // Viewport width as proxy for device class
  if (width >= 1024) score += 2;
  else if (width >= 768) score += 1;
  else score += 0;

  // DPR — high DPR on small screens = more GPU work
  const dpr = window.devicePixelRatio || 1;
  if (dpr > 2.5 && width < 430) score -= 1;

  // Classify
  let tier: DeviceTier;
  if (reducedMotion) {
    tier = 'low';
  } else if (score >= 6) {
    tier = 'high';
  } else if (score >= 3) {
    tier = 'mid';
  } else {
    tier = 'low';
  }

  return { tier, isTouch, reducedMotion };
}

/**
 * Build a full TierConfig from detected tier + device signals.
 */
function buildConfig(tier: DeviceTier, isTouch: boolean, reducedMotion: boolean): TierConfig {
  const base = TIER_CONFIGS[tier];
  return {
    tier,
    isTouch,
    reducedMotion,
    cursorTilt: !isTouch && tier !== 'low',
    autoDrift: isTouch && tier !== 'low',
    ...base,
  };
}

// =========================================================
// Singleton: detect once, share across all consumers
// =========================================================

let cachedConfig: TierConfig | null = null;

export function getDeviceTierConfig(): TierConfig {
  if (cachedConfig) return cachedConfig;
  const { tier, isTouch, reducedMotion } = detectTier();
  cachedConfig = buildConfig(tier, isTouch, reducedMotion);
  return cachedConfig;
}

// =========================================================
// React hook
// =========================================================

/**
 * Hook that returns the device's performance tier configuration.
 * Detection runs once on mount; value is stable across re-renders.
 */
export function useDeviceTier(): TierConfig {
  const [config, setConfig] = useState<TierConfig>(() => {
    // SSR fallback: assume mid desktop
    if (typeof window === 'undefined') {
      return buildConfig('mid', false, false);
    }
    return getDeviceTierConfig();
  });

  useEffect(() => {
    // Re-detect on client (handles SSR hydration)
    const detected = getDeviceTierConfig();
    setConfig(detected);

    // Listen for reduced-motion changes
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => {
      cachedConfig = null; // invalidate cache
      const fresh = getDeviceTierConfig();
      setConfig(fresh);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return config;
}

/**
 * Scale a particle count by the device tier multiplier.
 */
export function tierParticleCount(baseCount: number, config: TierConfig): number {
  return Math.max(4, Math.round(baseCount * config.particleMultiplier));
}
