'use client';

/**
 * Re-export the theme provider from the central theme module.
 * Components can import from here or directly from '@/lib/theme'.
 */
export { ThemeProvider, THEME_IDS as THEMES, type ThemeId } from '@/lib/theme';
