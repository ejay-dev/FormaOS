import { Fragment } from 'react';
import {
  EditorialSection,
  EditorialHeadline,
  EditorialLead,
  EditorialRule,
} from './primitives';

type Cell = '✓' | '—' | string;

type Row = {
  label: string;
  hint?: string;
  basic: Cell;
  pro: Cell;
  scale: Cell;
  enterprise: Cell;
};

type Group = {
  title: string;
  rows: Row[];
};

const GROUPS: Group[] = [
  {
    title: 'Core compliance',
    rows: [
      {
        label: 'Compliance engine',
        hint: 'Workflow enforcement, control evaluation, evidence capture',
        basic: '✓',
        pro: '✓',
        scale: '✓',
        enterprise: '✓',
      },
      {
        label: 'Tasks and evidence trail',
        basic: '✓',
        pro: '✓',
        scale: '✓',
        enterprise: '✓',
      },
      {
        label: 'Immutable audit log',
        basic: '✓',
        pro: '✓',
        scale: '✓',
        enterprise: '✓',
      },
      {
        label: 'Workflow approval gates',
        basic: 'Basic',
        pro: 'Full',
        scale: 'Full',
        enterprise: 'Full',
      },
      {
        label: 'Workflow automation',
        hint: 'Triggers, scheduled controls, cross-team escalations',
        basic: '—',
        pro: '—',
        scale: '✓',
        enterprise: '✓',
      },
    ],
  },
  {
    title: 'Frameworks and controls',
    rows: [
      {
        label: 'Compliance frameworks included',
        basic: '2',
        pro: '4',
        scale: 'Unlimited',
        enterprise: 'Unlimited',
      },
      {
        label: 'NDIS Practice Standards pre-built',
        basic: '✓',
        pro: '✓',
        scale: '✓',
        enterprise: '✓',
      },
      {
        label: 'Aged Care Quality Standards roadmap',
        basic: '✓',
        pro: '✓',
        scale: '✓',
        enterprise: '✓',
      },
      {
        label: 'SOC 2, ISO 27001, NIST CSF, CIS, HIPAA, GDPR, PCI-DSS',
        hint: 'Pre-built framework packs from the library',
        basic: 'Pick 2',
        pro: 'Pick 4',
        scale: 'Full library',
        enterprise: 'Full library',
      },
      {
        label: 'Australian Financial Services compliance pack',
        basic: '—',
        pro: '✓',
        scale: '✓',
        enterprise: '✓',
      },
      {
        label: 'Custom frameworks and controls',
        hint: 'User-defined frameworks built to your contractual requirements',
        basic: '—',
        pro: '—',
        scale: '—',
        enterprise: '✓',
      },
    ],
  },
  {
    title: 'Team and sites',
    rows: [
      {
        label: 'Users included',
        basic: '10',
        pro: '25',
        scale: '75',
        enterprise: 'Unlimited',
      },
      {
        label: 'Sites / locations',
        basic: '1',
        pro: 'Up to 3',
        scale: 'Unlimited',
        enterprise: 'Unlimited',
      },
      {
        label: 'Role-based access control',
        basic: '✓',
        pro: '✓',
        scale: '✓',
        enterprise: '✓',
      },
      {
        label: 'Multi-team usage',
        basic: '—',
        pro: '✓',
        scale: '✓',
        enterprise: '✓',
      },
      {
        label: 'Multi-site governance dashboard',
        basic: '—',
        pro: '—',
        scale: '✓',
        enterprise: '✓',
      },
    ],
  },
  {
    title: 'Audit and evidence',
    rows: [
      {
        label: 'Audit log export for Commission reviews',
        basic: '✓',
        pro: '✓',
        scale: '✓',
        enterprise: '✓',
      },
      {
        label: 'Real-time evidence capture',
        basic: '—',
        pro: '✓',
        scale: '✓',
        enterprise: '✓',
      },
      {
        label: 'Worker screening and credential expiry alerts',
        basic: '—',
        pro: '✓',
        scale: '✓',
        enterprise: '✓',
      },
      {
        label: 'Audit-period assistance',
        hint: 'Hands-on support during NDIS Commission and accreditation reviews',
        basic: '—',
        pro: '—',
        scale: '—',
        enterprise: '✓',
      },
    ],
  },
  {
    title: 'Reporting',
    rows: [
      {
        label: 'Framework evaluation reports',
        basic: '✓',
        pro: '✓',
        scale: '✓',
        enterprise: '✓',
      },
      {
        label: 'Posture and risk reporting',
        basic: '—',
        pro: 'Standard',
        scale: 'Advanced',
        enterprise: 'Advanced',
      },
      {
        label: 'Executive rollup reporting',
        hint: 'Cross-entity board and leadership reporting',
        basic: '—',
        pro: '—',
        scale: '—',
        enterprise: '✓',
      },
    ],
  },
  {
    title: 'Integrations and API',
    rows: [
      {
        label: 'Webhook integrations',
        hint: 'Push compliance events into your stack (Slack, ITSM, data warehouse)',
        basic: '—',
        pro: '—',
        scale: '✓',
        enterprise: '✓',
      },
      {
        label: 'Public API access',
        basic: '—',
        pro: '—',
        scale: '—',
        enterprise: '✓',
      },
      {
        label: 'Custom integrations',
        basic: '—',
        pro: '—',
        scale: '—',
        enterprise: '✓',
      },
    ],
  },
  {
    title: 'Security and identity',
    rows: [
      {
        label: 'SSO and SAML',
        hint: 'Single sign-on via your identity provider (Okta, Azure AD, Google)',
        basic: '—',
        pro: '—',
        scale: '—',
        enterprise: '✓',
      },
      {
        label: 'Directory sync and provisioning',
        basic: '—',
        pro: '—',
        scale: '—',
        enterprise: '✓',
      },
      {
        label: 'Retention governance',
        basic: '—',
        pro: '—',
        scale: '—',
        enterprise: '✓',
      },
    ],
  },
  {
    title: 'Onboarding and support',
    rows: [
      {
        label: 'Guided setup checklist',
        basic: '✓',
        pro: '✓',
        scale: '✓',
        enterprise: '✓',
      },
      {
        label: 'Implementation support',
        basic: '—',
        pro: '✓',
        scale: '✓',
        enterprise: '✓',
      },
      {
        label: 'Dedicated onboarding session',
        basic: '—',
        pro: '—',
        scale: '✓',
        enterprise: '✓',
      },
      {
        label: 'White-glove onboarding',
        basic: '—',
        pro: '—',
        scale: '—',
        enterprise: '✓',
      },
      {
        label: 'Email support',
        basic: '✓',
        pro: 'Priority',
        scale: 'Priority',
        enterprise: 'Priority',
      },
      {
        label: 'Response SLA',
        basic: '—',
        pro: '—',
        scale: '✓',
        enterprise: 'Custom',
      },
      {
        label: 'Dedicated account manager',
        basic: '—',
        pro: '—',
        scale: '—',
        enterprise: '✓',
      },
    ],
  },
  {
    title: 'Procurement',
    rows: [
      {
        label: 'Stripe Checkout (self-serve)',
        basic: '✓',
        pro: '✓',
        scale: '✓',
        enterprise: '—',
      },
      {
        label: 'Invoice billing',
        basic: '—',
        pro: '—',
        scale: '—',
        enterprise: '✓',
      },
      {
        label: 'Procurement and security review pack',
        basic: '—',
        pro: '—',
        scale: '—',
        enterprise: '✓',
      },
      {
        label: 'Custom contract terms and DPA',
        basic: '—',
        pro: '—',
        scale: '—',
        enterprise: '✓',
      },
    ],
  },
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
  if (value === '✓') {
    return <span aria-label="Included">●</span>;
  }
  if (value === '—') {
    return <span aria-label="Not included" className="text-[var(--ed-ink-faint)]">—</span>;
  }
  return <span className="font-medium text-[var(--ed-ink)]">{value}</span>;
}

