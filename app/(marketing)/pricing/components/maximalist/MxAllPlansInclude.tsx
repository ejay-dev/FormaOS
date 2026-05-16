import {
  MxBlock,
  MxContainer,
  MxDisplay,
  MxLead,
  MxRule,
} from './primitives';

const FOUNDATIONS = [
  { title: 'Immutable audit trail', description: 'Every action timestamped and tamper-evident — ready for regulator review without spreadsheet reconstruction.' },
  { title: 'Evidence vault', description: 'Versioned, encrypted, and chain-of-custody documentation for every control across every framework.' },
  { title: 'Workflow governance', description: 'Compliance enforced as work happens — not policies that live in a folder and are remembered at audit time.' },
  { title: 'Role-based security', description: 'Granular access controls by role, function, site, and organisational boundary; full audit log of access events.' },
  { title: 'Control ownership', description: 'Every control assigned, tracked, and accountable to a named person or team — never collectively owned.' },
  { title: 'Real-time monitoring', description: 'Continuous compliance score with drift detection across every framework in your scope.' },
  { title: 'Multi-framework support', description: 'NDIS Practice Standards, NSQHS, NQF, ISO 27001, SOC 2, HIPAA, GDPR — mapped, maintained, and renewed.' },
  { title: 'Live data portability', description: 'Upgrade, downgrade, or exit with full evidence export — no contractual lock-in on any plan, ever.' },
];

/**
 * MxAllPlansInclude — forest block, cream type, large-numeral list. Two-column
 * editorial grid with hung numerals; standing-notice voice.
 */
export function MxAllPlansInclude() {
  return (
    <MxBlock tone="forest" id="all-plans-include" rail="§03 / FOUNDATIONS">
      <MxContainer width="full">
        <div className="grid grid-cols-12 items-end gap-6 border-b-[6px] border-[var(--mx-cream)] pb-6 mb-10">
          <div className="col-span-12 lg:col-span-7">
            <p className="mx-eyebrow opacity-80">§03 / WHAT EVERY PLAN INCLUDES</p>
            <MxDisplay as="h2" size="xl" className="mt-4">
              The foundation <em>under every tier.</em>
            </MxDisplay>
          </div>
          <div className="col-span-12 lg:col-span-5">
            <MxLead className="opacity-90">
              Tier choice changes scope and procurement motion, not regulatory
              defensibility. The list below holds on Foundation, on Enterprise,
              and on every plan in between.
            </MxLead>
          </div>
        </div>

        <ol className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {FOUNDATIONS.map((item, idx) => (
            <li
              key={item.title}
              className="grid grid-cols-[5rem_1fr] gap-4 border-t border-[var(--mx-bold-rule)] pt-5"
            >
              <span className="font-serif text-[3rem] italic leading-none opacity-90 tabular-nums">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="font-serif text-[1.25rem] font-medium leading-tight">
                  {item.title}
                </h3>
                <p className="mt-2 mx-body opacity-85">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <MxRule className="mt-12" />
        <p className="mx-caption mt-3 opacity-80">
          No tier on FormaOS compromises regulatory defensibility. Upgrading
          or downgrading preserves your evidence, audit log, frameworks, and
          controls in full.
        </p>
      </MxContainer>
    </MxBlock>
  );
}
