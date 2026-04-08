/**
 * Tests for lib/theme/theme-utils.ts
 * Covers: hexToRgb, hslToRgb, contrastRatio, meetsWcagAA/AAA,
 *         validateThemeContrast, getChartPalette, getSystemColorScheme, systemThemeId
 */

import {
  hexToRgb,
  hslToRgb,
  contrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
  validateThemeContrast,
  getChartPalette,
  getSystemColorScheme,
  systemThemeId,
} from '@/lib/theme/theme-utils';

describe('hexToRgb', () => {
  it('parses 3-char hex', () => {
    expect(hexToRgb('#FFF')).toEqual([255, 255, 255]);
    expect(hexToRgb('#000')).toEqual([0, 0, 0]);
    expect(hexToRgb('#F00')).toEqual([255, 0, 0]);
  });

  it('parses 6-char hex', () => {
    expect(hexToRgb('#FF0000')).toEqual([255, 0, 0]);
    expect(hexToRgb('#00FF00')).toEqual([0, 255, 0]);
    expect(hexToRgb('#0000FF')).toEqual([0, 0, 255]);
    expect(hexToRgb('#1A2B3C')).toEqual([26, 43, 60]);
  });

  it('parses 8-char hex (with alpha)', () => {
    expect(hexToRgb('#FF000080')).toEqual([255, 0, 0]);
  });

  it('handles without hash', () => {
    expect(hexToRgb('FF0000')).toEqual([255, 0, 0]);
  });

  it('returns null for invalid lengths', () => {
    expect(hexToRgb('#AB')).toBeNull();
    expect(hexToRgb('#A')).toBeNull();
    expect(hexToRgb('#ABCD')).toBeNull();
  });
});

describe('hslToRgb', () => {
  it('parses achromatic (s=0)', () => {
    const result = hslToRgb('0 0% 50%');
    expect(result).toEqual([128, 128, 128]);
  });

  it('parses chromatic colors', () => {
    // Red: 0 100% 50%
    const red = hslToRgb('0 100% 50%');
    expect(red).toBeTruthy();
    expect(red![0]).toBeGreaterThan(200); // r should be high

    // Blue: 240 100% 50%
    const blue = hslToRgb('240 100% 50%');
    expect(blue).toBeTruthy();
    expect(blue![2]).toBeGreaterThan(200); // b should be high
  });

  it('handles lightness < 0.5', () => {
    const dark = hslToRgb('120 50% 25%');
    expect(dark).toBeTruthy();
  });

  it('handles lightness >= 0.5', () => {
    const light = hslToRgb('120 50% 75%');
    expect(light).toBeTruthy();
  });

  it('exercises all hue2rgb branches via different hue angles', () => {
    // Various hue angles to hit all branches in hue2rgb
    expect(hslToRgb('30 100% 50%')).toBeTruthy(); // t < 1/6 for some channels
    expect(hslToRgb('180 100% 50%')).toBeTruthy(); // t < 1/2
    expect(hslToRgb('300 100% 50%')).toBeTruthy(); // t < 2/3
    expect(hslToRgb('60 100% 50%')).toBeTruthy(); // remaining branch
  });

  it('returns null for invalid input', () => {
    expect(hslToRgb('abc')).toBeNull();
    expect(hslToRgb('')).toBeNull();
    expect(hslToRgb('50')).toBeNull();
  });
});

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    const ratio = contrastRatio([0, 0, 0], [255, 255, 255]);
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('returns 1 for same colors', () => {
    const ratio = contrastRatio([128, 128, 128], [128, 128, 128]);
    expect(ratio).toBeCloseTo(1, 1);
  });

  it('handles sRGB linearization threshold (0.03928)', () => {
    // Low values go through s/12.92 path
    const ratio = contrastRatio([5, 5, 5], [250, 250, 250]);
    expect(ratio).toBeGreaterThan(1);
    // High values go through pow path
    const ratio2 = contrastRatio([100, 100, 100], [200, 200, 200]);
    expect(ratio2).toBeGreaterThan(1);
  });
});

