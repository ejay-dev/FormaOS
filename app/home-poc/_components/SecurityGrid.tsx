import { Reveal } from './Reveal';

/**
 * Security built into the platform layer — encryption, identity, tamper-evident
 * audit, control mapping, AU-hosting — plus a sample of what the audit trail
 * actually captures. Verbatim from the production SecuritySection.
 */

const CARDS = [
  {
    h: 'Encryption',
    rows: [
      ['Data at rest', 'AES-256'],
      ['Data in transit', 'TLS 1.3'],
      ['Key management', 'AWS KMS'],
      ['Backup encryption', 'AES-256'],
    ],
  },
  {
    h: 'Identity & access',
    rows: [
      ['SAML 2.0 SSO', 'Okta · Azure · Google'],
      ['MFA enforcement', 'All plans'],
      ['Role-based access', '4 roles'],
      ['Session control', 'Timeout · IP lock'],
    ],
  },
  {
    h: 'Control mapping',
    rows: [
      ['SOC 2 TSC', '61 / 61'],
      ['ISO 27001', '93 / 93'],
      ['NDIS Practice', '25 / 25'],
      ['Audit coverage', '100%'],
    ],
  },
];

const CAPTURE = [
  ['Evidence approved', 'CC6.1 · Logical access', 'Control owner', 'VERIFIED'],
  ['Control drift detected', 'A1.2 · Availability', 'System', 'ALERT'],
  ['Audit packet exported', 'SOC 2 Type II · Full', 'Workspace admin', 'VERIFIED'],
  ['Policy acknowledged', 'ISO 27001 · A.5.1', 'Policy reviewer', 'VERIFIED'],
  ['Worker credential updated', 'NDIS · Screening', 'Workforce coord.', 'VERIFIED'],
];

export function SecurityGrid() {
  return (
    <section className="bru-frame bru-section">
      <div className="bru-head" style={{ alignItems: 'end' }}>
        <div className="lg:max-w-[58%]">
          <span className="bru-eyebrow bru-eyebrow-line">Security &amp; trust</span>
          <h2 className="bru-h2" style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', marginTop: 18 }}>
            Security built into<br />the platform layer.
          </h2>
        </div>
        <p className="bru-body" style={{ maxWidth: '38ch' }}>
          Controls are enforced, not just documented. Encryption, identity governance, and
          tamper-evident logs are infrastructure — not add-ons.
        </p>
      </div>

      <Reveal>
        <div className="bru-sec">
          {CARDS.map((c) => (
            <div className="bru-sec-card" key={c.h}>
              <div className="bru-sec-h">{c.h}</div>
              {c.rows.map(([k, v]) => (
                <div className="bru-sec-row" key={k}>
                  <span className="bru-sec-k">{k}</span>
                  <span className="bru-sec-v">{v}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="bru-capture">
          <div className="bru-capture-h">What the audit trail captures · hash-chained, append-only</div>
          {CAPTURE.map(([ev, ctl, who, st]) => (
            <div className="bru-capture-row" key={ev}>
              <span style={{ color: 'var(--ink)' }}>{ev}</span>
              <span className="bru-cap-hide" style={{ color: 'var(--ink-dim)' }}>{ctl}</span>
              <span className="bru-cap-hide" style={{ color: 'var(--ink-faint)' }}>{who}</span>
              <span className={`dash-pill ${st === 'ALERT' ? 'dash-pill-fail' : ''}`}>{st}</span>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
