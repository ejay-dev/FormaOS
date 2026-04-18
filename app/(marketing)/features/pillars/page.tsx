import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ShieldCheck,
  FolderLock,
  Workflow,
  HeartPulse,
  Handshake,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Features — 5 Pillars | FormaOS',
  description:
    'One OS for every obligation you owe. Compliance, evidence, tasks, care operations, and trust — governed end-to-end.',
};

interface Pillar {
  id: string;
  eyebrow: string;
  title: string;
  lede: string;
  Icon: typeof ShieldCheck;
  accent: string; // tailwind gradient
  glow: string; // css radial gradient
  features: Array<{ name: string; detail: string }>;
  footnote?: string;
}

const PILLARS: Pillar[] = [
  {
    id: 'compliance',
    eyebrow: 'Pillar 01',
    title: 'Compliance Engine',
    lede: 'Turn regulatory obligations into governed, testable controls with pre-built framework packs.',
    Icon: ShieldCheck,
    accent: 'from-cyan-400 via-sky-400 to-blue-500',
    glow: 'radial-gradient(circle at 30% 20%, rgba(0,212,251,0.22), transparent 60%)',
    features: [
      {
        name: 'SOC 2, ISO 27001, GDPR, HIPAA, PCI-DSS',
        detail: 'Global security and privacy framework packs — ready on day one.',
      },
      {
        name: 'NIST CSF, CIS Controls, Essential Eight',
        detail: 'Deep library for security-heavy regulated environments.',
      },
      {
        name: 'NDIS Practice Standards',
        detail:
          'Purpose-built for Australian NDIS providers — the wedge vs generic tools.',
      },
      {
        name: 'Custom frameworks',
        detail: 'Bring your own obligations — map controls, owners, evidence.',
      },
    ],
    footnote: '9 framework packs included. Cross-map once, satisfy many.',
  },
  {
    id: 'evidence',
    eyebrow: 'Pillar 02',
    title: 'Evidence Vault',
    lede: 'Defensible evidence with chain-of-custody — not a dumping ground.',
    Icon: FolderLock,
    accent: 'from-blue-500 via-indigo-400 to-violet-500',
    glow: 'radial-gradient(circle at 70% 30%, rgba(136,100,255,0.22), transparent 60%)',
    features: [
      {
        name: 'Verification workflows',
        detail: 'Every item reviewed and signed off by a named reviewer.',
      },
      {
        name: 'Immutable audit trail',
        detail: 'Who uploaded, who verified, what changed — provable.',
      },
      {
        name: 'Expiry monitoring',
        detail: 'Automated alerts 30/14/7 days out — nothing lapses silently.',
      },
      {
        name: 'Multi-site scoping',
        detail: 'Evidence rolls up from sites to the org — no double handling.',
      },
    ],
  },
  {
    id: 'workflow',
    eyebrow: 'Pillar 03',
    title: 'Tasks & Governance',
    lede: 'Named owners, clear SLAs, audit-ready history. Accountability, not spreadsheets.',
    Icon: Workflow,
    accent: 'from-violet-500 via-fuchsia-400 to-pink-500',
    glow: 'radial-gradient(circle at 40% 60%, rgba(217,70,239,0.18), transparent 60%)',
    features: [
      {
        name: 'Owner-based task routing',
        detail: 'Every obligation has a human accountable — not a mailbox.',
      },
      {
        name: 'SLA timers',
        detail: 'Breach warnings escalate automatically before anything is missed.',
      },
      {
        name: 'Approval chains',
        detail: 'Multi-step sign-off for risk-rated changes.',
      },
      {
        name: 'Automation triggers',
        detail: 'Fire tasks on framework events, data changes, or incidents.',
      },
    ],
  },
  {
    id: 'care',
    eyebrow: 'Pillar 04',
    title: 'Care Operations',
    lede: 'The wedge. Participants, visits, progress notes, credentials — all in compliance context.',
    Icon: HeartPulse,
    accent: 'from-pink-500 via-rose-400 to-orange-400',
    glow: 'radial-gradient(circle at 60% 70%, rgba(244,114,182,0.22), transparent 60%)',
    features: [
      {
        name: 'Participant, patient & resident records',
        detail: 'Industry-aware naming for NDIS, healthcare, and aged care.',
      },
      {
        name: 'Care plans with review tracking',
        detail: 'Goals, supports, and reviews — never lapse, always auditable.',
      },
      {
        name: 'Credential expiry monitoring',
        detail: 'WWCC, AHPRA, First Aid, NDIS Screening — expiring 30/14/7 days out.',
      },
      {
        name: 'Progress notes & incidents',
        detail: 'Shift-ready notes that also satisfy regulator reporting.',
      },
    ],
    footnote: 'What Drata/Vanta don&apos;t have. Built for regulated operators.',
  },
  {
    id: 'trust',
    eyebrow: 'Pillar 05',
    title: 'Trust Surface',
    lede: 'Buyer-grade assurance packets, AU-hosted by default, SSO-ready for the enterprise.',
    Icon: Handshake,
    accent: 'from-emerald-400 via-teal-400 to-cyan-400',
    glow: 'radial-gradient(circle at 50% 40%, rgba(16,185,129,0.18), transparent 60%)',
    features: [
      {
        name: 'Assurance packets',
        detail:
          'Share a trust link — procurement teams see controls, evidence, SOC 2 status.',
      },
      {
        name: 'SSO / SAML',
        detail: 'Enterprise-ready identity on the Enterprise plan.',
      },
      {
        name: 'AU data residency',
        detail: 'Your data never leaves Australia. Default.',
      },
      {
        name: 'API + webhooks',
        detail: 'REST API v1 and SIEM-friendly webhooks for automation.',
      },
    ],
  },
];

