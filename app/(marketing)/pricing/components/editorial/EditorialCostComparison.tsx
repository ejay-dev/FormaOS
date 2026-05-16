import { MANUAL_COMPLIANCE_COST_ANCHORS } from '@/lib/marketing/pricing';
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLead,
  EditorialPullQuote,
  EditorialRule,
} from './primitives';

/**
 * EditorialCostComparison — "Manual vs Enforced" comparison set as an
 * editorial two-column ledger, with a pull quote close-out. No neon-rose
 * dots, no emerald check pulses, no glassy card panel.
 */
export function EditorialCostComparison() {
  return (
    <EditorialSection
      id="cost-in-context"
      num="04"
      label="Cost in context"
      width="wide"
    >
      <div className="mb-10 max-w-3xl">
        <EditorialHeadline as="h2" size="lg" className="mb-5">
          One failed audit costs more than{' '}
          <em>a year of FormaOS.</em>
        </EditorialHeadline>
        <EditorialLead>
          Pricing only makes sense when measured against the work it replaces
          &mdash; evidence chasing, repeated reviews, escalation gaps, and
          remediation after findings. The ledger below is the comparison
          FormaOS customers report, before vs after.
        </EditorialLead>
      </div>

      <div className="overflow-hidden border-t border-[color:var(--ed-rule-strong)] border-b">
        <div className="grid grid-cols-1 md:grid-cols-[10rem_1fr_1fr]">
          <div className="ed-eyebrow-caps hidden border-r border-[color:var(--ed-rule)] px-5 py-3 md:block">
            Dimension
          </div>
          <div className="ed-eyebrow-caps border-r border-[color:var(--ed-rule)] px-5 py-3">
            Manual <span className="text-[var(--ed-ink-faint)]">(pre-FormaOS)</span>
          </div>
          <div className="ed-eyebrow-caps px-5 py-3">
            System enforced
          </div>
        </div>

        {MANUAL_COMPLIANCE_COST_ANCHORS.map((item) => (
          <div
            key={item.label}
            className="grid grid-cols-1 border-t border-[color:var(--ed-rule)] md:grid-cols-[10rem_1fr_1fr]"
          >
            <div className="border-[color:var(--ed-rule)] px-5 py-4 md:border-r">
              <div className="ed-eyebrow md:hidden">Dimension</div>
              <div className="font-serif text-[1rem] font-semibold text-[var(--ed-ink)]">
                {item.label}
              </div>
            </div>
            <div className="border-t border-[color:var(--ed-rule)] px-5 py-4 md:border-t-0 md:border-r">
              <div className="ed-eyebrow md:hidden">Manual</div>
              <div className="ed-body-serif text-[1.0625rem] text-[var(--ed-accent-ink)]">
                {item.manual}
              </div>
            </div>
            <div className="border-t border-[color:var(--ed-rule)] px-5 py-4 md:border-t-0">
              <div className="ed-eyebrow md:hidden">Enforced</div>
              <div className="ed-body-serif text-[1.0625rem] text-[var(--ed-ink)]">
                {item.formaos}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 mx-auto max-w-3xl">
        <EditorialPullQuote attribution="What providers tell us, in their own words">
          The annual FormaOS bill costs less than a single accreditation
          finding &mdash; and finding-free audits are now the baseline.
        </EditorialPullQuote>
      </div>

      <EditorialRule className="mt-10" />
      <p className="ed-footnote mt-3">
        Sources: FormaOS customer interviews, NDIS Commission published
        finding reports, AIHW care-sector audit cost benchmarks.
      </p>
    </EditorialSection>
  );
}
