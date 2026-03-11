/**
 * FormaOS Enterprise Theme Token System
 *
 * Central source of truth for all theme tokens.
 * Components reference these semantic tokens — never raw colors.
 */

// ---------------------------------------------------------------------------
// Theme IDs
// ---------------------------------------------------------------------------

export const THEME_IDS = [
  'dark',
  'midnight-blue',
  'graphite',
  'light',
  'aurora',
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

// ---------------------------------------------------------------------------
// Token structure
// ---------------------------------------------------------------------------

/** HSL value string without `hsl()` wrapper, e.g. "230 50% 3%" */
type HSL = string;

/** Raw CSS value for non-HSL properties (rgba, gradients, box-shadows) */
type CSSValue = string;

export interface ThemeTokens {
  // Core surfaces
  background: HSL;
  foreground: HSL;
  card: HSL;
  cardForeground: HSL;
  popover: HSL;
  popoverForeground: HSL;

  // Brand
  primary: HSL;
  primaryForeground: HSL;
  secondary: HSL;
  secondaryForeground: HSL;

  // Utility
  muted: HSL;
  mutedForeground: HSL;
  accent: HSL;
  accentForeground: HSL;
  destructive: HSL;
  destructiveForeground: HSL;

  // Chrome
  border: HSL;
  input: HSL;
  ring: HSL;

  // Sidebar
  sidebar: HSL;
  sidebarForeground: HSL;
  sidebarPrimary: HSL;
  sidebarPrimaryForeground: HSL;
  sidebarAccent: HSL;
  sidebarAccentForeground: HSL;
  sidebarBorder: HSL;
  sidebarRing: HSL;

  // Glassmorphism
  glassBg: CSSValue;
  glassBgStrong: CSSValue;
  glassBorder: CSSValue;
  glassBorderStrong: CSSValue;

  // Depth
  shadowSm: CSSValue;
  shadowMd: CSSValue;
  shadowLg: CSSValue;
  shadowXl: CSSValue;
  shadow2xl: CSSValue;

  // Glows
  glowCyan: CSSValue;
  glowBlue: CSSValue;
  glowViolet: CSSValue;

  // Gradients
  gradientPrimary: CSSValue;
  gradientSurface: CSSValue;
  gradientGlow: CSSValue;

  // Status (shared across themes but can be overridden)
  success: HSL;
  successForeground: HSL;
  warning: HSL;
  warningForeground: HSL;
  info: HSL;
  infoForeground: HSL;
}

// ---------------------------------------------------------------------------
// CSS variable name mapping
// ---------------------------------------------------------------------------

/**
 * Maps each token key to a CSS custom property name.
 * Used to emit `[data-theme='x'] { --background: ...; }` etc.
 */
export const TOKEN_TO_CSS_VAR: Record<keyof ThemeTokens, string> = {
  background: '--background',
  foreground: '--foreground',
  card: '--card',
  cardForeground: '--card-foreground',
  popover: '--popover',
  popoverForeground: '--popover-foreground',
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  muted: '--muted',
  mutedForeground: '--muted-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  destructive: '--destructive',
  destructiveForeground: '--destructive-foreground',
  border: '--border',
  input: '--input',
  ring: '--ring',
  sidebar: '--sidebar',
  sidebarForeground: '--sidebar-foreground',
  sidebarPrimary: '--sidebar-primary',
  sidebarPrimaryForeground: '--sidebar-primary-foreground',
  sidebarAccent: '--sidebar-accent',
  sidebarAccentForeground: '--sidebar-accent-foreground',
  sidebarBorder: '--sidebar-border',
  sidebarRing: '--sidebar-ring',
  glassBg: '--glass-bg',
  glassBgStrong: '--glass-bg-strong',
  glassBorder: '--glass-border',
  glassBorderStrong: '--glass-border-strong',
  shadowSm: '--shadow-sm',
  shadowMd: '--shadow-md',
  shadowLg: '--shadow-lg',
  shadowXl: '--shadow-xl',
  shadow2xl: '--shadow-2xl',
  glowCyan: '--glow-cyan',
  glowBlue: '--glow-blue',
  glowViolet: '--glow-violet',
  gradientPrimary: '--gradient-primary',
  gradientSurface: '--gradient-surface',
  gradientGlow: '--gradient-glow',
  success: '--success',
  successForeground: '--success-foreground',
  warning: '--warning',
  warningForeground: '--warning-foreground',
  info: '--info',
  infoForeground: '--info-foreground',
};

/**
 * Flat list of CSS custom property names used by the theme system.
 * Useful for auditing or runtime inspection.
 */
export const ALL_CSS_VARS = Object.values(TOKEN_TO_CSS_VAR);
