'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/** All available themes — single source of truth. */
export const THEMES = [
  'dark',
  'light-premium',
  'midnight-ink',
  'graphite',
  'champagne',
  'aurora',
] as const;

export type ThemeId = (typeof THEMES)[number];

/**
 * Global theme provider — wraps next-themes.
 *
 * Persistence: localStorage (key "theme") — automatic via next-themes.
 * Attribute:   data-theme on <html> so CSS selectors Just Work™.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="dark"
      themes={[...THEMES]}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
