'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/**
 * Terminal-style framework ledger: a monospaced data table that reads like
 * a compliance trading desk. The aggregate score counts up on view; each
 * row carries a coverage bar and a live tag. Replaces the usual "trust
 * strip + posture card" with something data-forward and brutal.
 */

type Row = {
  framework: string;
  controls: string;
  coverage: number; // %
  score: number; // %
};

const ROWS: Row[] = [
  { framework: 'ISO 27001', controls: '114 / 114', coverage: 100, score: 100 },
  { framework: 'SOC 2 Type II', controls: '61 / 64', coverage: 95, score: 97 },
  { framework: 'NDIS Practice', controls: '88 / 92', coverage: 96, score: 96 },
  { framework: 'HIPAA', controls: '54 / 58', coverage: 93, score: 94 },
  { framework: 'GDPR', controls: '41 / 43', coverage: 95, score: 95 },
];

function useCountUp(target: number, run: boolean) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? target : 0);
  useEffect(() => {
    if (!run || reduce) {
      if (reduce) setV(target);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    const dur = 1100;
    const tick = (t: number) => {
      if (start === null) start = t;
      const p = Math.min((t - start) / dur, 1);
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, reduce, target]);
  return v;
}

export function Ledger() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const agg = useCountUp(96, inView);

  return (
    <div ref={ref}>
      {/* aggregate readout */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 18,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <span
            className="bru-display"
            style={{ fontSize: 'clamp(3rem, 7vw, 5.5rem)', lineHeight: 0.8 }}
          >
            {agg}
            <span style={{ color: 'var(--red)' }}>%</span>
          </span>
          <span className="bru-mono" style={{ fontSize: 12, color: 'var(--ink-dim)' }}>
            AGGREGATE
            <br />
            POSTURE
          </span>
        </div>
        <span className="bru-tag bru-tag-live">
          <span className="bru-live-dot" style={{ display: 'inline-block', marginRight: 6 }} />
          LIVE · ALL FRAMEWORKS
        </span>
      </div>

      <table className="bru-ledger">
        <thead>
          <tr>
            <th>Framework</th>
            <th>Controls</th>
            <th className="hidden sm:table-cell">Coverage</th>
            <th>Score</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.framework}>
              <td className="bru-fw">{r.framework}</td>
              <td style={{ color: 'var(--ink-dim)' }}>{r.controls}</td>
              <td className="hidden sm:table-cell">
                <span className="bru-bar-track">
                  <span className="bru-bar" style={{ width: `${r.coverage}%` }} />
                </span>
              </td>
              <td className="bru-score">{r.score}%</td>
              <td>
                <span className={`bru-tag ${r.score === 100 ? 'bru-tag-live' : ''}`}>
                  {r.score === 100 ? 'SEALED' : 'TRACKED'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
