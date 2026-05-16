'use client';

import { Check, Minus, Table2 } from 'lucide-react';
import {
  AccentText,
  SectionEyebrow,
  StatusPill,
  SystemSection,
} from '@/components/marketing/SystemMarketingPrimitives';

type Cell = '✓' | '—' | string;

type ComparisonRow = {
  label: string;
  hint?: string;
  basic: Cell;
  pro: Cell;
  scale: Cell;
  enterprise: Cell;
};

type ComparisonGroup = {
  title: string;
  code: string;
  rows: ComparisonRow[];
};

const GROUPS: ComparisonGroup[] = [
  {
    title: 'Core compliance',
    code: 'CORE',
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
    code: 'FRAMEWORKS',
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
    code: 'TEAM',
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
    code: 'AUDIT',
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
    code: 'REPORT',
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
    code: 'API',
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
    code: 'SEC',
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
    code: 'OPS',
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
    code: 'PROC',
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
  { key: 'basic', label: 'Foundation', price: '$297/mo' },
  { key: 'pro', label: 'Growth', price: '$797/mo', featured: true },
  { key: 'scale', label: 'Scale', price: '$1,800/mo' },
  { key: 'enterprise', label: 'Enterprise', price: 'Custom' },
];

function renderCell(value: Cell, featured?: boolean) {
  if (value === '✓') {
    return (
      <Check
        className={`mx-auto h-4 w-4 ${featured ? 'text-emerald-300' : 'text-slate-300'}`}
        aria-hidden="true"
      />
    );
  }
  if (value === '—') {
    return (
      <Minus className="mx-auto h-4 w-4 text-slate-600" aria-hidden="true" />
    );
  }
  return (
    <span
      className={`text-[13px] font-medium ${featured ? 'text-emerald-200' : 'text-slate-200'}`}
    >
      {value}
    </span>
  );
}

function slugifyGroupCode(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

export function PricingComparisonTable() {
  return (
    <SystemSection variant="cyan">
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <SectionEyebrow icon={Table2} tone="live">
          Capability matrix
        </SectionEyebrow>
        <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-5xl">
          Every capability,{' '}
          <AccentText>side by side.</AccentText>
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-300">
          Built for Australian NDIS, aged care, and healthcare buyers
          comparing real procurement options. If something matters to your
          audit and it is not listed, ask us.
        </p>
      </div>

      {/* Jump-to anchor strip — clean pill nav, no mono */}
      <div className="mb-6 hidden flex-wrap items-center justify-center gap-2 lg:flex">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
          Jump to:
        </span>
        {GROUPS.map((g) => (
          <a
            key={g.code}
            href={`#capability-${slugifyGroupCode(g.code)}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:border-white/[0.18] hover:bg-white/[0.06] hover:text-white"
          >
            {g.title}
          </a>
        ))}
      </div>

      {/* Desktop matrix */}
      <div className="hidden overflow-hidden rounded-2xl border border-white/[0.07] bg-slate-950/50 shadow-[0_18px_56px_rgba(2,6,23,0.34)] lg:block">
        <table className="w-full">
          <thead className="bg-white/[0.025]">
            <tr className="border-b border-white/[0.06]">
              <th
                scope="col"
                className="w-[34%] px-6 py-5 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-400"
              >
                Capability
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`px-6 py-5 text-center ${
                    col.featured ? 'bg-emerald-300/[0.05]' : ''
                  }`}
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold text-white">
                        {col.label}
                      </span>
                      {col.featured ? (
                        <StatusPill tone="valid">Most popular</StatusPill>
                      ) : null}
                    </div>
                    <div className="text-sm text-slate-300">{col.price}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((group) => (
              <>
                <tr
                  key={`group-${group.title}`}
                  id={`capability-${slugifyGroupCode(group.code)}`}
                  className="scroll-mt-24 bg-white/[0.035]"
                >
                  <td className="px-6 py-3" colSpan={COLUMNS.length + 1}>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                      {group.title}
                    </span>
                    <span className="ml-3 text-xs text-slate-500">
                      {group.rows.length} capabilities
                    </span>
                  </td>
                </tr>
                {group.rows.map((row, idx) => (
                  <tr
                    key={`${group.title}-${row.label}`}
                    className={
                      idx % 2 === 0
                        ? 'border-t border-white/[0.04]'
                        : 'border-t border-white/[0.04] bg-white/[0.012]'
                    }
                  >
                    <td className="px-6 py-3.5 text-sm text-slate-200">
                      <div>{row.label}</div>
                      {row.hint ? (
                        <div className="mt-0.5 text-xs text-slate-500">
                          {row.hint}
                        </div>
                      ) : null}
                    </td>
                    {COLUMNS.map((col) => (
                      <td
                        key={col.key}
                        className={`px-6 py-3.5 text-center ${
                          col.featured ? 'bg-emerald-300/[0.04]' : ''
                        }`}
                      >
                        {renderCell(row[col.key], col.featured)}
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked per-group */}
      <div className="mt-10 space-y-6 lg:hidden">
        {GROUPS.map((group) => (
          <div
            key={group.title}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"
          >
            <div
              id={`capability-${slugifyGroupCode(group.code)}-mobile`}
              className="mb-4 scroll-mt-24"
            >
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/90">
                {group.title}
              </span>
            </div>
            <div className="divide-y divide-white/[0.06]">
              {group.rows.map((row) => (
                <div key={row.label} className="py-3">
                  <p className="text-sm font-medium text-white">
                    {row.label}
                  </p>
                  {row.hint ? (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {row.hint}
                    </p>
                  ) : null}
                  <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    {COLUMNS.map((col) => (
                      <div
                        key={col.key}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                          col.featured
                            ? 'border-emerald-300/30 bg-emerald-300/[0.05]'
                            : 'border-white/[0.06] bg-white/[0.02]'
                        }`}
                      >
                        <dt className="text-xs font-medium text-slate-300">
                          {col.label}
                        </dt>
                        <dd className="ml-2">
                          {row[col.key] === '✓' ? (
                            <Check
                              className={`h-3.5 w-3.5 ${col.featured ? 'text-emerald-300' : 'text-slate-300'}`}
                              aria-hidden="true"
                            />
                          ) : row[col.key] === '—' ? (
                            <Minus
                              className="h-3.5 w-3.5 text-slate-600"
                              aria-hidden="true"
                            />
                          ) : (
                            <span
                              className={`text-[12px] font-medium ${col.featured ? 'text-emerald-200' : 'text-slate-200'}`}
                            >
                              {row[col.key]}
                            </span>
                          )}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SystemSection>
  );
}
