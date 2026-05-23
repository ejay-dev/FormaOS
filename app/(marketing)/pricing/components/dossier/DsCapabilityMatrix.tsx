import { Fragment } from 'react';
import {
  DsContainer,
  DsFolio,
  DsFolioHead,
  DsDisplay,
  DsLead,
  DsMeta,
  DsPerf,
} from './primitives';

type Cell = '✓' | '—' | string;
type Row = { label: string; hint?: string; basic: Cell; pro: Cell; scale: Cell; enterprise: Cell };
type Group = { title: string; rows: Row[] };

const GROUPS: Group[] = [
  { title: 'Core compliance', rows: [
    { label: 'Compliance engine', hint: 'Workflow enforcement, control evaluation, evidence capture', basic: '✓', pro: '✓', scale: '✓', enterprise: '✓' },
    { label: 'Tasks and evidence trail', basic: '✓', pro: '✓', scale: '✓', enterprise: '✓' },
    { label: 'Immutable audit log', basic: '✓', pro: '✓', scale: '✓', enterprise: '✓' },
    { label: 'Workflow approval gates', basic: 'Basic', pro: 'Full', scale: 'Full', enterprise: 'Full' },
    { label: 'Workflow automation', hint: 'Triggers, scheduled controls, cross-team escalations', basic: '—', pro: '—', scale: '✓', enterprise: '✓' },
  ]},
  { title: 'Frameworks and controls', rows: [
    { label: 'Compliance frameworks included', basic: '2', pro: '4', scale: 'Unlimited', enterprise: 'Unlimited' },
    { label: 'NDIS Practice Standards pre-built', basic: '✓', pro: '✓', scale: '✓', enterprise: '✓' },
    { label: 'Aged Care Quality Standards roadmap', basic: '✓', pro: '✓', scale: '✓', enterprise: '✓' },
    { label: 'SOC 2, ISO 27001, NIST CSF, CIS, HIPAA, GDPR, PCI-DSS', hint: 'Pre-built framework packs from the library', basic: 'Pick 2', pro: 'Pick 4', scale: 'Full library', enterprise: 'Full library' },
    { label: 'Australian Financial Services compliance pack', basic: '—', pro: '✓', scale: '✓', enterprise: '✓' },
    { label: 'Custom frameworks and controls', hint: 'User-defined frameworks built to your contractual requirements', basic: '—', pro: '—', scale: '—', enterprise: '✓' },
  ]},
  { title: 'Team and sites', rows: [
    { label: 'Users included', basic: '10', pro: '25', scale: '75', enterprise: 'Unlimited' },
    { label: 'Sites / locations', basic: '1', pro: 'Up to 3', scale: 'Unlimited', enterprise: 'Unlimited' },
    { label: 'Role-based access control', basic: '✓', pro: '✓', scale: '✓', enterprise: '✓' },
    { label: 'Multi-team usage', basic: '—', pro: '✓', scale: '✓', enterprise: '✓' },
    { label: 'Multi-site governance dashboard', basic: '—', pro: '—', scale: '✓', enterprise: '✓' },
  ]},
  { title: 'Audit and evidence', rows: [
    { label: 'Audit log export for Commission reviews', basic: '✓', pro: '✓', scale: '✓', enterprise: '✓' },
    { label: 'Real-time evidence capture', basic: '—', pro: '✓', scale: '✓', enterprise: '✓' },
    { label: 'Worker screening and credential expiry alerts', basic: '—', pro: '✓', scale: '✓', enterprise: '✓' },
    { label: 'Audit-period assistance', hint: 'Hands-on support during NDIS Commission and accreditation reviews', basic: '—', pro: '—', scale: '—', enterprise: '✓' },
  ]},
  { title: 'Reporting', rows: [
    { label: 'Framework evaluation reports', basic: '✓', pro: '✓', scale: '✓', enterprise: '✓' },
    { label: 'Posture and risk reporting', basic: '—', pro: 'Standard', scale: 'Advanced', enterprise: 'Advanced' },
    { label: 'Executive rollup reporting', hint: 'Cross-entity board and leadership reporting', basic: '—', pro: '—', scale: '—', enterprise: '✓' },
  ]},
  { title: 'Integrations and API', rows: [
    { label: 'Webhook integrations', hint: 'Push compliance events into your stack (Slack, ITSM, data warehouse)', basic: '—', pro: '—', scale: '✓', enterprise: '✓' },
    { label: 'Public API access', basic: '—', pro: '—', scale: '—', enterprise: '✓' },
    { label: 'Custom integrations', basic: '—', pro: '—', scale: '—', enterprise: '✓' },
  ]},
  { title: 'Security and identity', rows: [
    { label: 'SSO and SAML', hint: 'Single sign-on via your identity provider (Okta, Azure AD, Google)', basic: '—', pro: '—', scale: '—', enterprise: '✓' },
    { label: 'Directory sync and provisioning', basic: '—', pro: '—', scale: '—', enterprise: '✓' },
    { label: 'Retention governance', basic: '—', pro: '—', scale: '—', enterprise: '✓' },
  ]},
  { title: 'Onboarding and support', rows: [
    { label: 'Guided setup checklist', basic: '✓', pro: '✓', scale: '✓', enterprise: '✓' },
    { label: 'Implementation support', basic: '—', pro: '✓', scale: '✓', enterprise: '✓' },
    { label: 'Dedicated onboarding session', basic: '—', pro: '—', scale: '✓', enterprise: '✓' },
    { label: 'White-glove onboarding', basic: '—', pro: '—', scale: '—', enterprise: '✓' },
    { label: 'Email support', basic: '✓', pro: 'Priority', scale: 'Priority', enterprise: 'Priority' },
    { label: 'Response SLA', basic: '—', pro: '—', scale: '✓', enterprise: 'Custom' },
    { label: 'Dedicated account manager', basic: '—', pro: '—', scale: '—', enterprise: '✓' },
  ]},
  { title: 'Procurement', rows: [
    { label: 'Stripe Checkout (self-serve)', basic: '✓', pro: '✓', scale: '✓', enterprise: '—' },
    { label: 'Invoice billing', basic: '—', pro: '—', scale: '—', enterprise: '✓' },
    { label: 'Procurement and security review pack', basic: '—', pro: '—', scale: '—', enterprise: '✓' },
    { label: 'Custom contract terms and DPA', basic: '—', pro: '—', scale: '—', enterprise: '✓' },
  ]},
];

