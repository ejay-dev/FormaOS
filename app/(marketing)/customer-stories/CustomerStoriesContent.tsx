'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import { CustomerStoriesHeroVisual } from './components/CustomerStoriesHeroVisual';
import {
  compliancePlanHref,
  demoHref,
  PUBLIC_CTA_LABELS,
} from '@/lib/marketing/cta';

// Illustrative use-case scenarios — not anonymised customer histories.
// Each one describes how FormaOS would land in a buyer of this shape,
// using product capabilities that are actually shipping. Framework
// labels reflect what's in lib/compliance/evaluators/register.ts: only
// the 8 packs (SOC 2 TSC, ISO 27001, NIST CSF, CIS, HIPAA, GDPR, PCI DSS,
// NDIS Practice Standards) ship as auto-evaluators. Industry standards
// like NSQHS, RACGP, ACQS, and APRA CPS 234 are mapped via custom
// controls + templates, not as full evaluator packs.
const stories = [
  {
    title: 'NDIS provider scenario',
    context:
      'Illustrative scope — multi-site NDIS Commission-registered provider',
    framework: 'NDIS Practice Standards · 25 evaluators across 8 modules',
    situation:
      'Rapid growth fragments evidence across shared drives. Reportable incidents tracked manually. NDIS Commission audits require days of reconstruction. Statutory SIRS clock (24h immediate / 5 business-day detailed) is hard to evidence after the fact.',
    outcome: [
      'NDIS Practice Standards mapped end-to-end (25 evaluators) — named owner per module',
      'org_incidents schema encodes the SIRS 24h / 5bd clock at the predicate layer',
      'Hash-chained audit log; chain top anchors daily to Sigstore Rekor at 05:30 UTC',
      'Audit export ZIP with framework summary, evidence references, score history',
    ],
  },
  {
    title: 'Healthcare network scenario',
    context:
      'Illustrative scope — multi-site healthcare operator with NSQHS accreditation cycle + AHPRA-registered practitioners',
    framework:
      'AHPRA credential tracking · custom NSQHS / RACGP control mapping',
    situation:
      'Clinical governance controls exist on paper, proof is inconsistent across sites. AHPRA registration renewals tracked manually. Leadership lacks a live posture view ahead of accreditation. NSQHS Standards and RACGP requirements are mapped through templates and custom controls, not as shipping evaluator packs.',
    outcome: [
      'AHPRA credential register with 90 / 60 / 30-day expiry alerts',
      'Custom-control mapping for NSQHS Standards + RACGP general-practice requirements',
      'ISO 27001 (93 evaluators) auto-evaluating nightly against your live data',
      'Cross-site executive posture rendered at /app/compliance/health',
    ],
  },
  {
    title: 'Aged-care operator scenario',
    context:
      'Illustrative scope — multi-site provider under the Aged Care Quality and Safety Commission',
    framework:
      'Aged Care Quality Standards via custom controls · ISO 27001 evaluator pack',
    situation:
      'Policy changes are hard to roll out uniformly. Periodic reviews slip without reliable triggers. Standard 8 governance reporting consumes executive time before each Commission visit. The Aged Care Quality Standards are mapped via custom controls + policy templates rather than a shipping evaluator pack.',
    outcome: [
      'Policy lifecycle with automated review-cadence triggers per Standard',
      'Evidence renewal + expiry tracking across multiple facilities',
      'ISO 27001 evaluator coverage layered on top for IT/security obligations',
      'Audit export ZIP generated on demand with SHA-256 evidence hashes',
    ],
  },
  {
    title: 'Financial services scenario',
    context:
      'Illustrative scope — ASIC + APRA-regulated firm with AML/CTF reporting obligations',
    framework:
      'ISO 27001 · SOC 2 TSC · APRA CPS 234 via custom controls · AML/CTF policy library',
    situation:
      'Fintech partnerships introduce new third-party risk. ASIC reportable-situation timelines are tight; teams rely on email threads to reconstruct incident histories. Board governance reporting consumes days of analyst time each quarter. APRA CPS 234 is mapped via custom controls (not a shipping evaluator pack).',
    outcome: [
      'SOC 2 TSC (61 evaluators) + ISO 27001 (93 evaluators) running nightly',
      'APRA CPS 234 obligations mapped via custom controls with named owners',
      'AML/CTF program tracked in the policy library with review cadence enforced',
      'Board-ready posture rendered live; audit export ZIP available on demand',
    ],
  },
] as const;

