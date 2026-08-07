/**
 * FAQ — native <details> accordion (no JS, robust). Real answers sourced from
 * the trust/audit-chain/objection content.
 */

const QA = [
  ['Which frameworks ship today?', 'Eight framework packs ship in the template and policy library now — NDIS Practice Standards, Aged Care Quality Standards, NSQHS, SOC 2, ISO 27001, HIPAA, Essential Eight and more — cross-mapped so one evidence item can satisfy multiple frameworks.'],
  ['How is the audit log tamper-evident?', 'Each row is HMAC-SHA256 chained to the previous one and the chain top is anchored daily to Sigstore Rekor (an RFC 6962 transparency log). A BEFORE UPDATE OR DELETE trigger plus restrictive RLS reject any mutation — even a service-role admin is stopped by the database, not application code.'],
  ['Where is our data stored?', 'AU-hosted by default (Sydney region). Additional residency requirements are reviewed during procurement, with a Data Processing Agreement available for legal review.'],
  ['Can we export our data if we leave?', 'Yes. Evidence, controls, audit trails, and framework mappings export in standard formats (PDF, CSV, JSON). Full data portability is guaranteed.'],
  ['Do you support SSO and MFA?', 'SAML 2.0 SSO (Okta, Azure AD, Google) and MFA enforcement are available on all plans, with role-based access across four roles and session timeout / IP controls.'],
  ['How long does audit preparation take?', 'On demand. An auditor bundle — framework summary, SHA-256 evidence references, automation log, score history, and the Rekor-anchored chain top — exports as a single ZIP, rather than days of reconstruction.'],
] as const;

export function Faq() {
  return (
    <section className="bru-frame bru-section">
      <div className="bru-head">
        <div>
          <span className="bru-eyebrow bru-eyebrow-line">Questions</span>
          <h2 className="bru-h2" style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)', marginTop: 18 }}>
            Answered before<br />you ask.
          </h2>
        </div>
      </div>

      <div className="bru-faq">
        {QA.map(([q, a]) => (
          <details key={q}>
            <summary>
              <span>{q}</span>
              <span className="bru-faq-mk" aria-hidden>+</span>
            </summary>
            <p className="bru-faq-a">{a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