/**
 * EditorialCapabilityMatrix — dense editorial table, no card frame, no
 * sticky group-nav sidebar. Group rows act as in-table dividers (italic
 * serif), capability rows are hairline-separated. Featured column gets a
 * subtle paper-tone wash, no glow. Mobile collapses to a stacked per-group
 * list — same data, no horizontal scroll trap.
 */
export function EditorialCapabilityMatrix() {
  return (
    <EditorialSection
      id="capability-matrix"
      num="02"
      label="Capability matrix"
      width="wide"
    >
      <div className="mb-10 max-w-3xl">
        <EditorialHeadline as="h2" size="lg" className="mb-5">
          Every capability, <em>side by side.</em>
        </EditorialHeadline>
        <EditorialLead>
          Built for Australian NDIS, aged care, and healthcare buyers
          comparing real procurement options. If something matters to your
          audit and it is not listed below, ask us &mdash; the editorial
          policy here is to publish, not to obscure.
        </EditorialLead>
      </div>

      {/* Desktop / tablet: dense editorial table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="ed-table min-w-[52rem]">
          <thead>
            <tr>
              <th scope="col">Capability</th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`ed-table__center ${
                    col.featured ? 'ed-table__featured' : ''
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[0.875rem] font-semibold text-[var(--ed-ink)] tracking-normal normal-case">
                      {col.label}
                      {col.featured ? (
                        <span className="ed-star ml-1">★</span>
                      ) : null}
                    </span>
                    <span className="ed-footnote">{col.price}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((group) => (
              <Fragment key={group.title}>
                <tr className="ed-table__group">
                  <td colSpan={COLUMNS.length + 1}>{group.title}</td>
                </tr>
                {group.rows.map((row) => (
                  <tr key={row.label}>
                    <td>
                      <div className="text-[0.9375rem] text-[var(--ed-ink)]">
                        {row.label}
                      </div>
                      {row.hint ? (
                        <div className="ed-footnote mt-0.5">{row.hint}</div>
                      ) : null}
                    </td>
                    {COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className={`ed-table__center ${
                          col.featured ? 'ed-table__featured' : ''
                        }`}
                      >
                        {renderCell(row[col.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: per-group stacked list */}
      <div className="space-y-7 md:hidden">
        {GROUPS.map((group) => (
          <div key={group.title}>
            <h3 className="ed-eyebrow-caps border-b border-[color:var(--ed-rule-strong)] pb-2">
              {group.title}
            </h3>
            <dl className="mt-3 space-y-4">
              {group.rows.map((row) => (
                <div
                  key={row.label}
                  className="border-b border-[color:var(--ed-rule)] pb-3"
                >
                  <dt className="text-[0.9375rem] font-medium text-[var(--ed-ink)]">
                    {row.label}
                  </dt>
                  {row.hint ? (
                    <p className="ed-footnote mt-0.5">{row.hint}</p>
                  ) : null}
                  <dl className="mt-2 grid grid-cols-2 gap-1.5 text-[0.8125rem]">
                    {COLUMNS.map((col) => (
                      <div
                        key={col.key}
                        className="flex items-baseline justify-between gap-2"
                      >
                        <dt className="text-[var(--ed-ink-faint)]">
                          {col.label}
                          {col.featured ? <span className="ed-star"> ★</span> : null}
                        </dt>
                        <dd className="text-[var(--ed-ink)]">
                          {row[col.key]}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <EditorialRule className="mt-8" />
      <p className="ed-footnote mt-3">
        <span className="ed-star">★</span> Most popular &mdash; selected by the
        majority of registered NDIS providers with 10&ndash;25 staff. ● denotes
        included; &mdash; denotes not included on that tier.
      </p>
    </EditorialSection>
  );
}