export default function CustomerStoriesContent() {
  return (
    <MarketingPageShell>
      {/* Hero */}
      <ImmersiveHero
        theme="customer-stories"
        visualContent={<CustomerStoriesHeroVisual />}
        badge={{
          icon: <ShieldCheck className="w-4 h-4" />,
          text: 'Proof in Practice',
        }}
        headline={
          <>
            Use Case Scenarios from
            <br />
            <span className="text-foreground">
              Regulated Industries
            </span>
          </>
        }
        subheadline="Illustrative scenarios showing how FormaOS lands in regulated industries — not anonymised customer histories. Real deployments discussed during evaluation."
        primaryCta={{
          href: demoHref('customer_stories_hero'),
          label: PUBLIC_CTA_LABELS.bookDemo,
        }}
        secondaryCta={{
          href: compliancePlanHref('customer_stories_hero'),
          label: PUBLIC_CTA_LABELS.compliancePlan,
        }}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>

      {/* Story Cards */}
      <DeferredSection minHeight={500}>
        <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <SectionChoreography
            pattern="stagger-wave"
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-2"
          >
            {stories.map((s) => (
              <motion.article
                key={s.title}
                whileHover={{ y: -6 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-6 transition-colors hover:border-cyan-500/20 hover:bg-white/[0.06]"
              >
                <h2 className="text-lg font-semibold text-white">{s.title}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-slate-400">
                    {s.context}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-medium text-cyan-300">
                    {s.framework}
                  </span>
                </div>
                <div className="mt-4 text-sm leading-relaxed text-slate-300">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Situation
                  </div>
                  <p className="mt-2">{s.situation}</p>
                </div>

                <div className="mt-5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Outcomes
                  </div>
                  <ul className="mt-2 space-y-2 text-sm text-slate-300">
                    {s.outcome.map((o) => (
                      <li key={o} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Quote block removed 2026-05-28 — the previous
                    quotes ("- Head of Quality & Compliance", etc.) read
                    as anonymised customer testimonials, but there are
                    no real customer deployments behind them. These
                    cards are illustrative scenarios; they shouldn't
                    pretend to be quotes from real buyers. */}
              </motion.article>
            ))}
          </SectionChoreography>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>

      {/* Buyer-ready proof walkthrough CTA */}
      <DeferredSection minHeight={160}>
        <section className="relative mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          <ScrollReveal variant="depthSlide" range={[0, 0.35]}>
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent backdrop-blur-sm p-7 lg:p-10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Want a buyer-ready proof walkthrough?
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                    We can walk your team through security, posture reporting,
                    and evidence defensibility using your evaluation criteria.
                  </p>
                </div>
                <Link
                  href="/security-review"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Security Review Packet
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </DeferredSection>

      {/* ROI Proof - Worked Example */}
      <DeferredSection minHeight={500}>
        <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <ScrollReveal variant="depthSlide" range={[0, 0.35]}>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-7 lg:p-10">
              <h3 className="text-lg font-semibold text-white">
                ROI Proof - Worked Example
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
                Based on an NDIS provider with 400 staff, 3 FTE compliance team,
                and 4 audit cycles per year. Loaded hourly rate: $85/hr
                (mid-market compliance analyst).
              </p>

              {/* Worked example table */}
              <div className="mt-6 rounded-xl border border-white/[0.08] overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Workflow
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-rose-400">
                        Before FormaOS
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                        After FormaOS
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-teal-400">
                        Hours Saved / Cycle
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b border-white/[0.04]">
                      <td className="py-2.5 px-4">Audit preparation</td>
                      <td className="py-2.5 px-4 text-center">
                        3 weeks (120 hrs)
                      </td>
                      <td className="py-2.5 px-4 text-center">4 hours</td>
                      <td className="py-2.5 px-4 text-center font-semibold text-teal-400">
                        116 hrs
                      </td>
                    </tr>
                    <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                      <td className="py-2.5 px-4">
                        Evidence collection & verification
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        40 hrs / month
                      </td>
                      <td className="py-2.5 px-4 text-center">8 hrs / month</td>
                      <td className="py-2.5 px-4 text-center font-semibold text-teal-400">
                        96 hrs / quarter
                      </td>
                    </tr>
                    <tr className="border-b border-white/[0.04]">
                      <td className="py-2.5 px-4">
                        Credential & register tracking
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        20 hrs / month
                      </td>
                      <td className="py-2.5 px-4 text-center">2 hrs / month</td>
                      <td className="py-2.5 px-4 text-center font-semibold text-teal-400">
                        54 hrs / quarter
                      </td>
                    </tr>
                    <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                      <td className="py-2.5 px-4">
                        Incident response documentation
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        3 days per incident
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        4 hours per incident
                      </td>
                      <td className="py-2.5 px-4 text-center font-semibold text-teal-400">
                        ~60 hrs / quarter
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-white/[0.03]">
                      <td
                        className="py-3 px-4 font-semibold text-white"
                        colSpan={3}
                      >
                        Total hours saved per quarter
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-teal-400">
                        ~326 hrs
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* ROI summary */}
              <SectionChoreography
                pattern="stagger-wave"
                className="mt-6 grid gap-3 md:grid-cols-4"
              >
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 text-center">
                  <div className="text-xl font-bold text-teal-400">$27,710</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Quarterly savings
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    326 hrs × $85/hr
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 text-center">
                  <div className="text-xl font-bold text-teal-400">
                    $110,840
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Annual savings
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    4 audit cycles / year
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 text-center">
                  <div className="text-xl font-bold text-teal-400">
                    &lt; 1 month
                  </div>
                  <div className="text-xs text-slate-400 mt-1">
                    Payback period
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    At Growth tier pricing
                  </div>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 text-center">
                  <div className="text-xl font-bold text-teal-400">38×</div>
                  <div className="text-xs text-slate-400 mt-1">
                    Annual ROI multiple
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Savings ÷ annual license
                  </div>
                </div>
              </SectionChoreography>

              <p className="mt-4 text-[10px] text-slate-500">

                Illustrative example based on typical NDIS provider metrics as of March 2026.
                Actual savings vary by organization size, audit frequency, and
                compliance team structure. We can model your specific scenario
                during evaluation.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/customer-stories/template"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-6 py-3 text-sm font-semibold shadow-lg transition hover:opacity-90"
                >
                  Use Case Study Template
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/trust"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
                >
                  Trust Center
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </DeferredSection>
    </MarketingPageShell>
  );
}
