import { Reveal } from './Reveal';

/** Enterprise procurement: the four objections + the evaluation path + the
 *  buyer-facing artifacts that ship on day one. Verbatim from production. */

const OBJ = [
  ['How do we complete security review before sign-off?', 'A security review packet — architecture overview, DPA, and vendor questionnaire material — so your team starts immediately.', 'Security packet included'],
  ['Where is our data stored?', 'AU-hosted by default. Additional residency is reviewed during procurement, with a DPA available for legal review.', 'Data sovereignty controls'],
  ['Can we get our data out if we leave?', 'Evidence, controls, audit trails, and framework mappings export in standard formats. Full portability, guaranteed.', 'Full data portability'],
  ['Does it work across multiple sites?', 'Multi-entity and multi-site management is core, with centralized oversight and local accountability per site.', 'Multi-entity by design'],
] as const;

const PATH = [
  ['01', 'Start buyer review', 'Bring security, compliance, procurement, and operations into a guided evaluation from day one.'],
  ['02', 'Run security review in parallel', 'Use the security packet and trust-center artifacts while teams validate implementation fit.'],
  ['03', 'Close with defensible proof', 'Present ownership trails, evidence chains, and readiness posture for approval without rework.'],
] as const;

const ARTIFACTS = [
  'Security review packet', 'Trust center documents', 'Framework mapping overview',
  'DPA & data residency docs', 'Access & identity model', 'Enterprise service terms',
];

export function ObjectionHandling() {
  return (
    <section className="bru-frame bru-section">
      <div className="bru-head">
        <div>
          <span className="bru-eyebrow bru-eyebrow-line">Enterprise ready</span>
          <h2 className="bru-h2" style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', marginTop: 18 }}>
            From evaluation to<br />procurement, no blockers.
          </h2>
        </div>
        <p className="bru-body hidden lg:block" style={{ maxWidth: '34ch' }}>
          Ships with the trust artifacts, security documentation, and buyer-facing proof
          procurement teams need on day one.
        </p>
      </div>

      <Reveal>
        <div className="bru-obj">
          {OBJ.map(([q, a, proof]) => (
            <div className="bru-obj-card" key={q}>
              <p className="bru-obj-q">{q}</p>
              <p className="bru-body" style={{ marginTop: 16 }}>{a}</p>
              <p className="bru-obj-proof">↳ {proof}</p>
            </div>
          ))}
        </div>
      </Reveal>

      <div style={{ marginTop: 'clamp(2.5rem, 4vw, 3.5rem)' }}>
        <span className="bru-mono" style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
          Typical evaluation path
        </span>
        <Reveal>
          <div className="grid gap-px sm:grid-cols-3" style={{ marginTop: 18, border: '1px solid var(--line-2)', background: 'var(--line)' }}>
            {PATH.map(([n, t, d], i) => (
              <div key={n} style={{ background: 'var(--bg)', padding: '24px 20px', position: 'relative' }}>
                <span className="bru-mono" style={{ fontSize: 12, color: 'var(--red)' }}>{n}</span>
                <div className="bru-card-title" style={{ fontSize: '1.05rem', marginTop: 12 }}>{t}</div>
                <p className="bru-body" style={{ fontSize: '0.86rem', marginTop: 12 }}>{d}</p>
                {i < PATH.length - 1 && <span className="bru-flow-arrow" aria-hidden>→</span>}
              </div>
            ))}
          </div>
        </Reveal>
        <div className="bru-artifacts">
          {ARTIFACTS.map((a) => <span className="bru-artifact" key={a}>{a}</span>)}
        </div>
      </div>
    </section>
  );
}
