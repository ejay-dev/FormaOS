import { Reveal } from './Reveal';

/**
 * The enforced operating loop — verbatim from the production HowItWorks.
 * Five steps as a heavy numbered ledger; step 03 (enforcement) carries the
 * red "ENFORCING" badge because that's the load-bearing idea.
 */

const STEPS = [
  ['01', 'Define compliance workflow', 'Map the operational process — owners, due dates, evidence, and review points.', false],
  ['02', 'Assign rules', 'Set what must be present before work can move forward.', false],
  ['03', 'System enforces execution', 'FormaOS runs checks continuously and blocks incomplete paths.', true],
  ['04', 'Evidence generated automatically', 'Actions, approvals, timestamps, and context become audit evidence.', false],
  ['05', 'Audit-ready anytime', 'Export the evidence chain instead of rebuilding it under pressure.', false],
] as const;

export function HowItWorks() {
  return (
    <section className="bru-frame bru-section">
      <div className="bru-head">
        <div>
          <span className="bru-eyebrow bru-eyebrow-line">How it works</span>
          <h2 className="bru-h2" style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', marginTop: 18 }}>
            From obligation to<br />enforced evidence chain.
          </h2>
        </div>
        <p className="bru-body hidden lg:block" style={{ maxWidth: '34ch' }}>
          Compliance as a continuous operating loop — not a document clean-up project
          before an audit.
        </p>
      </div>

      <Reveal>
        <div className="bru-steps">
          {STEPS.map(([n, t, d, enforce]) => (
            <div className="bru-step" key={n}>
              <span className="bru-step-n">{n}</span>
              <div>
                <div className="bru-step-t">{t}</div>
                <p className="bru-body" style={{ marginTop: 12, maxWidth: '52ch' }}>{d}</p>
              </div>
              {enforce ? <span className="bru-step-enforce">● Enforcing</span> : <span />}
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
