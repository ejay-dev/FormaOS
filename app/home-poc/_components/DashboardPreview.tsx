'use client';

import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRef } from 'react';
import { CountUp } from './CountUp';

/**
 * A faithful preview of the FormaOS in-app dashboard (/app/compliance/health
 * + command-center): browser chrome, categorised sidebar with RAG dots, org
 * top bar, the overdue/due-soon/completed status strip, KPI tiles, the overall
 * compliance-health card with an animated posture gauge + status tiles +
 * sparkline, per-framework health with animated bars, and the top outstanding
 * controls list. Rendered in the page's monochrome+red palette.
 */

const NAV = [
  ['Dashboard', null, true],
  ['Obligations', 'red', false],
  ['Policies', 'dim', false],
  ['Evidence Vault', 'ok', false],
  ['Incidents', 'red', false],
  ['Staff Compliance', 'dim', false],
  ['Reports', null, false],
  ['Executive View', null, false],
] as const;

const KPIS = [
  ['Open obligations', 12, 'awaiting owner'],
  ['Overdue', 0, 'nothing past SLA'],
  ['Due this week', 5, 'on cadence'],
  ['Readiness', 94, '%  ·  buyer-ready'],
] as const;

const FRAMEWORKS = [
  ['SOC 2 Type II', 94],
  ['ISO 27001', 88],
  ['NDIS Practice', 96],
  ['HIPAA', 96],
] as const;

const OUTSTANDING = [
  ['AC-6', 'Least privilege', 'SOC 2', 'FAIL'],
  ['A.8.24', 'Use of cryptography', 'ISO 27001', 'PARTIAL'],
  ['1.7', 'Restrictive practices review', 'NDIS', 'PARTIAL'],
] as const;

function ragColor(r: string | null) {
  if (r === 'red') return 'var(--red)';
  if (r === 'ok') return 'var(--ok)';
  if (r === 'dim') return 'var(--ink-faint)';
  return 'transparent';
}

