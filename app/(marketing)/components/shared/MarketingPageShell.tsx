'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, type ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';

const CinematicField = dynamic(() => import('../motion/CinematicField'), {
  ssr: false,
  loading: () => null,
});

interface MarketingPageShellProps {
  children: ReactNode;
  className?: string;
  /** Set false to skip the CinematicField particle layer */
  enableCinematicField?: boolean;
}

/**
 * Shared page wrapper for marketing pages.
 * Handles: mk-page-bg, CinematicField with idle-callback gating,
 * reduced-motion compliance, desktop-only heavy visuals.
 */
export function MarketingPageShell({
  children,
  className = '',
  enableCinematicField = true,
}: MarketingPageShellProps) {
  const shouldReduceMotion = useReducedMotion();
  const [allowHeavyVisuals, setAllowHeavyVisuals] = useState(false);
  const [enableBackground, setEnableBackground] = useState(false);

  useEffect(() => {
    const update = () => setAllowHeavyVisuals(window.innerWidth >= 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (shouldReduceMotion || !allowHeavyVisuals || !enableCinematicField) {
      setEnableBackground(false);
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;
    const onIdle = () => setEnableBackground(true);

    if ('requestIdleCallback' in window) {
      idleId = (window as Window & {
        requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
      }).requestIdleCallback(onIdle, { timeout: 1200 });
    } else {
      timeoutId = setTimeout(onIdle, 500);
    }

    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
      if (idleId !== null && 'cancelIdleCallback' in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
    };
  }, [allowHeavyVisuals, shouldReduceMotion, enableCinematicField]);

  return (
    <div className={`relative min-h-screen overflow-x-hidden mk-page-bg ${className}`}>
      {!shouldReduceMotion && allowHeavyVisuals && enableBackground && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 opacity-18">
            <CinematicField />
          </div>
        </div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export default MarketingPageShell;
