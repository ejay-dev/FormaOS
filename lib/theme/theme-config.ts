/**
 * FormaOS Enterprise Theme Configuration
 *
 * Central definition of every theme — tokens, metadata, and display info.
 * This is the single source of truth consumed by the provider, switcher,
 * settings page, and WCAG validation utilities.
 */

import type { ThemeId, ThemeTokens } from './theme-tokens';

// ---------------------------------------------------------------------------
// Theme metadata
// ---------------------------------------------------------------------------

export interface ThemeMeta {
  id: ThemeId;
  label: string;
  description: string;
  /** Representative hex swatch for previews. */
  swatch: string;
  isDark: boolean;
  /** CSS color-scheme value. */
  colorScheme: 'dark' | 'light';
}

// ---------------------------------------------------------------------------
// Status tokens shared by all themes (can be overridden per-theme)
// ---------------------------------------------------------------------------

const SHARED_STATUS_TOKENS = {
  success: '142 76% 36%',
  successForeground: '0 0% 100%',
  warning: '38 92% 50%',
  warningForeground: '0 0% 0%',
  info: '213 100% 60%',
  infoForeground: '0 0% 100%',
} as const;

// ---------------------------------------------------------------------------
// 1. FormaOS Dark (Default)
// ---------------------------------------------------------------------------

const darkTokens: ThemeTokens = {
  // Core surfaces — #050816, #0E1720, #111827
  background: '232 65% 5%',
  foreground: '220 18% 92%',
  card: '225 38% 12%',
  cardForeground: '220 18% 92%',
  popover: '228 48% 8%',
  popoverForeground: '220 18% 92%',

  // Brand — cyan #22D3EE, violet #8B5CF6
  primary: '189 94% 53%',
  primaryForeground: '232 65% 5%',
  secondary: '258 90% 66%',
  secondaryForeground: '220 18% 92%',

  // Utility
  muted: '225 30% 18%',
  mutedForeground: '215 16% 65%',
  accent: '258 90% 66%',
  accentForeground: '220 18% 92%',
  destructive: '0 85% 58%',
  destructiveForeground: '220 18% 92%',

  // Chrome
  border: '224 22% 17%',
  input: '228 48% 8%',
  ring: '189 94% 53%',

  // Sidebar
  sidebar: '228 42% 6%',
  sidebarForeground: '220 18% 92%',
  sidebarPrimary: '189 94% 53%',
  sidebarPrimaryForeground: '232 65% 5%',
  sidebarAccent: '228 40% 12%',
  sidebarAccentForeground: '220 18% 92%',
  sidebarBorder: '224 22% 14%',
  sidebarRing: '189 94% 53%',

  // Glass — cyan-shifted white overlay
  glassBg: 'rgba(255, 255, 255, 0.045)',
  glassBgStrong: 'rgba(255, 255, 255, 0.09)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.20)',

  // Shadows — deep space depth with brand-tinted layers
  shadowSm: '0 2px 6px rgba(0, 0, 0, 0.45), 0 1px 3px rgba(34, 211, 238, 0.04)',
  shadowMd:
    '0 4px 14px rgba(0, 0, 0, 0.55), 0 2px 6px rgba(34, 211, 238, 0.05)',
  shadowLg:
    '0 8px 28px rgba(0, 0, 0, 0.65), 0 4px 10px rgba(34, 211, 238, 0.06)',
  shadowXl:
    '0 16px 48px rgba(0, 0, 0, 0.75), 0 6px 14px rgba(34, 211, 238, 0.05)',
  shadow2xl:
    '0 24px 64px rgba(0, 0, 0, 0.85), 0 10px 20px rgba(34, 211, 238, 0.06)',

  // Glows — vivid neon energy
  glowCyan: '0 0 28px rgba(34, 211, 238, 0.35)',
  glowBlue: '0 0 28px rgba(59, 130, 246, 0.3)',
  glowViolet: '0 0 28px rgba(139, 92, 246, 0.35)',

  // Gradients
  gradientPrimary:
    'linear-gradient(135deg, #22D3EE 0%, #3B82F6 45%, #8B5CF6 100%)',
  gradientSurface:
    'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.015) 100%)',
  gradientGlow:
    'radial-gradient(ellipse at top, rgba(34, 211, 238, 0.14) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 75%)',

  ...SHARED_STATUS_TOKENS,
};

