/**
 * FormaOS Theme Utilities
 *
 * WCAG contrast validation, color parsing, theme auditing, and
 * hardcoded-color detection helpers.
 */

// ---------------------------------------------------------------------------
// Color parsing
// ---------------------------------------------------------------------------

/** Parse a hex string (#RGB, #RRGGBB, #RRGGBBAA) to [r, g, b]. */
export function hexToRgb(hex: string): [number, number, number] | null {
  const h = hex.replace('#', '');
  if (h.length === 3) {
    return [
      parseInt(h[0] + h[0], 16),
      parseInt(h[1] + h[1], 16),
      parseInt(h[2] + h[2], 16),
    ];
  }
  if (h.length >= 6) {
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
    ];
  }
  return null;
}

/** Convert an HSL string "H S% L%" to approximate [r, g, b]. */
export function hslToRgb(hsl: string): [number, number, number] | null {
  const parts = hsl.match(/([\d.]+)/g);
  if (!parts || parts.length < 3) return null;
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, h) * 255),
    Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  ];
}

// ---------------------------------------------------------------------------
// WCAG contrast
// ---------------------------------------------------------------------------

/** Relative luminance per WCAG 2.1. */
function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * WCAG 2.1 contrast ratio between two colors.
 * Each color is [r, g, b] in 0-255 range.
 * Returns value between 1 (identical) and 21 (max contrast).
 */
export function contrastRatio(
  fg: [number, number, number],
  bg: [number, number, number],
): number {
  const l1 = relativeLuminance(...fg);
  const l2 = relativeLuminance(...bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG AA requires ≥ 4.5 for normal text, ≥ 3.0 for large text. */
export function meetsWcagAA(
  ratio: number,
  size: 'normal' | 'large' = 'normal',
): boolean {
  return size === 'large' ? ratio >= 3.0 : ratio >= 4.5;
}

/** WCAG AAA requires ≥ 7.0 for normal text, ≥ 4.5 for large text. */
export function meetsWcagAAA(
  ratio: number,
  size: 'normal' | 'large' = 'normal',
): boolean {
  return size === 'large' ? ratio >= 4.5 : ratio >= 7.0;
}

// ---------------------------------------------------------------------------
// Theme token validation
// ---------------------------------------------------------------------------

export interface ContrastResult {
  pair: string;
  fgToken: string;
  bgToken: string;
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
}

/**
 * Validate critical text/background contrast pairs for a set of HSL tokens.
 */
export function validateThemeContrast(tokens: {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  mutedForeground: string;
  primary: string;
  primaryForeground: string;
}): ContrastResult[] {
  const pairs: [string, string, string][] = [
    ['Text on Background', tokens.foreground, tokens.background],
    ['Text on Card', tokens.cardForeground, tokens.card],
    ['Muted on Background', tokens.mutedForeground, tokens.background],
    ['Muted on Card', tokens.mutedForeground, tokens.card],
    ['Primary text on Primary', tokens.primaryForeground, tokens.primary],
  ];

  return pairs.map(([label, fgHsl, bgHsl]) => {
    const fg = hslToRgb(fgHsl);
    const bg = hslToRgb(bgHsl);
    if (!fg || !bg)
      return {
        pair: label,
        fgToken: fgHsl,
        bgToken: bgHsl,
        ratio: 0,
        passAA: false,
        passAAA: false,
      };
    const ratio = contrastRatio(fg, bg);
    return {
      pair: label,
      fgToken: fgHsl,
      bgToken: bgHsl,
      ratio: Math.round(ratio * 100) / 100,
      passAA: meetsWcagAA(ratio),
      passAAA: meetsWcagAAA(ratio),
    };
  });
}

// ---------------------------------------------------------------------------
// Chart / data viz color palette per theme
// ---------------------------------------------------------------------------

export interface ChartPalette {
  /** Dataset colors (ordered). */
  series: string[];
  /** Grid line color. */
  grid: string;
  /** Axis label color. */
  label: string;
  /** Tooltip background. */
  tooltipBg: string;
  /** Tooltip text. */
  tooltipText: string;
}

/**
 * Returns a chart palette derived from theme tokens.
 * Works with Chart.js, Recharts, or any visualization lib.
 */
export function getChartPalette(isDark: boolean): ChartPalette {
  return {
    series: [
      '#22D3EE', // cyan
      '#8B5CF6', // violet
      '#3B82F6', // blue
      '#10B981', // emerald
      '#F59E0B', // amber
      '#F43F5E', // rose
      '#06B6D4', // teal
      '#A78BFA', // lavender
    ],
    grid: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    label: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
    tooltipBg: isDark ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.95)',
    tooltipText: isDark ? '#E5E7EB' : '#0F172A',
  };
}

// ---------------------------------------------------------------------------
// System preference detection (runs client-side only)
// ---------------------------------------------------------------------------

/** Returns the user's OS-level color scheme preference. */
export function getSystemColorScheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
}

/**
 * Map system preference to a FormaOS theme.
 * 'dark system' → 'dark', 'light system' → 'light'.
 */
export function systemThemeId(): 'dark' | 'light' {
  return getSystemColorScheme() === 'light' ? 'light' : 'dark';
}
