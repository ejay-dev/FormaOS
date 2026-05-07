'use client';

import { Check, Minus } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { DotGrid } from '@/components/marketing/SectionBackgrounds';

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
  rows: ComparisonRow[];
};

const GROUPS: ComparisonGroup[] = [
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

const COLUMNS = [
  { key: 'basic', label: 'Foundation', price: '$297/mo' },
  { key: 'pro', label: 'Growth', price: '$797/mo' },
  { key: 'scale', label: 'Scale', price: '$1,800/mo' },
  { key: 'enterprise', label: 'Enterprise', price: 'Custom' },
] as const;

function renderCell(value: Cell) {
  if (value === '✓') {
    return (
      <Check className="mx-auto h-4 w-4 text-emerald-300" aria-hidden="true" />
    );
  }
  if (value === '—') {
    return (
      <Minus className="mx-auto h-4 w-4 text-slate-600" aria-hidden="true" />
    );
  }
  return <span className="text-sm text-slate-200">{value}</span>;
}

export function PricingComparisonTable() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d1424] via-[#0a0f1c] to-[#0d1424]">
        <DotGrid />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(6,182,212,0.06),transparent_40%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.35]}
          className="mx-auto max-w-3xl text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Plan comparison
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Every feature,{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              side by side
            </span>
          </h2>
          <p className="text-base leading-7 text-slate-400">
            Built for Australian NDIS, aged care, and healthcare buyers
            comparing real procurement options. If something matters to your
            audit and it is not on this page, ask us.
          </p>
        </ScrollReveal>

        <div className="mt-12 hidden overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025] lg:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.03]">
                <th
                  scope="col"
                  className="w-[34%] px-6 py-5 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
                >
                  Feature
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className="px-6 py-5 text-center"
                  >
                    <div className="text-sm font-semibold text-white">
                      {col.label}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      {col.price}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((group) => (
                <>
                  <tr key={`group-${group.title}`} className="bg-white/[0.04]">
                    <td
                      colSpan={5}
                      className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200"
                    >
                      {group.title}
                    </td>
                  </tr>
                  {group.rows.map((row, idx) => (
                    <tr
                      key={`${group.title}-${row.label}`}
                      className={
                        idx % 2 === 0
                          ? 'border-t border-white/[0.04]'
                          : 'border-t border-white/[0.04] bg-white/[0.015]'
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
                        <td key={col.key} className="px-6 py-3.5 text-center">
                          {renderCell(row[col.key])}
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
              className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5"
            >
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                {group.title}
              </h3>
              <div className="mt-4 divide-y divide-white/[0.06]">
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
                          className="flex items-center justify-between rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2"
                        >
                          <dt className="text-slate-400">{col.label}</dt>
                          <dd className="ml-2">
                            {row[col.key] === '✓' ? (
                              <Check
                                className="h-3.5 w-3.5 text-emerald-300"
                                aria-hidden="true"
                              />
                            ) : row[col.key] === '—' ? (
                              <Minus
                                className="h-3.5 w-3.5 text-slate-600"
                                aria-hidden="true"
                              />
                            ) : (
                              <span className="text-slate-200">
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
      </div>
    </section>
  );
}
