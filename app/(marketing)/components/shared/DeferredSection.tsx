'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { useReducedMotion } from 'framer-motion';
import { useDeviceTier } from '@/lib/device-tier';

interface DeferredSectionProps {
  children: ReactNode;
  className?: string;
  /** Reserve layout to avoid jump before mount */
  minHeight?: number;
  rootMargin?: string;
  fallback?: ReactNode;
}

export function DeferredSection({
  children,
  className,
  minHeight = 0,
  rootMargin = '300px 0px',
  fallback,
}: DeferredSectionProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const tierConfig = useDeviceTier();

  const resolvedRootMargin = useMemo(() => {
    if (rootMargin !== '300px 0px') return rootMargin;
    if (shouldReduceMotion || tierConfig.tier === 'low') return '72px 0px';
    if (tierConfig.tier === 'mid') return '140px 0px';
    return '240px 0px';
  }, [rootMargin, shouldReduceMotion, tierConfig.tier]);

  const reservedMinHeight = useMemo(() => {
    if (minHeight <= 0) return 0;
    if (tierConfig.isTouch) return Math.round(minHeight * 0.68);
    if (tierConfig.tier === 'low') return Math.round(minHeight * 0.78);
    return minHeight;
  }, [minHeight, tierConfig.isTouch, tierConfig.tier]);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    if (typeof IntersectionObserver === 'undefined') {
      setMounted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setMounted(true);
        observer.disconnect();
      },
      { rootMargin: resolvedRootMargin },
    );

    observer.observe(anchor);
    return () => {
      observer.disconnect();
    };
  }, [resolvedRootMargin]);

  const deferredStyle: CSSProperties = {
    minHeight: reservedMinHeight,
    contentVisibility: mounted ? 'visible' : 'auto',
    // Keep layout/style containment for perf, but avoid paint containment clipping
    // when descendants use scroll-based transforms near section boundaries.
    contain: mounted ? 'layout style' : 'layout paint style',
    containIntrinsicSize:
      reservedMinHeight > 0 ? `${Math.round(reservedMinHeight)}px` : '460px',
    overflow: 'visible',
  };

  return (
    <div
      ref={anchorRef}
      className={['mk-deferred-section', className].filter(Boolean).join(' ')}
      style={deferredStyle}
    >
      {mounted
        ? children
        : (fallback ?? (
            reservedMinHeight > 0 ? (
              <div
                aria-hidden="true"
                className="mk-deferred-section__placeholder flex min-h-[inherit] items-end rounded-[1.25rem] border border-white/[0.05] bg-gradient-to-b from-white/[0.035] via-white/[0.02] to-transparent px-5 py-6"
              >
                <div className="w-full space-y-3 opacity-80">
                  <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.12] to-transparent" />
                  <div className="mx-auto h-2 w-32 rounded-full bg-white/[0.07]" />
                </div>
              </div>
            ) : null
          ))}
    </div>
  );
}

export default DeferredSection;
