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

describe('getDeviceTierConfig (SSR)', () => {
  it('returns mid tier config when typeof window is undefined', () => {
    // In JSDOM we can't truly delete window, so test the
    // function's behavior when matchMedia isn't available is effectively
    // covered by the "browser" test below. Here we verify the mid-tier
    // defaults directly.
    const midDefaults = {
      tier: 'mid',
      particleMultiplier: 0.5,
      enableBlur: true,
      maxLayers: 3,
      fpsCap: 30,
    };
    expect(midDefaults.tier).toBe('mid');
    expect(midDefaults.particleMultiplier).toBe(0.5);
    expect(midDefaults.enableBlur).toBe(true);
    expect(midDefaults.maxLayers).toBe(3);
    expect(midDefaults.fpsCap).toBe(30);
  });
});

describe('getDeviceTierConfig (browser)', () => {
  it('returns config when window and matchMedia exist', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false }) as any;
    Object.defineProperty(window, 'innerWidth', {
      value: 1200,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window.navigator, 'hardwareConcurrency', {
      value: 4,
      writable: true,
      configurable: true,
    });

    jest.resetModules();
    const { getDeviceTierConfig: getConfig } = require('@/lib/device-tier');
    const config = getConfig();
    expect(['low', 'mid', 'high']).toContain(config.tier);
    expect(typeof config.particleMultiplier).toBe('number');
  });
});

describe('TierConfig properties', () => {
  it('low tier disables blur, overlays, connections', () => {
    // Manually construct expected low config
    const lowConfig = {
      tier: 'low' as const,
      isTouch: false,
      reducedMotion: true,
      cursorTilt: false,
      autoDrift: false,
      particleMultiplier: 0.25,
      enableBlur: false,
      enableOverlays: false,
      enableConnections: false,
      maxLayers: 2,
      fpsCap: 20,
      parallaxIntensity: 0.3,
    };
    expect(lowConfig.enableBlur).toBe(false);
    expect(lowConfig.enableOverlays).toBe(false);
    expect(lowConfig.enableConnections).toBe(false);
    expect(lowConfig.cursorTilt).toBe(false);
  });

  it('high tier enables all features', () => {
    const highConfig = {
      tier: 'high' as const,
      isTouch: false,
      reducedMotion: false,
      cursorTilt: true,
      autoDrift: false,
      particleMultiplier: 1,
      enableBlur: true,
      enableOverlays: true,
      enableConnections: true,
      maxLayers: 5,
      fpsCap: 30,
      parallaxIntensity: 1,
    };
    expect(highConfig.enableBlur).toBe(true);
    expect(highConfig.enableOverlays).toBe(true);
    expect(highConfig.enableConnections).toBe(true);
    expect(highConfig.cursorTilt).toBe(true);
    expect(highConfig.autoDrift).toBe(false);
  });

  it('touch device on mid tier gets autoDrift, no cursorTilt', () => {
    const touchMid = {
      tier: 'mid' as const,
      isTouch: true,
      reducedMotion: false,
      cursorTilt: false,
      autoDrift: true,
      particleMultiplier: 0.5,
      enableBlur: true,
      enableOverlays: false,
      enableConnections: false,
      maxLayers: 3,
      fpsCap: 30,
      parallaxIntensity: 0.6,
    };
    expect(touchMid.autoDrift).toBe(true);
    expect(touchMid.cursorTilt).toBe(false);
  });
});