describe('meetsWcagAA', () => {
  it('returns true >= 4.5 for normal text', () => {
    expect(meetsWcagAA(4.5)).toBe(true);
    expect(meetsWcagAA(5)).toBe(true);
  });

  it('returns false < 4.5 for normal text', () => {
    expect(meetsWcagAA(4.4)).toBe(false);
  });

  it('returns true >= 3.0 for large text', () => {
    expect(meetsWcagAA(3.0, 'large')).toBe(true);
  });

  it('returns false < 3.0 for large text', () => {
    expect(meetsWcagAA(2.9, 'large')).toBe(false);
  });

  it('uses normal as default size', () => {
    expect(meetsWcagAA(4.5)).toBe(true);
    expect(meetsWcagAA(3.5)).toBe(false);
  });
});

describe('meetsWcagAAA', () => {
  it('returns true >= 7.0 for normal text', () => {
    expect(meetsWcagAAA(7.0)).toBe(true);
  });

  it('returns false < 7.0 for normal text', () => {
    expect(meetsWcagAAA(6.9)).toBe(false);
  });

  it('returns true >= 4.5 for large text', () => {
    expect(meetsWcagAAA(4.5, 'large')).toBe(true);
  });

  it('returns false < 4.5 for large text', () => {
    expect(meetsWcagAAA(4.4, 'large')).toBe(false);
  });
});

describe('validateThemeContrast', () => {
  it('validates valid theme tokens', () => {
    const results = validateThemeContrast({
      background: '0 0% 100%',
      foreground: '0 0% 0%',
      card: '0 0% 100%',
      cardForeground: '0 0% 0%',
      mutedForeground: '0 0% 40%',
      primary: '220 80% 50%',
      primaryForeground: '0 0% 100%',
    });
    expect(results).toHaveLength(5);
    results.forEach((r) => {
      expect(r.ratio).toBeGreaterThan(0);
      expect(typeof r.passAA).toBe('boolean');
      expect(typeof r.passAAA).toBe('boolean');
    });
  });

  it('returns ratio 0 for invalid HSL tokens', () => {
    const results = validateThemeContrast({
      background: 'invalid',
      foreground: 'also-invalid',
      card: 'bad',
      cardForeground: 'bad',
      mutedForeground: 'bad',
      primary: 'bad',
      primaryForeground: 'bad',
    });
    results.forEach((r) => {
      expect(r.ratio).toBe(0);
      expect(r.passAA).toBe(false);
      expect(r.passAAA).toBe(false);
    });
  });

  it('handles mixed valid/invalid tokens', () => {
    const results = validateThemeContrast({
      background: '0 0% 100%',
      foreground: 'invalid',
      card: '0 0% 100%',
      cardForeground: '0 0% 0%',
      mutedForeground: '0 0% 40%',
      primary: 'invalid',
      primaryForeground: '0 0% 100%',
    });
    // "Text on Background" should have invalid fg
    expect(results[0].ratio).toBe(0);
    // "Text on Card" should be valid
    expect(results[1].ratio).toBeGreaterThan(0);
  });
});

describe('getChartPalette', () => {
  it('returns dark palette', () => {
    const palette = getChartPalette(true);
    expect(palette.series).toHaveLength(8);
    expect(palette.grid).toContain('255');
    expect(palette.tooltipBg).toContain('17,24,39');
  });

  it('returns light palette', () => {
    const palette = getChartPalette(false);
    expect(palette.grid).toContain('0,0,0');
    expect(palette.tooltipText).toBe('#0F172A');
  });
});

describe('getSystemColorScheme', () => {
  it('returns light when matchMedia matches light scheme', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = jest.fn().mockReturnValue({ matches: true }) as any;
    expect(getSystemColorScheme()).toBe('light');
    window.matchMedia = originalMatchMedia;
  });

  it('returns dark when matchMedia does not match light scheme', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = jest.fn().mockReturnValue({ matches: false }) as any;
    expect(getSystemColorScheme()).toBe('dark');
    window.matchMedia = originalMatchMedia;
  });
});

describe('systemThemeId', () => {
  it('returns dark or light based on system preference', () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = jest.fn().mockReturnValue({ matches: false }) as any;
    const result = systemThemeId();
    expect(['dark', 'light']).toContain(result);
    window.matchMedia = originalMatchMedia;
  });
});