const COMPARISON_ROWS: Array<{
  capability: string;
  formaos: boolean | string;
  drata: boolean | string;
  vanta: boolean | string;
  secureframe: boolean | string;
}> = [
  { capability: 'SOC 2 / ISO 27001 automation', formaos: true, drata: true, vanta: true, secureframe: true },
  { capability: 'NDIS Practice Standards', formaos: true, drata: false, vanta: false, secureframe: false },
  { capability: 'Care operations (visits, plans, credentials)', formaos: true, drata: false, vanta: false, secureframe: false },
  { capability: 'Multi-site rollup', formaos: true, drata: false, vanta: false, secureframe: 'partial' },
  { capability: 'AU data residency by default', formaos: true, drata: false, vanta: false, secureframe: false },
  { capability: 'Evidence chain-of-custody', formaos: true, drata: 'partial', vanta: 'partial', secureframe: 'partial' },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true)
    return (
      <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-400" aria-hidden="true" />
    );
  if (value === false)
    return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <span className="text-xs text-amber-300 font-semibold">{value}</span>
  );
}

export default function FeaturesPillarsPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[hsl(var(--canvas-950))] text-foreground">
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse at 20% 0%, rgba(0,212,251,0.12), transparent 60%), radial-gradient(ellipse at 80% 10%, rgba(136,100,255,0.10), transparent 60%)',
        }}
        aria-hidden="true"
      />

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-6 pt-24 pb-16 sm:pt-32">
        <div className="flex flex-col items-start gap-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-300">
            <Sparkles className="h-3 w-3" />
            Features · 5 Pillars
          </span>
          <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            One OS for every obligation <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-cyan-300 via-sky-300 to-violet-300 bg-clip-text text-transparent">
              you owe.
            </span>
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Frameworks, controls, evidence, tasks, and assurance — governed
            end-to-end. Built for regulated operators, AU-hosted by default.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-[0_0_30px_rgba(0,212,251,0.3)] transition-transform hover:scale-[1.02]"
            >
              Start 14-day trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-white/10"
            >
              View pricing
            </Link>
            <span className="text-xs text-muted-foreground">
              No credit card. AU-hosted.
            </span>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="flex flex-col gap-10">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.Icon;
            const isOdd = idx % 2 === 1;
            return (
              <article
                key={pillar.id}
                id={pillar.id}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-8 shadow-premium-lg sm:p-12"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-70"
                  style={{ background: pillar.glow }}
                  aria-hidden="true"
                />

                <div
                  className={`relative grid gap-10 lg:grid-cols-[1fr,1.2fr] lg:items-center ${
                    isOdd ? 'lg:[&>*:first-child]:order-2' : ''
                  }`}
                >
                  {/* Left — title + lede */}
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${pillar.accent} shadow-lg`}
                      >
                        <Icon className="h-6 w-6 text-slate-950" aria-hidden="true" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          {pillar.eyebrow}
                        </span>
                        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                          {pillar.title}
                        </h2>
                      </div>
                    </div>
                    <p className="text-lg text-muted-foreground sm:max-w-md">
                      {pillar.lede}
                    </p>
                    {pillar.footnote && (
                      <p
                        className="text-sm font-medium text-cyan-300/80"
                        dangerouslySetInnerHTML={{ __html: pillar.footnote }}
                      />
                    )}
                  </div>

                  {/* Right — feature grid */}
                  <ul className="grid gap-3 sm:grid-cols-2">
                    {pillar.features.map((f) => (
                      <li
                        key={f.name}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]"
                      >
                        <div className="flex items-start gap-2">
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300/80"
                            aria-hidden="true"
                          />
                          <div>
                            <div className="text-sm font-semibold text-foreground">
                              {f.name}
                            </div>
                            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {f.detail}
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Comparison strip */}
      <section className="relative mx-auto max-w-6xl px-6 pb-24">
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--panel-2))] p-8 shadow-premium-lg">
          <div className="flex flex-col gap-1 pb-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              How we compare
            </span>
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Built for regulated operators — not just security teams.
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-muted-foreground">
                  <th className="py-3 text-left font-medium">Capability</th>
                  <th className="py-3 text-center font-semibold text-cyan-300">
                    FormaOS
                  </th>
                  <th className="py-3 text-center font-medium">Drata</th>
                  <th className="py-3 text-center font-medium">Vanta</th>
                  <th className="py-3 text-center font-medium">Secureframe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {COMPARISON_ROWS.map((row) => (
                  <tr key={row.capability}>
                    <td className="py-3 text-foreground/90">{row.capability}</td>
                    <td className="py-3 text-center">
                      <Cell value={row.formaos} />
                    </td>
                    <td className="py-3 text-center">
                      <Cell value={row.drata} />
                    </td>
                    <td className="py-3 text-center">
                      <Cell value={row.vanta} />
                    </td>
                    <td className="py-3 text-center">
                      <Cell value={row.secureframe} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative mx-auto max-w-4xl px-6 pb-28 text-center">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-pink-500/10 p-10 shadow-premium-lg">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to turn obligations into routines?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Start a 14-day trial. AU-hosted by default. No credit card. Your
            first framework pack is live in under 10 minutes.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-400 via-sky-400 to-violet-500 px-5 py-2.5 text-sm font-semibold text-slate-950"
            >
              Start 14-day trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold"
            >
              Talk to sales
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
