'use client';

import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Playable compliance posture. Toggle controls on/off and the gauge, status
 * counts, and per-framework bars recompute live — the page's interactive
 * centerpiece. Demonstrates the product idea instead of describing it.
 */

type Ctrl = { id: string; label: string; group: string };

const CONTROLS: Ctrl[] = [
  { id: 'ac2', label: 'AC-2 Account review', group: 'Access' },
  { id: 'ac6', label: 'AC-6 Least privilege', group: 'Access' },
  { id: 'ac17', label: 'AC-17 Remote access', group: 'Access' },
  { id: 'rest', label: 'Data at rest · AES-256', group: 'Encryption' },
  { id: 'tls', label: 'In transit · TLS 1.3', group: 'Encryption' },
  { id: 'kms', label: 'Key management · KMS', group: 'Encryption' },
  { id: 'eatt', label: 'Evidence attached', group: 'Evidence' },
  { id: 'eanc', label: 'Chain anchored · Rekor', group: 'Evidence' },
  { id: 'sirs', label: 'SIRS clock encoded', group: 'Incident' },
  { id: 'iown', label: 'Incident owner named', group: 'Incident' },
  { id: 'pack', label: 'Policy acknowledged', group: 'Workforce' },
  { id: 'scr', label: 'Worker screening', group: 'Workforce' },
];

const FRAMEWORKS: { name: string; ids: string[] }[] = [
  { name: 'SOC 2 Type II', ids: ['ac2', 'ac6', 'ac17', 'rest', 'tls', 'kms', 'eatt', 'eanc'] },
  { name: 'ISO 27001', ids: ['ac6', 'rest', 'tls', 'kms', 'eatt', 'pack'] },
  { name: 'NDIS Practice', ids: ['ac2', 'sirs', 'iown', 'pack', 'scr'] },
  { name: 'HIPAA', ids: ['ac17', 'rest', 'tls', 'kms', 'eatt'] },
];

const GROUPS = ['Access', 'Encryption', 'Evidence', 'Incident', 'Workforce'];
const START = new Set(['ac2', 'ac6', 'ac17', 'rest', 'tls', 'kms']);

export function PostureSimulator() {
  const reduce = useReducedMotion();
  const [on, setOn] = useState<Set<string>>(new Set(START));

  const toggle = (id: string) =>
    setOn((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const score = Math.round((on.size / CONTROLS.length) * 100);
  const r = 46;

  const fwScores = useMemo(
    () =>
      FRAMEWORKS.map((f) => {
        const met = f.ids.filter((id) => on.has(id)).length;
        return { name: f.name, pct: Math.round((met / f.ids.length) * 100) };
      }),
    [on],
  );

  return (
    <div className="sim">
      {/* controls */}
      <div className="sim-controls">
        {GROUPS.map((g) => (
          <div key={g}>
            <div className="sim-grouphead">{g}</div>
            <div className="sim-chips">
              {CONTROLS.filter((c) => c.group === g).map((c) => {
                const active = on.has(c.id);
                return (
                  <button
                    key={c.id}
                    className={`sim-chip ${active ? 'is-on' : 'is-off'}`}
                    onClick={() => toggle(c.id)}
                    aria-pressed={active}
                  >
                    <span className="sim-box" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="sim-actions">
          <button className="sim-act" onClick={() => setOn(new Set(CONTROLS.map((c) => c.id)))}>Enable all</button>
          <button className="sim-act" onClick={() => setOn(new Set(START))}>Reset</button>
          <button className="sim-act" onClick={() => setOn(new Set())}>Clear</button>
        </div>
      </div>

      {/* live readout */}
      <div className="sim-readout">
        <div className="sim-gaugewrap">
          <svg width="118" height="118" viewBox="0 0 118 118" aria-hidden style={{ flexShrink: 0 }}>
            <circle cx="59" cy="59" r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
            <motion.circle
              cx="59" cy="59" r={r} fill="none"
              stroke={score < 60 ? 'var(--red)' : 'var(--ok)'}
              strokeWidth="7" strokeLinecap="round" transform="rotate(-90 59 59)"
              initial={false}
              animate={{ pathLength: Math.max(score / 100, 0.0001) }}
              transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 90, damping: 18 }}
            />
          </svg>
          <div>
            <div className="sim-score" style={{ color: score < 60 ? 'var(--red)' : 'var(--ink)' }}>
              {score}<span style={{ fontSize: '0.5em', color: 'var(--ink-dim)' }}>%</span>
            </div>
            <div className="bru-mono" style={{ fontSize: 10.5, color: 'var(--ink-dim)', marginTop: 6, letterSpacing: '0.06em' }}>
              COMPOSITE POSTURE
            </div>
          </div>
        </div>

        <div className="sim-statline">
          <div className="sim-stat">
            <div className="sim-stat-v">{on.size}</div>
            <div className="sim-stat-l">Met</div>
          </div>
          <div className="sim-stat">
            <div className="sim-stat-v" style={{ color: CONTROLS.length - on.size > 0 ? 'var(--red)' : 'var(--ink)' }}>
              {CONTROLS.length - on.size}
            </div>
            <div className="sim-stat-l">Gaps</div>
          </div>
          <div className="sim-stat">
            <div className="sim-stat-v">{CONTROLS.length}</div>
            <div className="sim-stat-l">Mapped</div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          {fwScores.map((f) => (
            <div className="sim-fw" key={f.name}>
              <span style={{ color: 'var(--ink)' }}>{f.name}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="sim-fwbar"><span style={{ width: `${f.pct}%`, background: f.pct < 60 ? 'var(--red)' : 'var(--ok)' }} /></span>
                <span className="bru-mono" style={{ fontSize: 12, width: 34, textAlign: 'right' }}>{f.pct}%</span>
              </span>
            </div>
          ))}
        </div>

        <div className="sim-hint">↳ Toggle controls — watch posture move in real time.</div>
      </div>
    </div>
  );
}
