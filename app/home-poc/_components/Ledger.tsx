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

// Real control counts from the framework registry; scores illustrative,
// mirroring how /app/compliance/health renders live posture.
const ROWS: Row[] = [
  { framework: 'SOC 2 Type II', controls: '61 TSC controls', coverage: 94, score: 94 },
  { framework: 'ISO 27001', controls: '93 controls', coverage: 88, score: 88 },
  { framework: 'NDIS Practice', controls: '25 evaluators', coverage: 96, score: 96 },
  { framework: 'HIPAA', controls: '10 safeguards', coverage: 96, score: 96 },
  { framework: 'Essential Eight', controls: '8 mitigations', coverage: 93, score: 93 },
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
  const agg = useCountUp(94, inView);

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
            COMPOSITE
            <br />
            POSTURE
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span className="bru-tag">
            <span className="bru-live-dot" style={{ display: 'inline-block', marginRight: 6 }} />
            REFRESHED NIGHTLY · 06:00 UTC
          </span>
          <span className="bru-mono" style={{ fontSize: 10.5, color: 'var(--ink-faint)', letterSpacing: '0.06em' }}>
            ILLUSTRATIVE — NOT A CUSTOMER CLAIM
          </span>
        </div>
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
                <span className="bru-tag">TRACKED</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
