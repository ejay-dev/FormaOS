import {
  EditorialSection,
  EditorialHeadline,
  EditorialLead,
  EditorialButton,
  EditorialRule,
} from './primitives';

const PILLARS = [
  {
    title: 'Security review packet',
    detail:
      'Structured packet covering architecture, identity, encryption, data handling, and audit defensibility for buyer review under NDA.',
  },
  {
    title: 'Procurement artifacts',
    detail:
      'DPA, vendor assurance materials, enterprise service terms, and trust-center links for legal, risk, and procurement review.',
  },
  {
    title: 'Operational proof',
    detail:
      'Compliance posture snapshots, evidence packages, control coverage reports, and framework alignment summaries — exported on demand, not reconstructed from spreadsheets.',
  },
  {
    title: 'Enterprise identity controls',
    detail:
      'SAML SSO, MFA controls, role-based access by organisational boundary, and session policy management reviewed during enterprise evaluation.',
  },
];

/**
 * EditorialProcurement — buyer-assurance checklist set as an editorial
 * standing notice, with two CTA actions inline-set at the close.
 */
export function EditorialProcurement() {
  return (
    <EditorialSection
      id="procurement"
      num="06"
      label="Procurement assurance"
      width="wide"
    >
      <div className="mb-10 max-w-3xl">
        <EditorialHeadline as="h2" size="lg" className="mb-5">
          Built to survive security and <em>procurement scrutiny.</em>
        </EditorialHeadline>
        <EditorialLead>
          Enterprise buyers need a clear review path. FormaOS surfaces the
          materials, controls, and operating context early so security and
          procurement teams can evaluate with less back-and-forth, and so
          legal can complete review against a published evidence base.
        </EditorialLead>
      </div>

      <ol className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
        {PILLARS.map((pillar, idx) => (
          <li
            key={pillar.title}
            className="grid grid-cols-[auto_1fr] gap-4 border-t border-[color:var(--ed-rule)] pt-5"
          >
            <span className="ed-section__num-fig pt-0.5 tabular-nums">
              0{idx + 1}
            </span>
            <div>
              <h3 className="font-serif text-[1.125rem] font-semibold text-[var(--ed-ink)]">
                {pillar.title}
              </h3>
              <p className="ed-body mt-1.5 text-[0.9375rem]">{pillar.detail}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <EditorialButton href="/security-review" variant="solid">
          Review security packet &rarr;
        </EditorialButton>
        <EditorialButton
          href="/contact?type=procurement&source=pricing_procurement"
          variant="ghost"
        >
          Talk with sales engineering
        </EditorialButton>
      </div>

      <EditorialRule className="mt-10" />
    </EditorialSection>
  );
}
