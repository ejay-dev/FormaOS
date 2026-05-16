import {
  MxBlock,
  MxContainer,
  MxDisplay,
  MxLead,
  MxButton,
  MxDuotone,
  MxRule,
} from './primitives';

const PILLARS = [
  { title: 'Security review packet', detail: 'Structured packet covering architecture, identity, encryption, data handling, and audit defensibility for buyer review under NDA.' },
  { title: 'Procurement artifacts', detail: 'DPA, vendor assurance materials, enterprise service terms, and trust-center links for legal, risk, and procurement review.' },
  { title: 'Operational proof', detail: 'Compliance posture snapshots, evidence packages, control coverage reports, and framework alignment summaries — exported on demand, not reconstructed from spreadsheets.' },
  { title: 'Enterprise identity controls', detail: 'SAML SSO, MFA controls, role-based access by organisational boundary, and session policy management reviewed during enterprise evaluation.' },
];

/**
 * MxProcurement — oxblood block (echoes hero), cream type, duotone figure
 * on the right. Checklist as four hung-numeral items, CTAs at the close.
 */
export function MxProcurement() {
  return (
    <MxBlock tone="oxblood" id="procurement" rail="§06 / PROCUREMENT">
      <MxContainer width="full">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">
          <div className="col-span-12 lg:col-span-8">
            <p className="mx-eyebrow opacity-80">§06 / PROCUREMENT ASSURANCE</p>
            <MxDisplay as="h2" size="xxl" className="mt-5 max-w-3xl">
              Built to survive security &amp; <em>procurement scrutiny.</em>
            </MxDisplay>
            <MxLead className="mt-6 max-w-2xl opacity-95">
              Enterprise buyers need a clear review path. FormaOS surfaces
              materials, controls, and operating context early so security
              and procurement teams can evaluate with less back-and-forth
              &mdash; and so legal can complete review against a published
              evidence base.
            </MxLead>
          </div>
          <div className="col-span-12 lg:col-span-4">
            <MxDuotone
              src="/marketing-media/security.jpg"
              alt=""
              tone="oxblood"
              aspect="3 / 4"
            />
            <p className="mx-caption mt-3 opacity-80">
              Fig. 06 &mdash; procurement evidence pack.
              <br />
              Placeholder; final imagery via Higgsfield.
            </p>
          </div>
        </div>

        <MxRule bold className="mt-14 mb-10" />

        <ol className="grid gap-x-10 gap-y-8 lg:grid-cols-2">
          {PILLARS.map((p, idx) => (
            <li
              key={p.title}
              className="grid grid-cols-[5rem_1fr] gap-4 border-t border-[var(--mx-bold-rule)] pt-5"
            >
              <span className="font-serif italic text-[3rem] leading-none opacity-90 tabular-nums">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-serif text-[1.375rem] font-medium leading-tight">
                  {p.title}
                </h3>
                <p className="mt-2 mx-body opacity-90">{p.detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <MxButton href="/security-review" variant="solid-cream">
            Review security packet &rarr;
          </MxButton>
          <MxButton
            href="/contact?type=procurement&source=pricing_procurement"
            variant="outline"
            className="text-[var(--mx-cream)]"
          >
            Talk with sales engineering
          </MxButton>
        </div>
      </MxContainer>
    </MxBlock>
  );
}