// ---------------------------------------------------------------------------
// 2. Midnight Blue — Corporate enterprise SaaS
// ---------------------------------------------------------------------------

const midnightBlueTokens: ThemeTokens = {
  // Core surfaces — #08102A, #0E1A42, #162550
  background: '228 65% 10%',
  foreground: '214 40% 93%',
  card: '224 52% 17%',
  cardForeground: '214 40% 93%',
  popover: '226 58% 13%',
  popoverForeground: '214 40% 93%',

  // Brand — blue #3B82F6, teal #2DD4BF
  primary: '217 91% 60%',
  primaryForeground: '228 65% 10%',
  secondary: '174 72% 51%',
  secondaryForeground: '214 40% 93%',

  // Utility
  muted: '224 38% 16%',
  mutedForeground: '218 18% 60%',
  accent: '174 72% 51%',
  accentForeground: '228 65% 10%',
  destructive: '0 80% 55%',
  destructiveForeground: '214 40% 93%',

  // Chrome
  border: '224 28% 18%',
  input: '226 50% 12%',
  ring: '217 91% 60%',

  // Sidebar
  sidebar: '228 62% 7%',
  sidebarForeground: '214 40% 93%',
  sidebarPrimary: '217 91% 60%',
  sidebarPrimaryForeground: '228 65% 10%',
  sidebarAccent: '224 42% 14%',
  sidebarAccentForeground: '214 40% 93%',
  sidebarBorder: '224 28% 15%',
  sidebarRing: '217 91% 60%',

  // Glass — moonlit blue-tinted
  glassBg: 'rgba(100, 160, 255, 0.04)',
  glassBgStrong: 'rgba(100, 160, 255, 0.08)',
  glassBorder: 'rgba(140, 180, 255, 0.12)',
  glassBorderStrong: 'rgba(140, 180, 255, 0.20)',

  // Shadows — deep azure
  shadowSm: '0 2px 6px rgba(4, 8, 30, 0.5), 0 1px 3px rgba(59, 130, 246, 0.06)',
  shadowMd:
    '0 4px 12px rgba(4, 8, 30, 0.55), 0 2px 6px rgba(59, 130, 246, 0.08)',
  shadowLg:
    '0 8px 28px rgba(4, 8, 30, 0.6), 0 4px 10px rgba(59, 130, 246, 0.1)',
  shadowXl:
    '0 16px 48px rgba(4, 8, 30, 0.7), 0 8px 16px rgba(59, 130, 246, 0.08)',
  shadow2xl:
    '0 24px 64px rgba(4, 8, 30, 0.8), 0 12px 24px rgba(59, 130, 246, 0.1)',

  // Glows — blue-family spectrum
  glowCyan: '0 0 28px rgba(56, 189, 248, 0.3)',
  glowBlue: '0 0 28px rgba(59, 130, 246, 0.35)',
  glowViolet: '0 0 24px rgba(99, 102, 241, 0.3)',

  // Gradients
  gradientPrimary:
    'linear-gradient(135deg, #38BDF8 0%, #3B82F6 40%, #6366F1 100%)',
  gradientSurface:
    'linear-gradient(180deg, rgba(100, 160, 255, 0.05) 0%, rgba(100, 160, 255, 0.015) 100%)',
  gradientGlow:
    'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.14) 0%, rgba(45, 212, 191, 0.04) 50%, transparent 75%)',

  ...SHARED_STATUS_TOKENS,
};

// ---------------------------------------------------------------------------
// 3. Graphite — Minimal Executive
// ---------------------------------------------------------------------------

