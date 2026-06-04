'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/**
 * Live "compliance posture" vignette: a thin ring that fills and a
 * number that counts up when scrolled into view. Monochrome ink ring,
 * a single forest tick for the cleared arc — no glow.
 */
export function PostureRing({ target = 98 }: { target?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? target : 0);

  useEffect(() => {
    if (!inView || reduce) {
      if (reduce) setValue(target);
      return;
    }
    let raf = 0;
    const duration = 1400;
    let start: number | null = null;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduce, target]);

  const r = 52;
  const circ = 2 * Math.PI * r;
  const dash = circ * (value / 100);

  return (
    <div ref={ref} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
      <svg width="128" height="128" viewBox="0 0 128 128" aria-hidden>
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="rgba(28,30,31,0.12)"
          strokeWidth="6"
        />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="#2f6f57"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          transform="rotate(-90 64 64)"
        />
      </svg>
      <div>
        <div
          className="poc-serif"
          style={{
            fontWeight: 300,
            fontSize: 44,
            lineHeight: 1,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
          }}
        >
          {value}
          <span style={{ fontSize: 22, color: 'var(--grey)' }}>%</span>
        </div>
        <div
          className="poc-mono"
          style={{
            fontSize: 11,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--grey)',
            marginTop: 4,
          }}
        >
          Audit-ready
        </div>
      </div>
    </div>
  );
}
