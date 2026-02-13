'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

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

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setMounted(true);
        observer.disconnect();
      },
      { rootMargin },
    );

    observer.observe(anchor);
    return () => observer.disconnect();
  }, [rootMargin]);

  return (
    <div ref={anchorRef} className={className} style={{ minHeight }}>
      {mounted ? children : null}
    </div>
  );
}

export default DeferredSection;

