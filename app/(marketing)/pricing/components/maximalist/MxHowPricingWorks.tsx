import {
  MxBlock,
  MxContainer,
  MxDisplay,
  MxLead,
  MxRule,
} from './primitives';

const STEPS = [
  {
    title: 'Assess scope.',
    body: 'Frameworks, sites, evidence volume, operational risk, and audit pressure define the commercial scope. There is no menu of paid feature unlocks underneath this — the same engine ships on every plan.',
  },
  {
    title: 'Configure enforcement.',
    body: 'Controls become required actions, approvals, blocked states, and evidence trails. Workflow gates are not cosmetic: when a step is unmet, the work that depends on it does not proceed.',
  },
  {
    title: 'Operate continuously.',
    body: 'FormaOS stays always-on in the background and generates evidence as work happens — not at audit time. Posture is a live metric, not a periodic project.',
  },
];

/**
 * MxHowPricingWorks — cream block. Three numbered editorial paragraphs;
 * each numeral is a 10-14rem serif italic glyph, body is serif standfirst.
 * The page's eye-relief moment between dark blocks.
 */
export function MxHowPricingWorks() {
  return (
    <MxBlock tone="cream" id="pricing-methodology" rail="§05 / METHOD">
      <MxContainer width="full">
        <div className="grid grid-cols-12 items-end gap-6 border-b-[6px] border-[var(--mx-ink)] pb-6 mb-12">
          <div className="col-span-12 lg:col-span-7">
            <p className="mx-eyebrow opacity-70">§05 / PRICING METHODOLOGY</p>
            <MxDisplay as="h2" size="xl" className="mt-4">
              Priced by compliance scope, <em>not feature unlocks.</em>
            </MxDisplay>
          </div>
          <div className="col-span-12 lg:col-span-5">
            <MxLead className="text-[var(--mx-ink-mid)]">
              The shape of your plan is set by the regulated work, not by
              which dashboard you happen to want. Frameworks, sites, evidence
              volume, workflow complexity, and the level of support required
              &mdash; in that order &mdash; determine where you land on the
              ladder.
            </MxLead>
          </div>
        </div>

        <ol className="space-y-10">
          {STEPS.map((step, idx) => (
            <li
              key={step.title}
              className="grid grid-cols-12 gap-6 border-t border-[var(--mx-paper-rule-strong)] pt-7"
            >
              <div className="col-span-12 lg:col-span-3">
                <span className="font-serif italic text-[clamp(6rem,12vw,14rem)] leading-[0.78] tabular-nums opacity-90">
                  {String(idx + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="col-span-12 lg:col-span-9">
                <h3 className="mx-display mx-display--lg m-0">{step.title}</h3>
                <p className="mt-5 mx-body-serif max-w-2xl">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <MxRule className="mt-12" />
        <p className="mx-caption mt-3 opacity-70">
          Pricing scales with your compliance scope and operating complexity
          &mdash; not arbitrary feature gates.
        </p>
      </MxContainer>
    </MxBlock>
  );
}
