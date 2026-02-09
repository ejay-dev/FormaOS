'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

/**
 * Global theme provider — wraps next-themes.
 *
 * Themes:
 *  - "dark"           (default, current look)
 *  - "light-premium"  (ivory / stone enterprise light)
 *
 * Persistence: localStorage (key "theme") — automatic via next-themes.
 * Attribute:   data-theme on <html> so CSS selectors Just Work™.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="dark"
      themes={['dark', 'light-premium']}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
