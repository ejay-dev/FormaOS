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
  // Core surfaces — #050816, #0B1020, #111827
  background: '232 65% 5%',
  foreground: '220 14% 91%',
  card: '221 39% 11%',
  cardForeground: '220 14% 91%',
  popover: '224 50% 8%',
  popoverForeground: '220 14% 91%',

  // Brand — cyan #22D3EE, violet #8B5CF6
  primary: '189 94% 53%',
  primaryForeground: '232 65% 5%',
  secondary: '258 90% 66%',
  secondaryForeground: '220 14% 91%',

  // Utility
  muted: '225 30% 18%',
  mutedForeground: '215 16% 65%',
  accent: '258 90% 66%',
  accentForeground: '220 14% 91%',
  destructive: '0 85% 58%',
  destructiveForeground: '220 14% 91%',

  // Chrome
  border: '220 20% 16%',
  input: '224 50% 8%',
  ring: '189 94% 53%',

  // Sidebar
  sidebar: '228 40% 6%',
  sidebarForeground: '220 14% 91%',
  sidebarPrimary: '189 94% 53%',
  sidebarPrimaryForeground: '232 65% 5%',
  sidebarAccent: '228 40% 12%',
  sidebarAccentForeground: '220 14% 91%',
  sidebarBorder: '220 20% 14%',
  sidebarRing: '189 94% 53%',

  // Glass — white overlay on dark
  glassBg: 'rgba(255, 255, 255, 0.04)',
  glassBgStrong: 'rgba(255, 255, 255, 0.08)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.18)',

  // Shadows
  shadowSm: '0 2px 8px rgba(0, 0, 0, 0.5)',
  shadowMd: '0 4px 16px rgba(0, 0, 0, 0.6)',
  shadowLg: '0 8px 32px rgba(0, 0, 0, 0.7)',
  shadowXl: '0 16px 48px rgba(0, 0, 0, 0.8)',
  shadow2xl: '0 24px 64px rgba(0, 0, 0, 0.85)',

  // Glows
  glowCyan: '0 0 24px rgba(34, 211, 238, 0.3)',
  glowBlue: '0 0 24px rgba(59, 130, 246, 0.3)',
  glowViolet: '0 0 24px rgba(139, 92, 246, 0.3)',

  // Gradients
  gradientPrimary:
    'linear-gradient(135deg, #22D3EE 0%, #3B82F6 50%, #8B5CF6 100%)',
  gradientSurface:
    'linear-gradient(180deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
  gradientGlow:
    'radial-gradient(ellipse at top, rgba(34, 211, 238, 0.12) 0%, transparent 65%)',

  ...SHARED_STATUS_TOKENS,
};

// ---------------------------------------------------------------------------
// 2. Midnight Blue — Corporate enterprise SaaS
// ---------------------------------------------------------------------------

