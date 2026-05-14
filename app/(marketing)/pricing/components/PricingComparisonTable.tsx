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
  code: string;
  price: string;
  accent: string;
  featured?: boolean;
};

const COLUMNS: readonly Column[] = [
  {
    key: 'basic',
    label: 'Foundation',
    code: 'FND',
    price: '$297/mo',
    accent: 'text-slate-400',
  },
  {
    key: 'pro',
    label: 'Growth',
    code: 'GRW',
    price: '$797/mo',
    accent: 'text-emerald-300',
    featured: true,
  },
  {
    key: 'scale',
    label: 'Scale',
    code: 'SCL',
    price: '$1,800/mo',
    accent: 'text-slate-400',
  },
  {
    key: 'enterprise',
    label: 'Enterprise',
    code: 'ENT',
    price: 'Custom',
    accent: 'text-slate-400',
  },
];

const TOTAL_ROWS = GROUPS.reduce((sum, g) => sum + g.rows.length, 0);

function renderCell(value: Cell, featured?: boolean) {
  if (value === '✓') {
    return (
      <Check
        className={`mx-auto h-4 w-4 ${featured ? 'text-emerald-300' : 'text-slate-400'}`}
        aria-hidden="true"
      />
    );
  }
  if (value === '—') {
    return (
      <Minus className="mx-auto h-4 w-4 text-slate-700" aria-hidden="true" />
    );
  }
  return (
    <span
      className={`font-mono text-[12px] ${featured ? 'text-emerald-200' : 'text-slate-200'}`}
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
    <section className="relative overflow-hidden py-24 sm:py-32">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d1424] via-[#0a0f1c] to-[#0d1424]">
        <DotGrid />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(6,182,212,0.06),transparent_45%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section header */}
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.35]}
          className="mb-12 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end"
        >
          <div>
            <div className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.28em] text-slate-500">
              <span className="h-px w-6 bg-white/20" />
              <span className="text-slate-300">Capability matrix</span>
              <span className="text-slate-600">·</span>
              <span>{GROUPS.length} categories · {TOTAL_ROWS} capabilities</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
              Every capability, side by side.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Built for Australian NDIS, aged care, and healthcare buyers
              comparing real procurement options. If something matters to your
              audit and it is not listed, ask us.
            </p>
          </div>
          <div className="hidden lg:flex flex-col items-end gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
            <span className="flex items-center gap-2">
              <Check className="h-3 w-3 text-slate-400" />
              <span>Included</span>
            </span>
            <span className="flex items-center gap-2">
              <Minus className="h-3 w-3 text-slate-700" />
              <span>Not in plan</span>
            </span>
            <span className="flex items-center gap-2 text-emerald-300/80">
              <span>Most popular column</span>
            </span>
          </div>
        </ScrollReveal>

        {/* Jump-to anchor strip (additive UX) */}
        <ScrollReveal
          variant="fadeUp"
          range={[0, 0.4]}
          className="mb-6 hidden flex-wrap items-center gap-2 lg:flex"
        >
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">
            Jump to:
          </span>
          {GROUPS.map((g) => (
            <a
              key={g.code}
              href={`#capability-${slugifyGroupCode(g.code)}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.02] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-300 transition hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white"
            >
              {g.title}
              <span className="text-slate-500">· {g.rows.length}</span>
            </a>
          ))}
        </ScrollReveal>

        {/* Desktop matrix wrapped in HUD frame */}
        <ScrollReveal variant="fadeUp" range={[0, 0.4]}>
          <div className="relative hidden overflow-hidden rounded-3xl border border-white/[0.07] bg-gradient-to-br from-[#0a1322]/85 via-[#070d1c]/80 to-[#040810]/85 shadow-2xl shadow-black/40 ring-1 ring-white/[0.03] backdrop-blur-sm lg:block">
            {/* Frame title bar */}
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-6 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
                formaos · capability matrix
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                FY26 · AUD · GST inc.
              </span>
            </div>

            <table className="w-full">
              <thead className="sticky top-0 z-10 backdrop-blur-md">
                <tr className="border-b border-white/[0.06] bg-[#070d1c]/95">
                  <th
                    scope="col"
                    className="w-[34%] px-6 py-5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500"
                  >
                    Capability
                  </th>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.key}
                      scope="col"
                      className={`relative px-6 py-5 text-center ${
                        col.featured ? 'bg-emerald-400/[0.04]' : ''
                      }`}
                    >
                      {col.featured ? (
                        <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
                      ) : null}
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-base font-semibold text-white">
                          {col.label}
                        </span>
                        <span
                          className={`font-mono text-[10px] uppercase tracking-[0.2em] ${col.accent}`}
                        >
                          / {col.code}
                        </span>
                      </div>
                      <div className="mt-1 font-mono text-xs text-slate-400">
                        {col.price}
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
                      className="scroll-mt-24 bg-white/[0.04]"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
                            {group.code}
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">
                            {group.title}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                            · {group.rows.length}
                          </span>
                        </div>
                      </td>
                      {COLUMNS.map((col) => (
                        <td
                          key={col.key}
                          className={`px-6 py-3.5 ${col.featured ? 'bg-emerald-400/[0.04]' : ''}`}
                        />
                      ))}
                    </tr>
                    {group.rows.map((row, idx) => (
                      <tr
                        key={`${group.title}-${row.label}`}
                        className={
                          idx % 2 === 0
                            ? 'border-t border-white/[0.04] hover:bg-white/[0.02]'
                            : 'border-t border-white/[0.04] bg-white/[0.012] hover:bg-white/[0.025]'
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
                              col.featured ? 'bg-emerald-400/[0.04]' : ''
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

            {/* Footer status bar */}
            <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.015] px-6 py-3 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
              <span>{TOTAL_ROWS} capabilities · {GROUPS.length} categories</span>
              <span>Stripe · SSO · DPA · AU-hosted</span>
            </div>
          </div>
        </ScrollReveal>

        {/* Mobile: stacked per-group */}
        <div className="mt-10 space-y-6 lg:hidden">
          {GROUPS.map((group) => (
            <div
              key={group.title}
              className="rounded-3xl border border-white/[0.08] bg-white/[0.025] p-5"
            >
              <div
                id={`capability-${slugifyGroupCode(group.code)}-mobile`}
                className="mb-4 flex items-center gap-3 scroll-mt-24"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-400">
                  {group.code}
                </span>
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/85">
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
                              ? 'border-emerald-300/30 bg-emerald-400/[0.06]'
                              : 'border-white/[0.05] bg-white/[0.02]'
                          }`}
                        >
                          <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-400">
                            {col.code}
                          </dt>
                          <dd className="ml-2">
                            {row[col.key] === '✓' ? (
                              <Check
                                className={`h-3.5 w-3.5 ${col.featured ? 'text-emerald-300' : 'text-slate-400'}`}
                                aria-hidden="true"
                              />
                            ) : row[col.key] === '—' ? (
                              <Minus
                                className="h-3.5 w-3.5 text-slate-700"
                                aria-hidden="true"
                              />
                            ) : (
                              <span className="font-mono text-[11px] text-slate-200">
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
