'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { saveThemePreference } from '@/app/app/actions/theme';

/**
 * Appearance settings card — used on the Settings page.
 * Shows theme options with visual previews.
 */
export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const selectTheme = useCallback(
    (newTheme: string) => {
      setTheme(newTheme);
      saveThemePreference(newTheme).catch(() => {});
    },
    [setTheme],
  );

  if (!mounted) {
    return (
      <div className="bg-card border border-border rounded-[2.5rem] p-10 shadow-sm space-y-6 animate-pulse">
        <div className="h-6 w-40 bg-muted rounded" />
        <div className="h-32 bg-muted rounded-2xl" />
      </div>
    );
  }

  const themes = [
    {
      key: 'dark',
      label: 'Dark',
      description: 'Deep space — the default FormaOS experience',
      icon: Moon,
      preview: 'bg-slate-950 border-slate-800',
      previewInner: 'bg-slate-900',
    },
    {
      key: 'light-premium',
      label: 'Light Premium',
      description: 'Ivory stone — enterprise clarity',
      icon: Sun,
      preview: 'bg-amber-50 border-amber-200/50',
      previewInner: 'bg-white',
    },
  ];

  return (
    <div className="bg-card border border-border rounded-[2.5rem] p-10 shadow-sm space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
          <Monitor className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground tracking-tight">Appearance</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose your preferred visual theme
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {themes.map((t) => {
          const isActive = theme === t.key;
          const Icon = t.icon;

          return (
            <button
              key={t.key}
              onClick={() => selectTheme(t.key)}
              className={`group relative rounded-2xl border-2 p-4 text-left transition-all ${
                isActive
                  ? 'border-primary ring-2 ring-primary/20 shadow-lg'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              {/* Mini preview */}
              <div
                className={`h-20 rounded-xl border ${t.preview} mb-3 overflow-hidden p-2`}
              >
                <div className={`h-full rounded-lg ${t.previewInner} flex items-end p-2 gap-1`}>
                  <div className="h-2 w-6 rounded-full bg-primary/40" />
                  <div className="h-2 w-4 rounded-full bg-muted-foreground/20" />
                  <div className="h-2 w-8 rounded-full bg-muted-foreground/10" />
                </div>
              </div>

              {/* Label */}
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-bold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {t.label}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">{t.description}</p>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground">
        Your preference is saved automatically and persists across sessions.
      </p>
    </div>
  );
}
