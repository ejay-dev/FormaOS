'use client';

import { useEffect, useRef, useState } from 'react';

function parseValue(value: string): { prefix: string; number: number; suffix: string } {
  const match = value.match(/^([^0-9]*)(\d+(?:\.\d+)?)([^0-9]*)$/);
  if (!match) return { prefix: '', number: 0, suffix: value };
  return { prefix: match[1], number: parseFloat(match[2]), suffix: match[3] };
}

export function AnimatedCounter({ value, duration = 1200 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayed, setDisplayed] = useState(value);
  const hasAnimated = useRef(false);

  const { prefix, number, suffix } = parseValue(value);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setDisplayed(value);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          observer.disconnect();

          const start = performance.now();
          const isInt = Number.isInteger(number);

          function tick(now: number) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const current = progress * number;
            const formatted = isInt ? Math.floor(current).toString() : current.toFixed(1);
            setDisplayed(`${prefix}${formatted}${suffix}`);
            if (progress < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, duration, prefix, number, suffix]);

  return <span ref={ref}>{displayed}</span>;
}
