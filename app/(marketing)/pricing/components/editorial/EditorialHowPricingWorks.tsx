import {
  EditorialSection,
  EditorialHeadline,
  EditorialLead,
  EditorialRule,
} from './primitives';

const STEPS = [
  {
    title: 'Assess scope',
    body: 'Frameworks, sites, evidence volume, operational risk, and audit pressure define the commercial scope. There is no menu of paid feature unlocks underneath this — the same engine ships on every plan.',
  },
  {
    title: 'Configure enforcement',
    body: 'Controls become required actions, approvals, blocked states, and evidence trails. Workflow gates are not cosmetic: when a step is unmet, the work that depends on it does not proceed.',
  },
  {
    title: 'Operate continuously',
    body: 'FormaOS stays always-on in the background and generates evidence as work happens — not at audit time. Posture is a live metric, not a periodic project.',
  },
];

/**
 * EditorialHowPricingWorks — three numbered editorial paragraphs, hung
 * serif numerals, no card frame, no icon-frame neon. Reads as methodology
 * copy, not a process diagram.
 */
export function EditorialHowPricingWorks() {
  return (
    <EditorialSection
      id="pricing-methodology"
      num="05"
      label="Pricing methodology"
      width="wide"
    >
      <div className="mb-10 max-w-3xl">
        <EditorialHeadline as="h2" size="lg" className="mb-5">
          Priced by compliance scope, <em>not feature unlocks.</em>
        </EditorialHeadline>
        <EditorialLead>
          The shape of your plan is set by the regulated work, not by which
          dashboard you happen to want. Frameworks, sites, evidence volume,
          workflow complexity, and the level of support required &mdash; in
          that order &mdash; determine where you land on the ladder.
        </EditorialLead>
      </div>

      <ol className="max-w-3xl space-y-8">
        {STEPS.map((step, idx) => (
          <li
            key={step.title}
            className="grid grid-cols-[auto_1fr] gap-5 border-t border-[color:var(--ed-rule)] pt-5"
          >
            <span className="ed-section__num-fig pt-1 text-[1.125rem] tabular-nums">
              {String(idx + 1).padStart(2, '0')}.
            </span>
            <div>
              <h3 className="font-serif text-[1.25rem] font-semibold text-[var(--ed-ink)]">
                {step.title}
              </h3>
              <p className="ed-body-serif mt-2">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <EditorialRule className="mt-10" />
      <p className="ed-footnote mt-3">
        Pricing scales with your compliance scope and operating complexity
        &mdash; not arbitrary feature gates.
      </p>
    </EditorialSection>
  );
}
