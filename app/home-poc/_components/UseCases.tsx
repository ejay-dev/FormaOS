'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

/**
 * Interactive use-case scenarios — anonymized, verbatim from production.
 * Tab list on the left, animated detail on the right.
 */

const CASES = [
  {
    org: 'NDIS Provider',
    framework: 'NDIS Practice Standards · all 8 modules',
    challenge: 'Reportable incidents tracked in spreadsheets; Commission audits required days of reconstruction across multiple sites.',
    outcomes: [
      'Reportable-incident response inside the 24h immediate / 5 business-day detailed timelines',
      'Audit preparation time measured in hours, not weeks',
      'Named control owner at every Practice Standard module',
    ],
  },
  {
    org: 'Healthcare Operator',
    framework: 'NSQHS Standards · AHPRA · RACGP',
    challenge: 'Clinical governance controls existed on paper, but proof was inconsistent across sites; practitioner registration tracked manually.',
    outcomes: [
      'AHPRA registration expiry alerts at 90 / 60 / 30 days',
      'Control-to-evidence mapping with NSQHS Standards linkage',
      'Live executive posture view across sites',
    ],
  },
  {
    org: 'Aged Care Provider',
    framework: 'Aged Care Quality Standards · 8 standards',
    challenge: 'Policy changes were hard to roll out uniformly; periodic reviews slipped without reliable triggers; Standard 8 governance reporting consumed executive time.',
    outcomes: [
      'Policy review cadence enforced with automated task triggers',
      'Evidence renewal and expiry tracking across all facilities',
      'Standard 8 governance reporting compressed from weeks to days',
    ],
  },
  {
    org: 'Financial Services',
    framework: 'ISO 27001 · APRA CPS 234 · AML/CTF',
    challenge: 'Third-party risk grew with fintech partnerships, but control ownership and evidence collection remained manual; ASIC breach reporting relied on email threads.',
    outcomes: [
      'APRA CPS 234 control mapping with named owners and evidence trails',
      'ASIC reportable-situation response inside the statutory window',
      'Board governance packs generated from live data, not reconstructed',
    ],
  },
];

export function UseCases() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const c = CASES[active];

  return (
    <section className="bru-frame bru-section">
      <div className="bru-head">
        <div>
          <span className="bru-eyebrow bru-eyebrow-line">Use-case scenarios</span>
          <h2 className="bru-h2" style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', marginTop: 18 }}>
            How regulated teams<br />operate with FormaOS.
          </h2>
        </div>
        <p className="bru-body hidden lg:block" style={{ maxWidth: '34ch' }}>
          Anonymized scenarios from regulated organizations. Outcomes reflect conditions at
          the time of deployment.
        </p>
      </div>

      <div className="bru-uc">
        <div className="bru-uc-tabs" role="tablist">
          {CASES.map((cs, i) => (
            <button
              key={cs.org}
              role="tab"
              aria-selected={active === i}
              className={`bru-uc-tab ${active === i ? 'is-active' : ''}`}
              onClick={() => setActive(i)}
            >
              <div className="bru-uc-tab-t">{cs.org}</div>
              <div className="bru-uc-tab-s">{cs.framework}</div>
            </button>
          ))}
        </div>
        <div className="bru-uc-detail">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="bru-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--red)' }}>
                The challenge
              </span>
              <p className="bru-deck" style={{ marginTop: 14, marginBottom: 28 }}>{c.challenge}</p>
              <span className="bru-mono" style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
                What changed
              </span>
              <div style={{ marginTop: 8 }}>
                {c.outcomes.map((o) => (
                  <div className="bru-uc-outcome" key={o}>{o}</div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <p className="bru-mono" style={{ fontSize: 11, color: 'var(--ink-faint)', letterSpacing: '0.05em', marginTop: 14 }}>
        ANONYMIZED · WE CAN WALK THROUGH FULL DEPLOYMENTS DURING EVALUATION
      </p>
    </section>
  );
}
