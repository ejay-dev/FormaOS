import { MANUAL_COMPLIANCE_COST_ANCHORS } from '@/lib/marketing/pricing';
import {
  MxBlock,
  MxContainer,
  MxDisplay,
  MxLead,
  MxPullQuote,
  MxRule,
  MxDuotone,
} from './primitives';

/**
 * MxCostInContext — midnight block. The page's biggest editorial moment.
 * Monumental headline, two-column Manual / Enforced ledger set in serif,
 * full-bleed duotone documentary photograph on the right, and a pull quote
 * close-out in oversized cream serif italic.
 */
export function MxCostInContext() {
  return (
    <MxBlock tone="midnight" id="cost-in-context" rail="§04 / COST">
      <MxContainer width="full">
        <div className="grid grid-cols-12 gap-x-6 gap-y-10">
          <div className="col-span-12 lg:col-span-8">
            <p className="mx-eyebrow opacity-70">§04 / COST IN CONTEXT</p>
            <MxDisplay
              as="h2"
              size="xxl"
              className="mt-5 max-w-3xl"
            >
              One failed audit <em>costs more</em> than{' '}
              a year of FormaOS.
            </MxDisplay>
            <MxLead className="mt-7 max-w-2xl opacity-90">
              Pricing only makes sense when measured against the work it
              replaces &mdash; evidence chasing, repeated reviews, escalation
              gaps, and remediation after findings. The ledger below is the
              comparison FormaOS customers report, before vs after.
            </MxLead>
          </div>
          <div className="col-span-12 lg:col-span-4">
            <MxDuotone
              src="/marketing-media/audit-evidence-management.jpg"
              alt=""
              tone="midnight"
              aspect="3 / 4"
            />
            <p className="mx-caption mt-3 opacity-70">
              Fig. 04 &mdash; archival compliance documentation.
              <br />
              Placeholder; final imagery via Higgsfield.
            </p>
          </div>
        </div>

        <MxRule bold className="mt-14 mb-10" />

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3">
            <p className="mx-eyebrow opacity-70">DIMENSION</p>
          </div>
          <div className="col-span-12 lg:col-span-4">
            <p className="mx-eyebrow opacity-70">
              MANUAL <span className="opacity-50">(PRE-FORMAOS)</span>
            </p>
          </div>
          <div className="col-span-12 lg:col-span-5">
            <p className="mx-eyebrow opacity-70">SYSTEM ENFORCED</p>
          </div>
        </div>

        <ul className="mt-4 border-t-2 border-[var(--mx-bold-rule)]">
          {MANUAL_COMPLIANCE_COST_ANCHORS.map((item) => (
            <li
              key={item.label}
              className="grid grid-cols-12 gap-6 border-b border-[var(--mx-bold-rule)] py-6 items-baseline"
            >
              <div className="col-span-12 lg:col-span-3">
                <p className="font-serif text-[1.5rem] font-medium leading-tight">
                  {item.label}
                </p>
              </div>
              <div className="col-span-12 lg:col-span-4">
                <p className="font-serif italic text-[var(--mx-mustard)] text-[1.5rem] leading-tight">
                  {item.manual}
                </p>
              </div>
              <div className="col-span-12 lg:col-span-5">
                <p className="mx-body-serif">{item.formaos}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-16 grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-2">
            <p className="mx-eyebrow opacity-70">QUOTE</p>
          </div>
          <div className="col-span-12 lg:col-span-10">
            <MxPullQuote attribution="WHAT PROVIDERS TELL US, IN THEIR OWN WORDS">
              The annual FormaOS bill costs less than a single accreditation
              finding &mdash; and finding-free audits are now the baseline.
            </MxPullQuote>
          </div>
        </div>
      </MxContainer>
    </MxBlock>
  );
}