const midnightBlueTokens: ThemeTokens = {
  // Core surfaces — #0A1128, #0F1C3F, #1B2A52
  background: '226 60% 10%',
  foreground: '214 32% 91%',
  card: '224 50% 21%',
  cardForeground: '214 32% 91%',
  popover: '224 62% 15%',
  popoverForeground: '214 32% 91%',

  // Brand — blue #3B82F6, sky #38BDF8
  primary: '217 91% 60%',
  primaryForeground: '226 60% 10%',
  secondary: '198 93% 60%',
  secondaryForeground: '214 32% 91%',

  // Utility
  muted: '224 35% 18%',
  mutedForeground: '218 15% 62%',
  accent: '198 93% 60%',
  accentForeground: '226 60% 10%',
  destructive: '0 80% 55%',
  destructiveForeground: '214 32% 91%',

  // Chrome
  border: '224 25% 16%',
  input: '224 50% 13%',
  ring: '217 91% 60%',

  // Sidebar
  sidebar: '226 55% 8%',
  sidebarForeground: '214 32% 91%',
  sidebarPrimary: '217 91% 60%',
  sidebarPrimaryForeground: '226 60% 10%',
  sidebarAccent: '224 40% 16%',
  sidebarAccentForeground: '214 32% 91%',
  sidebarBorder: '224 25% 14%',
  sidebarRing: '217 91% 60%',

  // Glass — blue-tinted
  glassBg: 'rgba(140, 180, 255, 0.03)',
  glassBgStrong: 'rgba(140, 180, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.10)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.16)',

  // Shadows
  shadowSm: '0 2px 8px rgba(0, 0, 0, 0.6)',
  shadowMd: '0 4px 16px rgba(0, 0, 0, 0.7)',
  shadowLg: '0 8px 32px rgba(0, 0, 0, 0.8)',
  shadowXl: '0 16px 48px rgba(0, 0, 0, 0.85)',
  shadow2xl: '0 24px 64px rgba(0, 0, 0, 0.9)',

  // Glows
  glowCyan: '0 0 24px rgba(56, 189, 248, 0.25)',
  glowBlue: '0 0 24px rgba(59, 130, 246, 0.3)',
  glowViolet: '0 0 24px rgba(139, 92, 246, 0.25)',

  // Gradients
  gradientPrimary:
    'linear-gradient(135deg, #38BDF8 0%, #3B82F6 50%, #6366F1 100%)',
  gradientSurface:
    'linear-gradient(180deg, rgba(140, 180, 255, 0.04) 0%, rgba(140, 180, 255, 0.01) 100%)',
  gradientGlow:
    'radial-gradient(ellipse at top, rgba(59, 130, 246, 0.1) 0%, transparent 65%)',

  ...SHARED_STATUS_TOKENS,
};

// ---------------------------------------------------------------------------
// 3. Graphite — Minimal Executive
// ---------------------------------------------------------------------------

const graphiteTokens: ThemeTokens = {
  // Core surfaces — #0B0B0B, #151515, #1E1E1E
  background: '0 0% 4%',
  foreground: '0 0% 93%',
  card: '0 0% 12%',
  cardForeground: '0 0% 93%',
  popover: '0 0% 10%',
  popoverForeground: '0 0% 93%',

  // Brand — violet #A78BFA, cyan #22D3EE
  primary: '255 92% 76%',
  primaryForeground: '0 0% 4%',
  secondary: '189 94% 53%',
  secondaryForeground: '0 0% 4%',

  // Utility
  muted: '0 0% 16%',
  mutedForeground: '0 0% 55%',
  accent: '189 94% 53%',
  accentForeground: '0 0% 4%',
  destructive: '0 65% 52%',
  destructiveForeground: '0 0% 93%',

  // Chrome
  border: '0 0% 14%',
  input: '0 0% 10%',
  ring: '255 92% 76%',

  // Sidebar
  sidebar: '0 0% 5%',
  sidebarForeground: '0 0% 93%',
  sidebarPrimary: '255 92% 76%',
  sidebarPrimaryForeground: '0 0% 4%',
  sidebarAccent: '0 0% 13%',
  sidebarAccentForeground: '0 0% 93%',
  sidebarBorder: '0 0% 12%',
  sidebarRing: '255 92% 76%',

  // Glass — neutral
  glassBg: 'rgba(255, 255, 255, 0.03)',
  glassBgStrong: 'rgba(255, 255, 255, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.08)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.14)',

  // Shadows — softer than other darks
  shadowSm: '0 2px 8px rgba(0, 0, 0, 0.45)',
  shadowMd: '0 4px 16px rgba(0, 0, 0, 0.55)',
  shadowLg: '0 8px 32px rgba(0, 0, 0, 0.65)',
  shadowXl: '0 16px 48px rgba(0, 0, 0, 0.75)',
  shadow2xl: '0 24px 64px rgba(0, 0, 0, 0.8)',

  // Glows — restrained
  glowCyan: '0 0 20px rgba(34, 211, 238, 0.15)',
  glowBlue: '0 0 20px rgba(59, 130, 246, 0.15)',
  glowViolet: '0 0 20px rgba(167, 139, 250, 0.2)',

  // Gradients
  gradientPrimary:
    'linear-gradient(135deg, #A78BFA 0%, #818CF8 50%, #22D3EE 100%)',
  gradientSurface:
    'linear-gradient(180deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.01) 100%)',
  gradientGlow:
    'radial-gradient(ellipse at top, rgba(167, 139, 250, 0.08) 0%, transparent 65%)',

  ...SHARED_STATUS_TOKENS,
};

