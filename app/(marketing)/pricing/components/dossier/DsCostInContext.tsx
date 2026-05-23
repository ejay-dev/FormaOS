import { MANUAL_COMPLIANCE_COST_ANCHORS } from '@/lib/marketing/pricing';
import {
  DsContainer,
  DsFolio,
  DsFolioHead,
  DsDisplay,
  DsLead,
  DsMeta,
  DsStamp,
  DsField,
  DsRedacted,
  DsPerf,
} from './primitives';

/**
 * DsCostInContext — "Evidentiary Ledger" folio. Each cost anchor is laid
 * out as a form field (label + value), Manual / Enforced shown as two
 * stacked rows with the manual side stamped DENIED-style in stamp-red,
 * the enforced side stamped APPROVED in stamp-green. A redacted block
 * sits inline in the closing line — a quiet visual joke that fits the
 * dossier register.
 */
export function DsCostInContext() {
  return (
    <DsContainer width="wide">
      <DsFolio
        id="cost-in-context"
        tabLabel="§ EXHIBIT 04 / COST IN CONTEXT"
        watermark="EXHIBIT 04"
      >
        <DsFolioHead
          strong
          meta={
            <>
              <DsMeta><strong>§04</strong> / EVIDENTIARY LEDGER</DsMeta>
              <DsMeta className="hidden sm:inline-flex">
                BEFORE / AFTER FORMAOS
              </DsMeta>
            </>
          }
        />

        <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_1fr_auto] mb-10">
          <DsDisplay as="h2" size="xl">
            One failed audit costs more than{' '}
            <em>a year of FormaOS.</em>
          </DsDisplay>
          <DsLead>
            Pricing only makes sense measured against the work it replaces
            &mdash; evidence chasing, repeated reviews, escalation gaps, and
            remediation after findings.
          </DsLead>
          <div className="hidden lg:block">
            <DsStamp tone="red" size="lg" rotation="right">
              FINDING ↦ $$$
            </DsStamp>
          </div>
        </div>

        {/* Manual column */}
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-baseline justify-between">
              <DsMeta><strong>STATE A</strong> / MANUAL (PRE-FORMAOS)</DsMeta>
              <DsStamp tone="red" size="sm" rotation="flat">DENIED</DsStamp>
            </div>
            <div className="border-t-2 border-[var(--ds-rule-strong)]">
              {MANUAL_COMPLIANCE_COST_ANCHORS.map((item) => (
                <DsField key={`m-${item.label}`} label={item.label}>
                  <span className="italic text-[var(--ds-wax)]">{item.manual}</span>
                </DsField>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-4 flex items-baseline justify-between">
              <DsMeta><strong>STATE B</strong> / SYSTEM ENFORCED</DsMeta>
              <DsStamp tone="green" size="sm" rotation="flat">APPROVED</DsStamp>
            </div>
            <div className="border-t-2 border-[var(--ds-rule-strong)]">
              {MANUAL_COMPLIANCE_COST_ANCHORS.map((item) => (
                <DsField key={`f-${item.label}`} label={item.label}>
                  {item.formaos}
                </DsField>
              ))}
            </div>
          </div>
        </div>

        <DsPerf className="mt-10 mb-3" />
        <p className="ds-body">
          Cited remediation budgets for a single Commission finding ranged
          from <DsRedacted width="3.5em" /> to <DsRedacted width="4.5em" /> per
          customer &mdash; well beyond a year of FormaOS on any tier.
          <span className="ds-meta ml-2">(SOURCE: REDACTED, NDA PROTECTED.)</span>
        </p>
      </DsFolio>
    </DsContainer>
  );
}