export function DashboardPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();

  const r = 46;
  const target = 0.82; // matches the 82% overall-health readout

  return (
    <div className="dash-win" ref={ref}>
      {/* browser chrome */}
      <div className="dash-chrome">
        <span className="dash-tl"><i /><i /><i /></span>
        <span className="dash-url">app.formaos.com.au/app/compliance/health</span>
        <span className="dash-ava" aria-hidden>NM</span>
      </div>

      <div className="dash-body">
        {/* sidebar */}
        <aside className="dash-side">
          <div className="dash-brand">
            <span className="dash-mark">FO</span>
            <span style={{ fontFamily: 'var(--sans)', fontWeight: 800, fontSize: 13, letterSpacing: '0.02em' }}>FORMAOS</span>
          </div>
          <div className="dash-ctx">Compliance</div>
          {NAV.map(([label, rag, active]) => (
            <div key={label} className={`dash-nav-item ${active ? 'is-active' : ''}`}>
              <span>{label}</span>
              {rag && <span className="dash-rag" style={{ background: ragColor(rag) }} />}
            </div>
          ))}
          <div className="dash-side-foot">
            <span className="dash-ava">NM</span>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink)' }}>Nancy M.</div>
              <div className="bru-mono" style={{ fontSize: 9, color: 'var(--ink-faint)', letterSpacing: '0.08em' }}>ADMIN</div>
            </div>
          </div>
        </aside>

        {/* main */}
        <div className="dash-main">
          <div className="dash-topbar">
            <span style={{ color: 'var(--ink)' }}>ORGANIZATION · Brightside Care</span>
            <span style={{ marginLeft: 'auto' }} className="hidden sm:inline">NDIS PROVIDER</span>
          </div>
          <div className="dash-strip">
            <span className="dash-sd"><i style={{ background: 'var(--red)' }} />0 OVERDUE</span>
            <span className="dash-sd"><i style={{ background: 'var(--ink-faint)' }} />5 DUE SOON</span>
            <span className="dash-sd"><i style={{ background: 'var(--ok)' }} />38 COMPLETED</span>
            <span className="dash-sd" style={{ marginLeft: 'auto', color: 'var(--red)' }}>
              <span className="bru-live-dot" />LIVE
            </span>
          </div>

          <div className="dash-pad">
            {/* KPI tiles */}
            <div className="dash-kpis">
              {KPIS.map(([l, v, c]) => (
                <div className="dash-kpi" key={l}>
                  <div className="dash-kpi-l">{l}</div>
                  <div className="dash-kpi-v" style={l === 'Overdue' ? undefined : undefined}>
                    <CountUp value={v as number} />{l === 'Readiness' ? '%' : ''}
                  </div>
                  <div className="dash-kpi-c">{l === 'Readiness' ? 'buyer-ready' : c}</div>
                </div>
              ))}
            </div>

            <div className="dash-grid2">
              {/* overall health */}
              <div className="dash-card">
                <div className="dash-card-h">
                  <span>Overall compliance health</span>
                  <span className="dash-pill" style={{ color: 'var(--ink)' }}>WATCH</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                  <svg width="118" height="118" viewBox="0 0 118 118" aria-hidden style={{ flexShrink: 0 }}>
                    <circle cx="59" cy="59" r={r} fill="none" stroke="var(--line)" strokeWidth="7" />
                    <motion.circle
                      cx="59" cy="59" r={r} fill="none" stroke="var(--ok)" strokeWidth="7" strokeLinecap="round"
                      transform="rotate(-90 59 59)"
                      initial={reduce ? false : { pathLength: 0 }}
                      animate={inView || reduce ? { pathLength: target } : { pathLength: 0 }}
                      transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </svg>
                  <div>
                    <div className="dash-kpi-v" style={{ fontSize: 38 }}>
                      <CountUp value={82} /><span style={{ color: 'var(--red)' }}>%</span>
                    </div>
                    <div className="bru-mono" style={{ fontSize: 10.5, color: 'var(--ink-dim)', marginTop: 6 }}>
                      5 FRAMEWORKS · 252 CONTROLS
                    </div>
                  </div>
                </div>
                <div className="dash-tiles">
                  {[['47', 'Pass'], ['8', 'Partial'], ['3', 'Fail'], ['12', 'Manual']].map(([v, l]) => (
                    <div className="dash-tile" key={l}>
                      <div className="dash-tile-v" style={{ color: l === 'Fail' ? 'var(--red)' : 'var(--ink)' }}>{v}</div>
                      <div className="dash-tile-l">{l}</div>
                    </div>
                  ))}
                </div>
                {/* sparkline */}
                <div style={{ marginTop: 16 }}>
                  <div className="bru-mono" style={{ fontSize: 9.5, color: 'var(--ink-faint)', letterSpacing: '0.06em', marginBottom: 8 }}>
                    12-WEEK TREND · +6%
                  </div>
                  <svg width="100%" height="44" viewBox="0 0 460 44" preserveAspectRatio="none" aria-hidden>
                    <motion.polyline
                      fill="none" stroke="var(--ok)" strokeWidth="1.5"
                      points="0,34 42,32 84,33 126,28 168,29 210,24 252,25 294,18 336,20 378,13 420,12 460,8"
                      initial={reduce ? false : { pathLength: 0 }}
                      animate={inView || reduce ? { pathLength: 1 } : { pathLength: 0 }}
                      transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.2 }}
                    />
                  </svg>
                </div>
              </div>

              {/* per-framework + outstanding */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="dash-card">
                  <div className="dash-card-h"><span>Per-framework</span><span>SCORE</span></div>
                  {FRAMEWORKS.map(([name, score], i) => (
                    <div className="dash-fw" key={name}>
                      <span style={{ color: 'var(--ink)' }}>{name}</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className="dash-bar2">
                          <motion.span
                            initial={reduce ? false : { width: 0 }}
                            animate={inView || reduce ? { width: `${score}%` } : { width: 0 }}
                            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 + i * 0.1 }}
                          />
                        </span>
                        <span className="bru-mono" style={{ fontSize: 12, width: 32, textAlign: 'right' }}>{score}%</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="dash-card">
                  <div className="dash-card-h"><span>Top outstanding controls</span></div>
                  {OUTSTANDING.map(([k, t, fw, st]) => (
                    <div className="dash-oc" key={k}>
                      <span style={{ color: 'var(--ink)', width: 48 }}>{k}</span>
                      <span style={{ color: 'var(--ink-dim)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</span>
                      <span style={{ color: 'var(--ink-faint)' }} className="hidden sm:inline">{fw}</span>
                      <span className={`dash-pill ${st === 'FAIL' ? 'dash-pill-fail' : ''}`}>{st}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