// ---------------------------------------------------------------------------
// 4. Light Enterprise — Clean SaaS light mode
// ---------------------------------------------------------------------------

const lightTokens: ThemeTokens = {
  // Core surfaces — #F8FAFC, #FFFFFF, #F1F5F9
  background: '210 40% 98%',
  foreground: '222 47% 11%',
  card: '210 40% 96%',
  cardForeground: '222 47% 11%',
  popover: '0 0% 100%',
  popoverForeground: '222 47% 11%',

  // Brand — blue #2563EB, violet #7C3AED
  primary: '221 83% 53%',
  primaryForeground: '0 0% 100%',
  secondary: '210 40% 93%',
  secondaryForeground: '222 30% 15%',

  // Utility
  muted: '210 30% 93%',
  mutedForeground: '215 20% 40%',
  accent: '262 83% 58%',
  accentForeground: '0 0% 100%',
  destructive: '0 78% 50%',
  destructiveForeground: '0 0% 100%',

  // Chrome
  border: '214 20% 88%',
  input: '210 40% 96%',
  ring: '221 83% 53%',

  // Sidebar
  sidebar: '210 30% 95%',
  sidebarForeground: '222 47% 11%',
  sidebarPrimary: '221 83% 53%',
  sidebarPrimaryForeground: '0 0% 100%',
  sidebarAccent: '210 25% 91%',
  sidebarAccentForeground: '222 30% 15%',
  sidebarBorder: '214 20% 88%',
  sidebarRing: '221 83% 53%',

  // Glass — inverted for light
  glassBg: 'rgba(255, 255, 255, 0.7)',
  glassBgStrong: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',
  glassBorderStrong: 'rgba(0, 0, 0, 0.12)',

  // Shadows — soft, layered
  shadowSm: '0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
  shadowMd: '0 2px 8px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)',
  shadowLg: '0 4px 16px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0, 0, 0, 0.03)',
  shadowXl: '0 8px 24px rgba(0, 0, 0, 0.08), 0 4px 10px rgba(0, 0, 0, 0.04)',
  shadow2xl: '0 16px 48px rgba(0, 0, 0, 0.1), 0 8px 16px rgba(0, 0, 0, 0.05)',

  // Glows — subtle on light
  glowCyan: '0 0 16px rgba(34, 211, 238, 0.1)',
  glowBlue: '0 0 16px rgba(37, 99, 235, 0.1)',
  glowViolet: '0 0 16px rgba(124, 58, 237, 0.1)',

  // Gradients
  gradientPrimary:
    'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)',
  gradientSurface:
    'linear-gradient(180deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.6) 100%)',
  gradientGlow:
    'radial-gradient(ellipse at top, rgba(37, 99, 235, 0.05) 0%, transparent 65%)',

  // Status — darker text for light bg
  success: '142 76% 36%',
  successForeground: '0 0% 100%',
  warning: '38 92% 50%',
  warningForeground: '0 0% 0%',
  info: '221 83% 53%',
  infoForeground: '0 0% 100%',
};

// ---------------------------------------------------------------------------
// 5. Aurora — Premium Futuristic Tech
// ---------------------------------------------------------------------------

