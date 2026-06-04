'use client';

import { useMemo, useState } from 'react';
import { Check, Minus } from 'lucide-react';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

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
    accent: 'text-slate-200',
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

function renderCell(value: Cell, focused: boolean) {
  if (value === '✓') {
    return (
      <Check
        className={`mx-auto h-4 w-4 ${focused ? 'text-white' : 'text-slate-500'}`}
        aria-hidden="true"
      />
    );
  }
  if (value === '—') {
    return (
      <Minus
        className={`mx-auto h-4 w-4 ${focused ? 'text-slate-600' : 'text-slate-700'}`}
        aria-hidden="true"
      />
    );
  }
  return (
    <span className={`text-[12px] ${focused ? 'text-white' : 'text-slate-500'}`}>
      {value}
    </span>
  );
}

function slugifyGroupCode(code: string): string {
  return code.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

const COLUMN_KEYS = COLUMNS.map((c) => c.key);

/** Capabilities the focused plan adds over the plan one tier below it. */
function upgradesOver(focusKey: Column['key']): { label: string; value: string }[] {
  const idx = COLUMN_KEYS.indexOf(focusKey);
  if (idx <= 0) return [];
  const prevKey = COLUMN_KEYS[idx - 1];
  const out: { label: string; value: string }[] = [];
  for (const group of GROUPS) {
    for (const row of group.rows) {
      const now = row[focusKey];
      const before = row[prevKey];
      const gained = before === '—' && now !== '—';
      const upgraded =
        before !== '—' && now !== '—' && now !== before && now !== '✓';
      if (gained) {
        out.push({ label: row.label, value: now === '✓' ? '' : String(now) });
      } else if (upgraded) {
        out.push({ label: row.label, value: String(now) });
      }
    }
  }
  return out;
}

export function PricingComparisonTable() {
  const [focus, setFocus] = useState<Column['key']>('pro');
  const focusedCol = COLUMNS.find((c) => c.key === focus) ?? COLUMNS[1];
  const upgrades = useMemo(() => upgradesOver(focus), [focus]);
  const focusIndex = COLUMN_KEYS.indexOf(focus);
  const prevLabel = focusIndex > 0 ? COLUMNS[focusIndex - 1].label : null;

  return (
    <section className="relative isolate overflow-hidden py-24 sm:py-32">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(58%_45%_at_50%_0%,rgba(255,255,255,0.03),transparent_70%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        {/* Section header — left vertical-bar accent */}
        <ScrollReveal
          variant="slideUp"
          range={[0, 0.35]}
          className="flex items-start gap-5"
        >
          <span className="mt-1.5 hidden h-14 w-px flex-shrink-0 bg-gradient-to-b from-white/35 to-transparent sm:block" />
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Capability matrix
            </p>
            <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Pick a plan. See exactly what it covers.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-400">
              {GROUPS.length} categories, {TOTAL_ROWS} capabilities, side by
              side.{' '}
              <span className="hidden lg:inline">
                Select a plan to focus its column and see what it adds over the
                tier below.{' '}
              </span>
              If something matters to your audit and it is not listed, ask us.
            </p>
          </div>
        </ScrollReveal>

        {/* Plan focus selector */}
        <ScrollReveal
          variant="fadeUp"
          range={[0, 0.4]}
          className="mt-10 hidden lg:block"
        >
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
              Focus
            </span>
            {COLUMNS.map((col) => {
              const active = col.key === focus;
              return (
                <button
                  key={col.key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFocus(col.key)}
                  className={`flex items-baseline gap-2 rounded-xl border px-4 py-2 transition-colors duration-200 ${
                    active
                      ? 'border-white/30 bg-white/[0.08] text-white'
                      : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/[0.16] hover:text-slate-200'
                  }`}
                >
                  <span className="text-sm font-semibold">{col.label}</span>
                  <span className="text-[11px] text-slate-500">{col.price}</span>
                </button>
              );
            })}
          </div>

          {/* "What this plan adds over the one below" callout */}
          <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-5 py-4">
            {prevLabel ? (
              <>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {focusedCol.label} adds over {prevLabel}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
                  {upgrades.map((u) => (
                    <span
                      key={u.label}
                      className="inline-flex items-center gap-2 text-[13px] text-slate-300"
                    >
                      <span className="h-1 w-1 rounded-full bg-slate-400" />
                      {u.label}
                      {u.value ? (
                        <span className="text-slate-500">· {u.value}</span>
                      ) : null}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-[13px] text-slate-300">
                <span className="font-semibold text-white">
                  {focusedCol.label}
                </span>{' '}
                is the compliance core. The engine, evidence trail, and
                immutable audit log ship in every plan.
              </p>
            )}
          </div>
        </ScrollReveal>

        {/* Desktop matrix */}
        <ScrollReveal variant="fadeUp" range={[0, 0.4]}>
          <div className="relative mt-6 hidden overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.015] lg:block">
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="border-b border-white/[0.08] bg-[#0a0f1c]/95 backdrop-blur-md">
                  <th
                    scope="col"
                    className="w-[34%] px-6 py-5 text-left text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500"
                  >
                    Capability
                  </th>
                  {COLUMNS.map((col) => {
                    const isFocus = col.key === focus;
                    return (
                      <th
                        key={col.key}
                        scope="col"
                        aria-sort={isFocus ? 'other' : undefined}
                        className={`relative cursor-pointer px-6 py-5 text-center transition-colors duration-200 ${
                          isFocus ? 'bg-white/[0.06]' : 'hover:bg-white/[0.02]'
                        }`}
                        onClick={() => setFocus(col.key)}
                      >
                        {isFocus ? (
                          <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
                        ) : null}
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className={`text-base font-semibold ${isFocus ? 'text-white' : 'text-slate-400'}`}
                          >
                            {col.label}
                          </span>
                        </div>
                        <div
                          className={`mt-1 text-xs ${isFocus ? 'text-slate-300' : 'text-slate-500'}`}
                        >
                          {col.price}
                        </div>
                      </th>
                    );
                  })}
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
                      <td className="px-6 py-3" colSpan={1}>
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
                          {group.title}
                        </span>
                      </td>
                      {COLUMNS.map((col) => (
                        <td
                          key={col.key}
                          className={`px-6 py-3 ${col.key === focus ? 'bg-white/[0.06]' : ''}`}
                        />
                      ))}
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
                            className={`px-6 py-3.5 text-center transition-colors duration-200 ${
                              col.key === focus ? 'bg-white/[0.06]' : ''
                            }`}
                          >
                            {renderCell(row[col.key], col.key === focus)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
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
                <span className="text-[10px] uppercase tracking-[0.22em] text-slate-400">
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
                              ? 'border-white/25 bg-white/[0.06]'
                              : 'border-white/[0.05] bg-white/[0.02]'
                          }`}
                        >
                          <dt className="text-[10px] uppercase tracking-[0.16em] text-slate-400">
                            {col.code}
                          </dt>
                          <dd className="ml-2">
                            {row[col.key] === '✓' ? (
                              <Check
                                className={`h-3.5 w-3.5 ${col.featured ? 'text-slate-100' : 'text-slate-400'}`}
                                aria-hidden="true"
                              />
                            ) : row[col.key] === '—' ? (
                              <Minus
                                className="h-3.5 w-3.5 text-slate-700"
                                aria-hidden="true"
                              />
                            ) : (
                              <span className="text-[11px] text-slate-200">
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
