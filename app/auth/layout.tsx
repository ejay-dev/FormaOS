'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * Auth pages are theme-locked to "dark" regardless of the user's saved
 * preference. The signin / signup / reset flows use surfaces (bg-white/5,
 * border-white/10, glass tokens) that have light-mode overrides in
 * globals.css; if the user toggled a non-dark theme elsewhere we end up
 * with light cards on a dark hardcoded canvas. Forcing the html
 * data-theme to "dark" while these routes are mounted keeps the look
 * consistent and restores the user's choice on unmount.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const previous = theme;
    if (previous !== 'dark') {
      setTheme('dark');
    }
    return () => {
      if (previous && previous !== 'dark') {
        setTheme(previous);
      }
    };

  }, []);

  return <div className="min-h-screen bg-slate-950">{children}</div>;
}
