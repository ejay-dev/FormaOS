import { Reveal } from './Reveal';

/**
 * Framework coverage wall + the production infrastructure FormaOS is built on.
 * Static, structured proof (the ticker is the kinetic counterpart).
 */

const FRAMEWORKS = [
  'NDIS Practice Standards', 'Aged Care Quality', 'NSQHS Standards', 'AHPRA',
  'ASIC s912A', 'APRA CPS 230', 'AUSTRAC AML/CTF', 'ACECQA NQF',
  'WHS Act', 'ISO 27001', 'SOC 2', 'GDPR',
  'NIST CSF', 'PCI DSS', 'HIPAA', 'CIS Controls',
  'ISO 9001', 'Essential Eight',
];

const BUILT_ON = ['Vercel', 'Supabase', 'Stripe', 'Sentry', 'Resend'];

export function TrustWall() {
  return (
    <section className="bru-frame bru-section">
      <div className="bru-head">
        <div>
          <span className="bru-eyebrow bru-eyebrow-line">Framework coverage</span>
          <h2 className="bru-h2" style={{ fontSize: 'clamp(2rem, 4.5vw, 3.6rem)', marginTop: 18 }}>
            Eighteen packs.<br />One evidence model.
          </h2>
        </div>
        <p className="bru-body hidden lg:block" style={{ maxWidth: '32ch' }}>
          Australian regulatory coverage and international standards, shipping today in the
          template and policy library — cross-mapped so one evidence item satisfies many.
        </p>
      </div>

      <Reveal>
        <div className="bru-wall">
          {FRAMEWORKS.map((f) => (
            <div className="bru-wall-cell" key={f}>{f}</div>
          ))}
        </div>
      </Reveal>

      <div className="bru-built">
        <span className="bru-built-label">Built on production infrastructure</span>
        {BUILT_ON.map((b) => (
          <span className="bru-built-name" key={b}>{b}</span>
        ))}
      </div>
    </section>
  );
}
