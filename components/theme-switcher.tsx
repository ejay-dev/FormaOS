'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Palette, ChevronRight } from 'lucide-react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { saveThemePreference } from '@/app/app/actions/theme';
import { THEMES, type ThemeId } from '@/components/theme-provider';

/** Theme metadata — single source of truth for labels + swatches. */
export const THEME_META: Record<
  ThemeId,
  { label: string; description: string; swatch: string; isDark: boolean }
> = {
  dark: {
    label: 'Dark',
    description: 'Deep space — the default FormaOS experience',
    swatch: '#0a101f',
    isDark: true,
  },
  'light-premium': {
    label: 'Light Premium',
    description: 'Ivory stone — enterprise clarity',
    swatch: '#f5f2ec',
    isDark: false,
  },
  'midnight-ink': {
    label: 'Midnight Ink',
    description: 'Executive dark — deeper, cleaner, cooler',
    swatch: '#0b1120',
    isDark: true,
  },
  graphite: {
    label: 'Graphite',
    description: 'Finance-grade — neutral, restrained, low fatigue',
    swatch: '#1a1a1a',
    isDark: true,
  },
  champagne: {
    label: 'Champagne',
    description: 'Warm boardroom — cream, sand, premium feel',
    swatch: '#f0e8d8',
    isDark: false,
  },
  aurora: {
    label: 'Aurora',
    description: 'Signature modern — dark glass with teal & violet',
    swatch: '#10102a',
    isDark: true,
  },
};

/**
 * Persist theme to DB (fire-and-forget).
 * localStorage is handled by next-themes automatically.
 */
function persistTheme(theme: string) {
  saveThemePreference(theme).catch(() => {});
}

/**
 * Full-width theme menu item for the user dropdown.
 * Opens a flyout sub-menu with all themes.
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selectTheme = useCallback(
    (t: string) => {
      setTheme(t);
      persistTheme(t);
      setOpen(false);
    },
    [setTheme],
  );

  if (!mounted) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${className ?? ''}`}
      >
        <div className="h-4 w-4" />
        <span className="text-muted-foreground">Theme</span>
      </div>
    );
  }

  const current = THEME_META[(theme as ThemeId) ?? 'dark'];

  return (
    <div ref={ref} className={`relative ${className ?? ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-card-foreground hover:bg-muted/50 transition-colors text-left"
      >
        <Palette className="h-4 w-4" />
        <span className="flex-1">Theme</span>
        <span
          className="h-3 w-3 rounded-full border border-border flex-shrink-0"
          style={{ background: current.swatch }}
        />
        <ChevronRight
          className={`h-3 w-3 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 bottom-full mb-1 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 max-h-[280px] overflow-y-auto">
          {THEMES.map((t) => {
            const meta = THEME_META[t];
            const isActive = theme === t;
            return (
              <button
                key={t}
                onClick={() => selectTheme(t)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-popover-foreground hover:bg-muted/50'
                }`}
              >
                <span
                  className="h-4 w-4 rounded-full border border-border flex-shrink-0 shadow-sm"
                  style={{ background: meta.swatch }}
                />
                <span className="flex-1">{meta.label}</span>
                {isActive && <span className="text-primary text-xs">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Compact icon-only toggle for tight spaces (e.g. topbar).
 * Cycles to the next theme in the list.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const currentIdx = THEMES.indexOf((theme as ThemeId) ?? 'dark');
  const safeCurrentIdx = currentIdx >= 0 ? currentIdx : 0;
  const nextIdx = (safeCurrentIdx + 1) % THEMES.length;
  const nextTheme = THEMES[nextIdx] ?? 'dark';
  const nextMeta = THEME_META[nextTheme];
  const isDark = THEME_META[(theme as ThemeId) ?? 'dark']?.isDark ?? true;

  const toggle = useCallback(() => {
    setTheme(nextTheme);
    persistTheme(nextTheme);
  }, [nextTheme, setTheme]);

  if (!mounted) return <div className="h-9 w-9" />;

  return (
    <button
      onClick={toggle}
      className="p-2 rounded-lg transition-colors hover:bg-muted text-muted-foreground hover:text-foreground"
      title={`Switch to ${nextMeta.label}`}
      aria-label={`Switch to ${nextMeta.label}`}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
