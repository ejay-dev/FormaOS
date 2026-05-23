import {
  DsContainer,
  DsFolio,
  DsFolioHead,
  DsDisplay,
  DsLead,
  DsMeta,
  DsStamp,
  DsPerf,
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
 * DsAllPlansInclude — "Standing Notice" folio. Stamped numbered list of
 * what every plan ships with, regardless of tier.
 */
export function DsAllPlansInclude() {
  return (
    <DsContainer width="wide">
      <DsFolio
        id="all-plans-include"
        tabLabel="§ STANDING NOTICE / ON ALL TIERS"
        tabTone="blue"
        watermark="STANDING NOTICE"
      >
        <DsFolioHead
          strong
          meta={
            <>
              <DsMeta><strong>§03</strong> / FOUNDATIONS</DsMeta>
              <DsMeta className="hidden sm:inline-flex">
                APPLIES TO ALL FOUR PLANS &middot; NON-NEGOTIABLE
              </DsMeta>
            </>
          }
        />

        <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_1fr_auto] mb-10">
          <DsDisplay as="h2" size="lg">
            The foundation <em>under every tier.</em>
          </DsDisplay>
          <DsLead>
            Tier choice changes scope and procurement motion, not regulatory
            defensibility. The list below holds on Foundation and Enterprise
            alike.
          </DsLead>
          <div className="hidden lg:block">
            <DsStamp tone="green" size="lg">EFFECTIVE FY26</DsStamp>
          </div>
        </div>

        <ol className="grid gap-x-12 gap-y-7 sm:grid-cols-2">
          {FOUNDATIONS.map((item, idx) => (
            <li
              key={item.title}
              className="grid grid-cols-[3.5rem_1fr] gap-4 border-t border-dashed border-[var(--ds-rule-strong)] pt-5"
            >
              <span className="ds-typewriter text-[1.5rem] tabular-nums text-[var(--ds-wax)]">
                {String(idx + 1).padStart(2, '0')}.
              </span>
              <div>
                <h3 className="font-serif text-[1.125rem] font-semibold leading-snug text-[var(--ds-ink)]">
                  {item.title}
                </h3>
                <p className="mt-1.5 ds-body text-[0.9375rem]">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <DsPerf className="mt-10 mb-3" />
        <DsMeta>
          NO TIER ON FORMAOS COMPROMISES REGULATORY DEFENSIBILITY &middot;
          UPGRADING OR DOWNGRADING PRESERVES EVIDENCE, AUDIT LOG, FRAMEWORKS
          IN FULL
        </DsMeta>
      </DsFolio>
    </DsContainer>
  );
}
