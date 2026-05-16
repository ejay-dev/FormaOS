import {
  EditorialSection,
  EditorialHeadline,
  EditorialLead,
  EditorialRule,
} from './primitives';

const FOUNDATIONS = [
  {
    title: 'Immutable audit trail',
    description:
      'Every action timestamped and tamper-evident — ready for regulator review without spreadsheet reconstruction.',
  },
  {
    title: 'Evidence vault',
    description:
      'Versioned, encrypted, and chain-of-custody documentation for every control across every framework.',
  },
  {
    title: 'Workflow governance',
    description:
      'Compliance enforced as work happens — not policies that live in a folder and are remembered at audit time.',
  },
  {
    title: 'Role-based security',
    description:
      'Granular access controls by role, function, site, and organisational boundary; full audit log of access events.',
  },
  {
    title: 'Control ownership',
    description:
      'Every control assigned, tracked, and accountable to a named person or team — never collectively owned.',
  },
  {
    title: 'Real-time monitoring',
    description:
      'Continuous compliance score with drift detection across every framework in your scope.',
  },
  {
    title: 'Multi-framework support',
    description:
      'NDIS Practice Standards, NSQHS, NQF, ISO 27001, SOC 2, HIPAA, GDPR — mapped, maintained, and renewed.',
  },
  {
    title: 'Live data portability',
    description:
      'Upgrade, downgrade, or exit with full evidence export — no contractual lock-in on any plan, ever.',
  },
];

/**
 * EditorialAllPlansInclude — what every plan ships with, framed as a
 * publisher's standing notice. Hung serif numerals against a two-column
 * editorial list. No icons, no card containers, no glow rings.
 */
export function EditorialAllPlansInclude() {
  return (
    <EditorialSection
      id="all-plans-include"
      num="03"
      label="What every plan includes"
      width="wide"
    >
      <div className="mb-10 max-w-3xl">
        <EditorialHeadline as="h2" size="lg" className="mb-5">
          The foundation <em>under every tier.</em>
        </EditorialHeadline>
        <EditorialLead>
          Tier choice changes scope and procurement motion, not regulatory
          defensibility. The list below holds on Foundation, on Enterprise,
          and on every plan in between.
        </EditorialLead>
      </div>

      <ol className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
        {FOUNDATIONS.map((item, idx) => (
          <li
            key={item.title}
            className="grid grid-cols-[auto_1fr] gap-4 border-t border-[color:var(--ed-rule)] pt-4"
          >
            <span className="ed-section__num-fig pt-0.5 tabular-nums">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <div>
              <h3 className="text-[1rem] font-semibold text-[var(--ed-ink)] leading-snug">
                {item.title}
              </h3>
              <p className="ed-body mt-1.5 text-[0.9375rem]">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ol>

      <EditorialRule className="mt-10" />
      <p className="ed-footnote mt-3">
        No tier on FormaOS compromises regulatory defensibility. Upgrading or
        downgrading preserves your evidence, audit log, frameworks, and
        controls in full.
      </p>
    </EditorialSection>
  );
}