const graphiteTokens: ThemeTokens = {
  // Core surfaces — warm charcoal #0D0D0F, #171719, #212124
  background: '240 4% 5%',
  foreground: '240 5% 93%',
  card: '240 3% 13%',
  cardForeground: '240 5% 93%',
  popover: '240 3% 10%',
  popoverForeground: '240 5% 93%',

  // Brand — violet #A78BFA, teal #2DD4BF
  primary: '255 92% 76%',
  primaryForeground: '240 4% 5%',
  secondary: '174 72% 51%',
  secondaryForeground: '240 4% 5%',

  // Utility
  muted: '240 3% 17%',
  mutedForeground: '240 3% 52%',
  accent: '174 72% 51%',
  accentForeground: '240 4% 5%',
  destructive: '0 65% 52%',
  destructiveForeground: '240 5% 93%',

  // Chrome — warm-tinted
  border: '240 3% 16%',
  input: '240 3% 10%',
  ring: '255 92% 76%',

  // Sidebar — matte charcoal dock
  sidebar: '240 4% 6%',
  sidebarForeground: '240 5% 93%',
  sidebarPrimary: '255 92% 76%',
  sidebarPrimaryForeground: '240 4% 5%',
  sidebarAccent: '240 3% 14%',
  sidebarAccentForeground: '240 5% 93%',
  sidebarBorder: '240 3% 13%',
  sidebarRing: '255 92% 76%',

  // Glass — warm-neutral frosted
  glassBg: 'rgba(255, 255, 255, 0.035)',
  glassBgStrong: 'rgba(255, 255, 255, 0.07)',
  glassBorder: 'rgba(255, 255, 255, 0.09)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.16)',

  // Shadows — ultra-soft matte finish
  shadowSm: '0 1px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
  shadowMd: '0 2px 8px rgba(0, 0, 0, 0.35), 0 4px 14px rgba(0, 0, 0, 0.25)',
  shadowLg: '0 4px 12px rgba(0, 0, 0, 0.3), 0 16px 36px rgba(0, 0, 0, 0.35)',
  shadowXl: '0 8px 20px rgba(0, 0, 0, 0.3), 0 24px 48px rgba(0, 0, 0, 0.4)',
  shadow2xl: '0 12px 28px rgba(0, 0, 0, 0.3), 0 40px 72px rgba(0, 0, 0, 0.45)',

  // Glows — restrained executive
  glowCyan: '0 0 20px rgba(45, 212, 191, 0.12)',
  glowBlue: '0 0 20px rgba(59, 130, 246, 0.12)',
  glowViolet: '0 0 22px rgba(167, 139, 250, 0.18)',

  // Gradients — violet → emerald sophistication
  gradientPrimary:
    'linear-gradient(135deg, #A78BFA 0%, #818CF8 40%, #2DD4BF 100%)',
  gradientSurface:
    'linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.01) 100%)',
  gradientGlow:
    'radial-gradient(ellipse at top, rgba(167, 139, 250, 0.07) 0%, rgba(45, 212, 191, 0.03) 50%, transparent 75%)',

  ...SHARED_STATUS_TOKENS,
};

// ---------------------------------------------------------------------------
// 4. Light Enterprise — Clean SaaS light mode
// ---------------------------------------------------------------------------

