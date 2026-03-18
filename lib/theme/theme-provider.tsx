'use client';

import { useEffect, useCallback } from 'react';
import { ThemeProvider as NextThemesProvider, useTheme } from 'next-themes';
import { THEME_IDS, type ThemeId } from './theme-tokens';
import { systemThemeId } from './theme-utils';

export { THEME_IDS, type ThemeId };

/**
 * Root theme provider — wraps next-themes with FormaOS theme list.
 *
 * Features:
 * - All 5 enterprise themes registered
 * - System preference support via 'system' virtual theme
 * - Persistence via localStorage (key "theme") — automatic
 * - Attribute: data-theme on <html> for CSS selectors
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="dark"
      themes={[...THEME_IDS]}
      enableSystem={false}
      disableTransitionOnChange
    >
      <SystemThemeSync />
      {children}
    </NextThemesProvider>
  );
}

/**
 * Internal component that listens for OS-level color scheme changes.
 * If user has chosen 'system' mode (stored in localStorage under 'theme-mode'),
 * it will auto-switch to the matching FormaOS theme.
 */
function SystemThemeSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const mode = localStorage.getItem('formaos-theme-mode');
    if (mode !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setTheme(systemThemeId());

    // Sync on mount
    onChange();

    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [setTheme]);

  return null;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Enhanced hook for theme management.
 * Returns the standard useTheme API plus helpers for system mode.
 */
export function useFormaTheme() {
  const themeApi = useTheme();
  const { setTheme } = themeApi;

  const setThemeWithMode = useCallback(
    (themeId: ThemeId | 'system') => {
      if (themeId === 'system') {
        localStorage.setItem('formaos-theme-mode', 'system');
        setTheme(systemThemeId());
      } else {
        localStorage.setItem('formaos-theme-mode', 'manual');
        setTheme(themeId);
      }
    },
    [setTheme],
  );

  const isSystemMode =
    typeof window !== 'undefined'
      ? localStorage.getItem('formaos-theme-mode') === 'system'
      : false;

  return {
    ...themeApi,
    themeId: (themeApi.theme ?? 'dark') as ThemeId,
    setThemeWithMode,
    isSystemMode,
  };
}
