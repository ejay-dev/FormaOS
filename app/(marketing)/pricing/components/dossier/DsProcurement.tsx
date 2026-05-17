import {
  DsContainer,
  DsFolio,
  DsFolioHead,
  DsDisplay,
  DsLead,
  DsMeta,
  DsStamp,
  DsButton,
  DsPerf,
} from './primitives';

const PILLARS = [
  { title: 'Security review packet', detail: 'Structured packet covering architecture, identity, encryption, data handling, and audit defensibility for buyer review under NDA.' },
  { title: 'Procurement artifacts', detail: 'DPA, vendor assurance materials, enterprise service terms, and trust-center links for legal, risk, and procurement review.' },
  { title: 'Operational proof', detail: 'Compliance posture snapshots, evidence packages, control coverage reports, and framework alignment summaries — exported on demand, not reconstructed from spreadsheets.' },
  { title: 'Enterprise identity controls', detail: 'SAML SSO, MFA controls, role-based access by organisational boundary, and session policy management reviewed during enterprise evaluation.' },
];

/**
 * DsProcurement — "Procurement Annex" folio. Carries the Higgsfield-generated
 * "APPROVED" rubber-stamp accent image as the right-column plate, paired
 * with a numbered list of assurance pillars and the two procurement CTAs.
 */
export function DsProcurement() {
  return (
    <DsContainer width="wide">
      <DsFolio
        id="procurement"
        tabLabel="§ ANNEX C / PROCUREMENT ASSURANCE"
        tabTone="wax"
        watermark="PROCUREMENT"
      >
        <DsFolioHead
          strong
          meta={
            <>
              <DsMeta><strong>§06</strong> / ANNEX C</DsMeta>
              <DsMeta className="hidden sm:inline-flex">
                FOR LEGAL, RISK &amp; PROCUREMENT REVIEW
              </DsMeta>
            </>
          }
        />

        <div className="grid gap-x-10 gap-y-8 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <DsDisplay as="h2" size="lg">
              Built to survive security &amp; <em>procurement scrutiny.</em>
            </DsDisplay>
            <DsLead className="mt-5">
              Enterprise buyers need a clear review path. FormaOS surfaces
              materials, controls, and operating context early so security and
              procurement teams can evaluate against a published evidence base.
            </DsLead>

            <DsPerf className="mt-7 mb-7" />

            <ol className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {PILLARS.map((p, idx) => (
                <li
                  key={p.title}
                  className="grid grid-cols-[3rem_1fr] gap-3 border-t border-dashed border-[var(--ds-rule-strong)] pt-4"
                >
                  <span className="ds-typewriter text-[1.25rem] text-[var(--ds-wax)] tabular-nums">
                    {String(idx + 1).padStart(2, '0')}.
                  </span>
                  <div>
                    <h3 className="font-serif text-[1.0625rem] font-semibold leading-tight text-[var(--ds-ink)]">
                      {p.title}
                    </h3>
                    <p className="mt-1.5 ds-body text-[0.9375rem]">{p.detail}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <DsButton href="/security-review" variant="solid">
                Review Security Packet &rarr;
              </DsButton>
              <DsButton
                href="/contact?type=procurement&source=pricing_procurement"
                variant="outline"
              >
                Talk Sales Engineering
              </DsButton>
            </div>
          </div>

          <figure className="relative">
            <img
              src="/marketing-media/pricing-dossier-stamp.jpg"
              alt="A deep-red 'APPROVED' rubber-stamp impression on aged cream paper."
              loading="lazy"
              decoding="async"
              className="block w-full border border-[color:var(--ds-rule-strong)] shadow-[0_8px_24px_rgba(29,26,20,0.15)]"
            />
            <div className="pointer-events-none absolute -top-3 -right-3">
              <DsStamp tone="blue" size="sm">REVIEWED</DsStamp>
            </div>
            <figcaption className="ds-caption mt-3">
              FIG. 06 &mdash; Approved &middot; FY26 procurement intake.
              Photograph commissioned via Higgsfield.
            </figcaption>
          </figure>
        </div>
      </DsFolio>
    </DsContainer>
  );
}