const auroraTokens: ThemeTokens = {
  // Core surfaces — #020617, #0F172A, #111827
  background: '229 84% 5%',
  foreground: '220 14% 91%',
  card: '221 39% 11%',
  cardForeground: '220 14% 91%',
  popover: '222 47% 11%',
  popoverForeground: '220 14% 91%',

  // Brand — cyan #22D3EE, violet-purple #C084FC
  primary: '189 94% 53%',
  primaryForeground: '229 84% 5%',
  secondary: '270 95% 75%',
  secondaryForeground: '220 14% 91%',

  // Utility
  muted: '230 20% 15%',
  mutedForeground: '230 12% 55%',
  accent: '270 95% 75%',
  accentForeground: '229 84% 5%',
  destructive: '350 80% 55%',
  destructiveForeground: '220 14% 91%',

  // Chrome
  border: '230 18% 14%',
  input: '225 30% 10%',
  ring: '189 94% 53%',

  // Sidebar
  sidebar: '229 70% 6%',
  sidebarForeground: '220 14% 91%',
  sidebarPrimary: '189 94% 53%',
  sidebarPrimaryForeground: '229 84% 5%',
  sidebarAccent: '228 30% 12%',
  sidebarAccentForeground: '220 14% 91%',
  sidebarBorder: '230 18% 12%',
  sidebarRing: '189 94% 53%',

  // Glass — teal/violet tinted
  glassBg: 'rgba(34, 211, 238, 0.03)',
  glassBgStrong: 'rgba(34, 211, 238, 0.06)',
  glassBorder: 'rgba(255, 255, 255, 0.14)',
  glassBorderStrong: 'rgba(255, 255, 255, 0.20)',

  // Shadows
  shadowSm: '0 2px 8px rgba(0, 0, 0, 0.55)',
  shadowMd: '0 4px 16px rgba(0, 0, 0, 0.65)',
  shadowLg: '0 8px 32px rgba(0, 0, 0, 0.75)',
  shadowXl: '0 16px 48px rgba(0, 0, 0, 0.85)',
  shadow2xl: '0 24px 64px rgba(0, 0, 0, 0.9)',

  // Glows — vivid
  glowCyan: '0 0 24px rgba(34, 211, 238, 0.3)',
  glowBlue: '0 0 24px rgba(96, 165, 250, 0.25)',
  glowViolet: '0 0 24px rgba(192, 132, 252, 0.35)',

  // Gradients — signature aurora glow
  gradientPrimary:
    'linear-gradient(135deg, #22D3EE 0%, #8B5CF6 50%, #C084FC 100%)',
  gradientSurface:
    'linear-gradient(180deg, rgba(34, 211, 238, 0.04) 0%, rgba(192, 132, 252, 0.02) 100%)',
  gradientGlow:
    'radial-gradient(ellipse at top, rgba(34, 211, 238, 0.12) 0%, rgba(139, 92, 246, 0.06) 40%, transparent 70%)',

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
      description: 'Dark enterprise cyber — the default experience',
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
      description: 'Corporate enterprise SaaS',
      swatch: '#0A1128',
      isDark: true,
      colorScheme: 'dark',
    },
    tokens: midnightBlueTokens,
  },
  graphite: {
    meta: {
      id: 'graphite',
      label: 'Graphite',
      description: 'Minimal executive — quiet, restrained, low fatigue',
      swatch: '#0B0B0B',
      isDark: true,
      colorScheme: 'dark',
    },
    tokens: graphiteTokens,
  },
  light: {
    meta: {
      id: 'light',
      label: 'Light Enterprise',
      description: 'Clean SaaS light mode',
      swatch: '#F8FAFC',
      isDark: false,
      colorScheme: 'light',
    },
    tokens: lightTokens,
  },
  aurora: {
    meta: {
      id: 'aurora',
      label: 'Aurora',
      description: 'Premium futuristic tech — cyan & violet glow',
      swatch: '#020617',
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
