/**
 * FormaOS Enterprise Theme System
 *
 * Central barrel-export for the entire theme module.
 *
 * Usage:
 *   import { ThemeProvider, THEMES, useFormaTheme } from '@/lib/theme';
 */

// Provider + hooks
export {
  ThemeProvider,
  useFormaTheme,
  THEME_IDS,
  type ThemeId,
} from './theme-provider';

// Config + definitions
export {
  THEMES,
  THEME_LIST,
  THEME_META,
  type ThemeDefinition,
  type ThemeMeta,
} from './theme-config';

// Tokens
export {
  TOKEN_TO_CSS_VAR,
  ALL_CSS_VARS,
  type ThemeTokens,
} from './theme-tokens';

// Utilities
export {
  contrastRatio,
  meetsWcagAA,
  meetsWcagAAA,
  validateThemeContrast,
  getChartPalette,
  getSystemColorScheme,
  hexToRgb,
  hslToRgb,
  type ContrastResult,
  type ChartPalette,
} from './theme-utils';