const lightTokens: ThemeTokens = {
  // Core surfaces — warm pearl #F0F1F5, white, #E8E9EE
  background: '230 16% 95%',
  foreground: '224 71% 4%',
  card: '0 0% 100%',
  cardForeground: '224 71% 4%',
  popover: '0 0% 100%',
  popoverForeground: '224 71% 4%',

  // Brand — indigo #4338CA, violet #7C3AED
  primary: '243 75% 51%',
  primaryForeground: '0 0% 100%',
  secondary: '228 20% 92%',
  secondaryForeground: '224 50% 18%',

  // Utility
  muted: '228 14% 91%',
  mutedForeground: '220 9% 46%',
  accent: '263 70% 50%',
  accentForeground: '0 0% 100%',
  destructive: '0 72% 51%',
  destructiveForeground: '0 0% 100%',

  // Chrome
  border: '224 16% 85%',
  input: '228 14% 95%',
  ring: '243 75% 51%',

  // Sidebar
  sidebar: '225 20% 93%',
  sidebarForeground: '224 71% 4%',
  sidebarPrimary: '243 75% 51%',
  sidebarPrimaryForeground: '0 0% 100%',
  sidebarAccent: '228 22% 89%',
  sidebarAccentForeground: '224 50% 18%',
  sidebarBorder: '224 16% 85%',
  sidebarRing: '243 75% 51%',

  // Glass — warm white with backdrop blur
  glassBg: 'rgba(255, 255, 255, 0.82)',
  glassBgStrong: 'rgba(255, 255, 255, 0.94)',
  glassBorder: 'rgba(15, 23, 42, 0.08)',
  glassBorderStrong: 'rgba(15, 23, 42, 0.14)',

  // Shadows — layered blue-tinted with brand accent
  shadowSm:
    '0 1px 2px rgba(15, 23, 42, 0.05), 0 1px 3px rgba(15, 23, 42, 0.08)',
  shadowMd:
    '0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 12px rgba(15, 23, 42, 0.07), 0 2px 4px rgba(67, 56, 202, 0.03)',
  shadowLg:
    '0 2px 4px rgba(15, 23, 42, 0.04), 0 12px 28px rgba(15, 23, 42, 0.1), 0 4px 8px rgba(67, 56, 202, 0.04)',
  shadowXl:
    '0 4px 8px rgba(15, 23, 42, 0.04), 0 24px 48px rgba(15, 23, 42, 0.1), 0 8px 16px rgba(67, 56, 202, 0.05)',
  shadow2xl:
    '0 8px 16px rgba(15, 23, 42, 0.05), 0 40px 80px rgba(15, 23, 42, 0.12), 0 16px 32px rgba(67, 56, 202, 0.06)',

  // Glows — brand-tinted for interactive feedback
  glowCyan: '0 0 20px rgba(34, 211, 238, 0.2)',
  glowBlue: '0 0 20px rgba(67, 56, 202, 0.2)',
  glowViolet: '0 0 20px rgba(124, 58, 237, 0.2)',

  // Gradients — richer indigo-violet energy
  gradientPrimary:
    'linear-gradient(135deg, #4338CA 0%, #6D28D9 50%, #7C3AED 100%)',
  gradientSurface:
    'linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(240, 241, 245, 0.7) 100%)',
  gradientGlow:
    'radial-gradient(ellipse at top, rgba(67, 56, 202, 0.06) 0%, rgba(124, 58, 237, 0.03) 40%, transparent 70%)',

  // Status — themed for light mode
  success: '160 84% 39%',
  successForeground: '0 0% 100%',
  warning: '38 92% 50%',
  warningForeground: '0 0% 0%',
  info: '243 75% 51%',
  infoForeground: '0 0% 100%',
};

// ---------------------------------------------------------------------------
// 5. Aurora — Premium Futuristic Tech
// ---------------------------------------------------------------------------

