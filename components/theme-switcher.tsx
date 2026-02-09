'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { saveThemePreference } from '@/app/app/actions/theme';

/**
 * Persist theme to DB (fire-and-forget).
 * localStorage is handled by next-themes automatically.
 */
function persistTheme(theme: string) {
  // DB sync — non-blocking
  saveThemePreference(theme).catch(() => {});
}

/**
 * Full-width theme switcher for menus / settings.
 * Shows label + icon.
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // SSR placeholder — prevents hydration mismatch
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${className ?? ''}`}
      >
        <div className="h-4 w-4" />
        <span className="text-muted-foreground">Theme</span>
      </div>
    );
  }

  const isDark = theme === 'dark';

  const toggle = useCallback(() => {
    const next = isDark ? 'light-premium' : 'dark';
    setTheme(next);
    persistTheme(next);
  }, [isDark, setTheme]);

  return (
    <button
      onClick={toggle}
      className={`w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-card-foreground hover:bg-muted/50 transition-colors text-left ${className ?? ''}`}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  );
}

/**
 * Compact icon-only toggle for tight spaces (e.g. topbar).
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-9 w-9" />;

  const isDark = theme === 'dark';

  const toggle = useCallback(() => {
    const next = isDark ? 'light-premium' : 'dark';
    setTheme(next);
    persistTheme(next);
  }, [isDark, setTheme]);

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
