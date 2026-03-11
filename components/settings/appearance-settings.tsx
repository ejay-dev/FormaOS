'use client';

import { Monitor } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { saveThemePreference } from '@/app/app/actions/theme';
import {
  useFormaTheme,
  THEME_IDS,
  THEME_META,
  type ThemeId,
} from '@/lib/theme';

/**
 * Appearance settings card — used on the Settings page.
 * Shows theme options with visual previews in a responsive grid.
 */
export function AppearanceSettings() {
  const { themeId, setThemeWithMode, isSystemMode } = useFormaTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const selectTheme = useCallback(
    (newTheme: ThemeId | 'system') => {
      setThemeWithMode(newTheme);
      if (newTheme !== 'system') saveThemePreference(newTheme).catch(() => {});
    },
    [setThemeWithMode],
  );

  if (!mounted) {
    return (
      <div className="bg-card border border-border rounded-[2.5rem] p-10 shadow-sm space-y-6 animate-pulse">
        <div className="h-6 w-40 bg-muted rounded" />
        <div className="h-32 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-[2.5rem] p-10 shadow-sm space-y-8">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
          <Monitor className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-black text-foreground tracking-tight">
            Appearance
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Choose your preferred visual theme
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* System theme card */}
        <button
          onClick={() => selectTheme('system')}
          className={`group relative rounded-2xl border-2 p-4 text-left transition-all ${
            isSystemMode
              ? 'border-primary ring-2 ring-primary/20 shadow-lg'
              : 'border-border hover:border-primary/40'
          }`}
        >
          <div className="h-20 rounded-xl mb-3 overflow-hidden border border-border/50 bg-gradient-to-r from-[#0a101f] to-[#f8fafc]">
            <div className="h-full flex items-center justify-center">
              <Monitor className="h-8 w-8 text-white/60" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Monitor className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span
              className={`text-sm font-bold ${isSystemMode ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              System
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
            Follows your OS light / dark preference
          </p>
          {isSystemMode && (
            <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              ✓
            </div>
          )}
        </button>

        {THEME_IDS.map((t) => {
          const meta = THEME_META[t];
          const isActive = themeId === t && !isSystemMode;

          return (
            <button
              key={t}
              onClick={() => selectTheme(t)}
              className={`group relative rounded-2xl border-2 p-4 text-left transition-all ${
                isActive
                  ? 'border-primary ring-2 ring-primary/20 shadow-lg'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              {/* Mini preview swatch */}
              <div
                className="h-20 rounded-xl mb-3 overflow-hidden border border-border/50"
                style={{ background: meta.swatch }}
              >
                <div className="h-full flex flex-col justify-end p-2.5 gap-1.5">
                  {/* Fake sidebar + content preview */}
                  <div className="flex gap-1.5 h-full">
                    <div
                      className="w-1/4 rounded-md"
                      style={{
                        background: meta.isDark
                          ? 'rgba(255,255,255,0.06)'
                          : 'rgba(0,0,0,0.04)',
                      }}
                    />
                    <div className="flex-1 flex flex-col gap-1 justify-end">
                      <div
                        className="h-2 w-3/4 rounded-full"
                        style={{
                          background: meta.isDark
                            ? 'rgba(255,255,255,0.15)'
                            : 'rgba(0,0,0,0.12)',
                        }}
                      />
                      <div
                        className="h-2 w-1/2 rounded-full"
                        style={{
                          background: meta.isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.06)',
                        }}
                      />
                      <div
                        className="h-2 w-2/3 rounded-full"
                        style={{
                          background: meta.isDark
                            ? 'rgba(255,255,255,0.05)'
                            : 'rgba(0,0,0,0.04)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Label */}
              <div className="flex items-center gap-2">
                <span
                  className="h-3.5 w-3.5 rounded-full border border-border flex-shrink-0 shadow-sm"
                  style={{ background: meta.swatch }}
                />
                <span
                  className={`text-sm font-bold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {meta.label}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                {meta.description}
              </p>

              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Your preference is saved automatically and persists across sessions.
      </p>
    </div>
  );
}