const auroraTokens: ThemeTokens = {
  // Core surfaces — deep void #010515, #0C1631, #111D3A
  background: '230 85% 4%',
  foreground: '220 20% 92%',
  card: '224 42% 13%',
  cardForeground: '220 20% 92%',
  popover: '226 48% 10%',
  popoverForeground: '220 20% 92%',

  // Brand — cyan #22D3EE, magenta #D946EF
  primary: '189 94% 53%',
  primaryForeground: '230 85% 4%',
  secondary: '292 84% 61%',
  secondaryForeground: '220 20% 92%',

  // Utility
  muted: '228 22% 14%',
  mutedForeground: '228 14% 52%',
  accent: '292 84% 61%',
  accentForeground: '230 85% 4%',
  destructive: '350 80% 55%',
  destructiveForeground: '220 20% 92%',

  // Chrome
  border: '228 20% 16%',
  input: '228 35% 10%',
  ring: '189 94% 53%',

  // Sidebar — void-level dark
  sidebar: '230 80% 5%',
  sidebarForeground: '220 20% 92%',
  sidebarPrimary: '189 94% 53%',
  sidebarPrimaryForeground: '230 85% 4%',
  sidebarAccent: '228 32% 12%',
  sidebarAccentForeground: '220 20% 92%',
  sidebarBorder: '228 20% 13%',
  sidebarRing: '189 94% 53%',

  // Glass — aurora-tinted with cyan shimmer
  glassBg: 'rgba(34, 211, 238, 0.04)',
  glassBgStrong: 'rgba(34, 211, 238, 0.08)',
  glassBorder: 'rgba(34, 211, 238, 0.12)',
  glassBorderStrong: 'rgba(34, 211, 238, 0.22)',

  // Shadows — void-depth with aurora edge glow
  shadowSm: '0 2px 6px rgba(1, 5, 21, 0.5), 0 1px 3px rgba(34, 211, 238, 0.04)',
  shadowMd:
    '0 4px 14px rgba(1, 5, 21, 0.6), 0 2px 6px rgba(34, 211, 238, 0.06)',
  shadowLg:
    '0 8px 28px rgba(1, 5, 21, 0.7), 0 4px 10px rgba(34, 211, 238, 0.08)',
  shadowXl:
    '0 16px 48px rgba(1, 5, 21, 0.8), 0 8px 16px rgba(34, 211, 238, 0.06)',
  shadow2xl:
    '0 24px 64px rgba(1, 5, 21, 0.85), 0 12px 24px rgba(34, 211, 238, 0.08)',

  // Glows — vivid dual-hue aurora
  glowCyan: '0 0 28px rgba(34, 211, 238, 0.35)',
  glowBlue: '0 0 28px rgba(96, 165, 250, 0.3)',
  glowViolet: '0 0 28px rgba(217, 70, 239, 0.35)',

  // Gradients — signature dual-hue aurora sweep
  gradientPrimary:
    'linear-gradient(135deg, #22D3EE 0%, #8B5CF6 45%, #D946EF 100%)',
  gradientSurface:
    'linear-gradient(180deg, rgba(34, 211, 238, 0.05) 0%, rgba(217, 70, 239, 0.025) 100%)',
  gradientGlow:
    'radial-gradient(ellipse at top, rgba(34, 211, 238, 0.15) 0%, rgba(139, 92, 246, 0.08) 35%, rgba(217, 70, 239, 0.04) 60%, transparent 80%)',

  ...SHARED_STATUS_TOKENS,
};

// ---------------------------------------------------------------------------
// Theme registry
// ---------------------------------------------------------------------------

export interface ThemeDefinition {
  meta: ThemeMeta;
  tokens: ThemeTokens;
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  dark: {
    meta: {
      id: 'dark',
      label: 'FormaOS Dark',
      description: 'Deep space cyber — cyan & violet energy on dark canvas',
      swatch: '#050816',
      isDark: true,
      colorScheme: 'dark',
    },
    tokens: darkTokens,
  },
  'midnight-blue': {
    meta: {
      id: 'midnight-blue',
      label: 'Midnight Blue',
      description: 'Corporate navy — layered depth with moonlit glass',
      swatch: '#08102A',
      isDark: true,
      colorScheme: 'dark',
    },
    tokens: midnightBlueTokens,
  },
  graphite: {
    meta: {
      id: 'graphite',
      label: 'Graphite',
      description: 'Warm charcoal studio — quiet authority, zero fatigue',
      swatch: '#0D0D0F',
      isDark: true,
      colorScheme: 'dark',
    },
    tokens: graphiteTokens,
  },
  light: {
    meta: {
      id: 'light',
      label: 'Light Enterprise',
      description: 'Pearl canvas with elevated white cards and indigo energy',
      swatch: '#F0F1F5',
      isDark: false,
      colorScheme: 'light',
    },
    tokens: lightTokens,
  },
  aurora: {
    meta: {
      id: 'aurora',
      label: 'Aurora',
      description: 'Abyssal void with vivid cyan, violet & magenta aurora glow',
      swatch: '#010515',
      isDark: true,
      colorScheme: 'dark',
    },
    tokens: auroraTokens,
  },
};

/** Ordered list of theme IDs for iteration (matches THEME_IDS). */
export const THEME_LIST: ThemeDefinition[] = [
  THEMES.dark,
  THEMES['midnight-blue'],
  THEMES.graphite,
  THEMES.light,
  THEMES.aurora,
];

/** Quick lookup: id → ThemeMeta */
export const THEME_META: Record<ThemeId, ThemeMeta> = Object.fromEntries(
  Object.entries(THEMES).map(([id, def]) => [id, def.meta]),
) as Record<ThemeId, ThemeMeta>;
