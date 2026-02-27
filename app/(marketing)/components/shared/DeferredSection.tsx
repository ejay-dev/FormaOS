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
}

export function DeferredSection({
  children,
  className,
  minHeight = 0,
  rootMargin = '300px 0px',
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

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    let idleId: number | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
          idleId = (
            window as Window & {
              requestIdleCallback: (cb: () => void, options?: { timeout: number }) => number;
            }
          ).requestIdleCallback(() => setMounted(true), { timeout: 650 });
        } else {
          setMounted(true);
        }
        observer.disconnect();
      },
      { rootMargin: resolvedRootMargin },
    );

    observer.observe(anchor);
    return () => {
      observer.disconnect();
      if (idleId !== null && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        (
          window as Window & {
            cancelIdleCallback: (id: number) => void;
          }
        ).cancelIdleCallback(idleId);
      }
    };
  }, [resolvedRootMargin]);

  const deferredStyle: CSSProperties = {
    minHeight,
    contentVisibility: mounted ? 'visible' : 'auto',
    contain: 'layout paint style',
    containIntrinsicSize: minHeight > 0 ? `${Math.round(minHeight)}px` : '600px',
  };

  return (
    <div
      ref={anchorRef}
      className={['mk-deferred-section', className].filter(Boolean).join(' ')}
      style={deferredStyle}
    >
      {mounted ? children : null}
    </div>
  );
}

export default DeferredSection;
