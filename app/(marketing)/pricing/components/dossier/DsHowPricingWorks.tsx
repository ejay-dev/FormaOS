import {
  DsContainer,
  DsFolio,
  DsFolioHead,
  DsDisplay,
  DsLead,
  DsMeta,
  DsPerf,
} from './primitives';

const STEPS = [
  { title: 'Assess scope.', body: 'Frameworks, sites, evidence volume, operational risk, and audit pressure define the commercial scope. There is no menu of paid feature unlocks underneath this — the same engine ships on every plan.' },
  { title: 'Configure enforcement.', body: 'Controls become required actions, approvals, blocked states, and evidence trails. Workflow gates are not cosmetic: when a step is unmet, the work that depends on it does not proceed.' },
  { title: 'Operate continuously.', body: 'FormaOS stays always-on in the background and generates evidence as work happens — not at audit time. Posture is a live metric, not a periodic project.' },
];

/**
 * DsHowPricingWorks — "Methodology" folio. Numbered steps as typewriter-stamped
 * paragraphs. Tight, no decoration beyond the dossier-frame primitives.
 */
export function DsHowPricingWorks() {
  return (
    <DsContainer width="wide">
      <DsFolio
        id="pricing-methodology"
        tabLabel="§ METHOD / PRICING POLICY"
        watermark="METHODOLOGY"
      >
        <DsFolioHead
          strong
          meta={
            <>
              <DsMeta><strong>§05</strong> / METHODOLOGY</DsMeta>
              <DsMeta className="hidden sm:inline-flex">3 STEPS &middot; NO FEATURE GATES</DsMeta>
            </>
          }
        />

        <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_1fr] mb-10">
          <DsDisplay as="h2" size="lg">
            Priced by compliance scope, <em>not feature unlocks.</em>
          </DsDisplay>
          <DsLead>
            The shape of your plan is set by the regulated work, not by which
            dashboard you happen to want. Frameworks, sites, evidence volume,
            workflow complexity, and the level of support required &mdash; in
            that order &mdash; determine the tier.
          </DsLead>
        </div>

        <ol className="grid gap-8">
          {STEPS.map((step, idx) => (
            <li
              key={step.title}
              className="grid grid-cols-12 gap-5 border-t border-dashed border-[var(--ds-rule-strong)] pt-5"
            >
              <div className="col-span-12 lg:col-span-2">
                <span className="ds-typewriter text-[clamp(2.5rem,4vw,3.5rem)] text-[var(--ds-wax)] leading-none tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="col-span-12 lg:col-span-10">
                <h3 className="font-serif text-[1.375rem] font-semibold text-[var(--ds-ink)] leading-tight">
                  {step.title}
                </h3>
                <p className="mt-3 ds-body max-w-3xl">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <DsPerf className="mt-10 mb-3" />
        <DsMeta>
          PRICING SCALES WITH COMPLIANCE SCOPE AND OPERATING COMPLEXITY &middot;
          NOT ARBITRARY FEATURE GATES
        </DsMeta>
      </DsFolio>
    </DsContainer>
  );
}
