/**
 * Tests for lib/device-tier.ts
 * Covers: detectTier, buildConfig, getDeviceTierConfig, tierParticleCount
 */

import { tierParticleCount, type TierConfig } from '@/lib/device-tier';

// Reset cached config between tests
beforeEach(() => {
  jest.resetModules();
});

describe('tierParticleCount', () => {
  it('scales particle count by multiplier', () => {
    const config = { particleMultiplier: 0.5 } as TierConfig;
    expect(tierParticleCount(100, config)).toBe(50);
  });

  it('scales particle count for high tier', () => {
    const config = { particleMultiplier: 1 } as TierConfig;
    expect(tierParticleCount(100, config)).toBe(100);
  });

  it('scales particle count for low tier', () => {
    const config = { particleMultiplier: 0.25 } as TierConfig;
    expect(tierParticleCount(100, config)).toBe(25);
  });

  it('enforces minimum of 4 particles', () => {
    const config = { particleMultiplier: 0.01 } as TierConfig;
    expect(tierParticleCount(10, config)).toBe(4);
  });

  it('returns minimum 4 for very small base count', () => {
    const config = { particleMultiplier: 0.25 } as TierConfig;
    expect(tierParticleCount(1, config)).toBe(4);
  });
});

/**
 * Audit 2026-08-02: the SSR describe and all three "TierConfig properties"
 * tests used to build a plain object literal inside the test body and assert
 * that literal's own properties — no function from '@/lib/device-tier' was
 * ever called, so detectTier/buildConfig had effectively zero coverage. Each
 * test below now drives the real detection heuristics through
 * getDeviceTierConfig() with controlled browser signals.
 *
 * getDeviceTierConfig memoises into a module-level `cachedConfig`, so every
 * call resets the module registry to get a fresh detection.
 */
function loadTierConfig(signals: {
  reducedMotion?: boolean;
  coarsePointer?: boolean;
  width?: number;
  cores?: number;
  memory?: number;
  dpr?: number;
}) {
  const {
    reducedMotion = false,
    coarsePointer = false,
    width = 1440,
    cores = 8,
    memory = 8,
    dpr = 1,
  } = signals;

  window.matchMedia = jest.fn((query: string) => ({
    matches: query.includes('prefers-reduced-motion')
      ? reducedMotion
      : query.includes('pointer: coarse')
        ? coarsePointer
        : false,
  })) as any;
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window, 'devicePixelRatio', {
    value: dpr,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window.navigator, 'hardwareConcurrency', {
    value: cores,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(window.navigator, 'deviceMemory', {
    value: memory,
    writable: true,
    configurable: true,
  });

  jest.resetModules();
  const { getDeviceTierConfig } = require('@/lib/device-tier');
  return getDeviceTierConfig() as TierConfig;
}

describe('getDeviceTierConfig', () => {
  it('memoises detection so every consumer sees the same config object', () => {
    const first = loadTierConfig({ cores: 8, memory: 8, width: 1440 });
    const { getDeviceTierConfig } = require('@/lib/device-tier');
    expect(getDeviceTierConfig()).toBe(first);
  });

  it('classifies a mid device from mid-range hardware signals', () => {
    // cores 4 (+2) + memory 4 (+2) + width 800 (+1) = 5 -> mid (3..5)
    const config = loadTierConfig({ cores: 4, memory: 4, width: 800 });
    expect(config).toEqual({
      tier: 'mid',
      isTouch: false,
      reducedMotion: false,
      cursorTilt: true,
      autoDrift: false,
      particleMultiplier: 0.5,
      enableBlur: true,
      enableOverlays: false,
      enableConnections: false,
      maxLayers: 3,
      fpsCap: 30,
      parallaxIntensity: 0.6,
    });
  });

  it('demotes a small low-memory phone to the low tier', () => {
    // cores 2 (+0) + memory 1 (+0) + width 390 (+0) + dpr 3 on <430 (-1) = -1
    const config = loadTierConfig({
      cores: 2,
      memory: 1,
      width: 390,
      dpr: 3,
      coarsePointer: true,
    });
    expect(config.tier).toBe('low');
  });
});

describe('TierConfig properties', () => {
  it('low tier disables blur, overlays, connections', () => {
    // prefers-reduced-motion forces the low tier regardless of hardware.
    const config = loadTierConfig({
      reducedMotion: true,
      cores: 8,
      memory: 8,
      width: 1440,
    });
    expect(config.tier).toBe('low');
    expect(config.reducedMotion).toBe(true);
    expect(config.enableBlur).toBe(false);
    expect(config.enableOverlays).toBe(false);
    expect(config.enableConnections).toBe(false);
    expect(config.cursorTilt).toBe(false);
    expect(config.autoDrift).toBe(false);
    expect(config.particleMultiplier).toBe(0.25);
    expect(config.maxLayers).toBe(2);
    expect(config.fpsCap).toBe(20);
    expect(config.parallaxIntensity).toBe(0.3);
  });

  it('high tier enables all features', () => {
    // cores 8 (+3) + memory 8 (+3) + width 1440 (+2) = 8 -> high (>=6)
    const config = loadTierConfig({ cores: 8, memory: 8, width: 1440 });
    expect(config.tier).toBe('high');
    expect(config.enableBlur).toBe(true);
    expect(config.enableOverlays).toBe(true);
    expect(config.enableConnections).toBe(true);
    expect(config.cursorTilt).toBe(true);
    expect(config.autoDrift).toBe(false);
    expect(config.particleMultiplier).toBe(1);
    expect(config.maxLayers).toBe(5);
    expect(config.parallaxIntensity).toBe(1);
  });

  it('touch device on mid tier gets autoDrift, no cursorTilt', () => {
    const config = loadTierConfig({
      coarsePointer: true,
      cores: 4,
      memory: 4,
      width: 800,
    });
    expect(config.tier).toBe('mid');
    expect(config.isTouch).toBe(true);
    expect(config.autoDrift).toBe(true);
    expect(config.cursorTilt).toBe(false);
  });

  it('touch device on low tier gets neither autoDrift nor cursorTilt', () => {
    const config = loadTierConfig({
      coarsePointer: true,
      reducedMotion: true,
      cores: 8,
      memory: 8,
      width: 1440,
    });
    expect(config.tier).toBe('low');
    expect(config.isTouch).toBe(true);
    expect(config.autoDrift).toBe(false);
    expect(config.cursorTilt).toBe(false);
  });
});