type Column = {
  key: 'basic' | 'pro' | 'scale' | 'enterprise';
  label: string;
  price: string;
  featured?: boolean;
};
const COLUMNS: readonly Column[] = [
  { key: 'basic', label: 'Foundation', price: '$297 / mo' },
  { key: 'pro', label: 'Growth', price: '$797 / mo', featured: true },
  { key: 'scale', label: 'Scale', price: '$1,800 / mo' },
  { key: 'enterprise', label: 'Enterprise', price: 'POA' },
];

function renderCell(value: Cell) {
  if (value === '✓') return <span aria-label="Included" className="text-[var(--ds-ink)]">●</span>;
  if (value === '—')
    return <span aria-label="Not included" className="opacity-30">—</span>;
  return <span className="font-medium">{value}</span>;
}

/**
 * DsCapabilityMatrix — "Appendix B" folio: dense dossier table, manila tone,
 * typewriter headers + rules, mustard-highlighter tint on the featured
 * column (echoing the highlighter pen marks on a real dossier).
 */
export function DsCapabilityMatrix() {
  return (
    <DsContainer width="full">
      <DsFolio
        id="capability-matrix"
        tabLabel="§ APPENDIX B / CAPABILITY MATRIX"
        watermark="APPENDIX B"
      >
        <DsFolioHead
          strong
          meta={
            <>
              <DsMeta><strong>§02</strong> / MATRIX</DsMeta>
              <DsMeta className="hidden sm:inline-flex">
                {GROUPS.reduce((n, g) => n + g.rows.length, 0)} CAPABILITIES &middot; 4 PLANS
              </DsMeta>
            </>
          }
        />

        <div className="grid items-end gap-8 lg:grid-cols-[1.4fr_1fr] mb-8">
          <DsDisplay as="h2" size="lg">
            Every capability, <em>side by side.</em>
          </DsDisplay>
          <DsLead className="lg:text-right">
            Built for Australian NDIS, aged care, and healthcare buyers
            comparing real procurement options. If it matters to your audit
            and is not listed below, <em>ask us</em>.
          </DsLead>
        </div>

        {/* Desktop dense table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="ds-table min-w-[56rem]">
            <thead>
              <tr>
                <th scope="col">Capability</th>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    className={`ds-table__center ${c.featured ? 'ds-table__featured' : ''}`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-serif text-[0.95rem] font-semibold text-[var(--ds-ink)] normal-case tracking-normal">
                        {c.label}
                        {c.featured ? (
                          <span className="ml-1 text-[var(--ds-wax)]">★</span>
                        ) : null}
                      </span>
                      <span className="ds-caption">{c.price}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((group) => (
                <Fragment key={group.title}>
                  <tr className="ds-table__group">
                    <td colSpan={COLUMNS.length + 1}>{group.title}</td>
                  </tr>
                  {group.rows.map((row) => (
                    <tr key={row.label}>
                      <td>
                        <div className="font-serif text-[0.9375rem] text-[var(--ds-ink)]">{row.label}</div>
                        {row.hint ? (
                          <div className="ds-caption mt-1">{row.hint}</div>
                        ) : null}
                      </td>
                      {COLUMNS.map((c) => (
                        <td key={c.key} className={`ds-table__center ${c.featured ? 'ds-table__featured' : ''}`}>
                          {renderCell(row[c.key])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile — per-group stacked */}
        <div className="space-y-7 md:hidden">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="ds-meta border-b border-[var(--ds-rule-strong)] pb-2">{group.title}</h3>
              <dl className="mt-3 space-y-3.5">
                {group.rows.map((row) => (
                  <div key={row.label} className="border-b border-[var(--ds-rule)] pb-3">
                    <dt className="font-serif text-[0.9375rem] text-[var(--ds-ink)]">{row.label}</dt>
                    {row.hint ? <p className="ds-caption mt-1">{row.hint}</p> : null}
                    <dl className="mt-2 grid grid-cols-2 gap-1.5 text-[0.8125rem]">
                      {COLUMNS.map((c) => (
                        <div key={c.key} className="flex items-baseline justify-between">
                          <dt className="ds-meta">{c.label}{c.featured ? <span className="ml-1 text-[var(--ds-wax)]">★</span> : null}</dt>
                          <dd className="font-serif text-[var(--ds-ink)]">{row[c.key]}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>

        <DsPerf className="mt-8 mb-3" />
        <DsMeta>
          <span className="text-[var(--ds-wax)]">★</span>&nbsp;RECOMMENDED &middot;
          MAJORITY PICK FOR REGISTERED NDIS PROVIDERS 10&ndash;25 STAFF.
          &nbsp;●&nbsp;INCLUDED. &nbsp;&mdash;&nbsp;NOT INCLUDED.
        </DsMeta>
      </DsFolio>
    </DsContainer>
  );
}
