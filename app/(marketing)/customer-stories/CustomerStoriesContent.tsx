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
import { SectionMedia } from '@/components/marketing/SectionMedia';
import {
  compliancePlanHref,
  demoHref,
  PUBLIC_CTA_LABELS,
} from '@/lib/marketing/cta';
import { getPackControlCount } from '@/lib/marketing/claims';

/**
 * Renders a pack's real control count. Falls back to a countless phrase so a
 * renamed slug surfaces as vague copy in review rather than "null mapped
 * controls" on the live page.
 */
function controlsPhrase(slug: string): string {
  const count = getPackControlCount(slug);
  return count === null ? 'mapped controls' : `${count} mapped controls`;
}

// Illustrative use-case scenarios, not anonymised customer histories.
// Each one describes how FormaOS would land in a buyer of this shape,
// using capabilities that ship today. Standards named without a control
// count (NSQHS, RACGP, the Aged Care Quality Standards, APRA CPS 234) are
// mapped through custom controls and templates rather than scored packs,
// and the copy has to keep saying so.
const stories = [
  {
    title: 'NDIS provider scenario',
    context:
      'Illustrative scope: multi-site NDIS Commission-registered provider',
    framework: `NDIS Practice Standards · ${controlsPhrase('ndis')}`,
    situation:
      'Rapid growth fragments evidence across shared drives. Reportable incidents tracked manually. NDIS Commission audits require days of reconstruction. Statutory SIRS clock (24 hours for the immediate notification, five business days for the detailed report) is hard to evidence after the fact.',
    outcome: [
      'NDIS Practice Standards installed as a scored pack, with a named owner on every control',
      'The SIRS clock runs on the incident record itself: 24 hours to notify, five business days for the detailed report, both enforced as deadlines rather than reminders',
      'Hash-chained audit log, anchored daily to a public transparency log so a regulator can verify an event without trusting us',
      'Audit export bundle with the framework summary, evidence references and score history',
    ],
  },
  {
    title: 'Healthcare network scenario',
    context:
      'Illustrative scope: multi-site healthcare operator with NSQHS accreditation cycle + AHPRA-registered practitioners',
    framework:
      'AHPRA credential tracking · custom NSQHS / RACGP control mapping',
    situation:
      'Clinical governance controls exist on paper, proof is inconsistent across sites. AHPRA registration renewals tracked manually. Leadership lacks a live posture view ahead of accreditation. NSQHS Standards and RACGP requirements are mapped through templates and custom controls, not as shipping evaluator packs.',
    outcome: [
      'AHPRA credential register with 90 / 60 / 30-day expiry alerts',
      'Custom-control mapping for NSQHS Standards + RACGP general-practice requirements',
      `ISO 27001:2022 (${controlsPhrase('iso27001-2022')}) checked nightly against your live data`,
      'Cross-site posture on one executive screen, updated as evidence lands',
    ],
  },
  {
    title: 'Aged-care operator scenario',
    context:
      'Illustrative scope: multi-site provider under the Aged Care Quality and Safety Commission',
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
      'Illustrative scope: ASIC + APRA-regulated firm with AML/CTF reporting obligations',
    framework:
      'ISO 27001 · SOC 2 TSC · APRA CPS 234 via custom controls · AML/CTF policy library',
    situation:
      'Fintech partnerships introduce new third-party risk. ASIC reportable-situation timelines are tight; teams rely on email threads to reconstruct incident histories. Board governance reporting consumes days of analyst time each quarter. APRA CPS 234 is mapped via custom controls (not a shipping evaluator pack).',
    outcome: [
      `SOC 2 (${controlsPhrase('soc2-tsc')}) and ISO 27001 (${controlsPhrase('iso27001-2022')}) checked nightly`,
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
      <div className="relative isolate overflow-hidden">
        <SectionMedia
          src="/marketing-media/customer-stories.jpg"
          objectPosition="50% 35%"
          opacity={0.85}
          scrim="center"
        />
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
              <span className="text-foreground">Regulated Industries</span>
            </>
          }
          subheadline="Illustrative scenarios showing how FormaOS lands in regulated industries, not anonymised customer histories. Real deployments discussed during evaluation."
          primaryCta={{
            href: demoHref('customer_stories_hero'),
            label: PUBLIC_CTA_LABELS.bookDemo,
          }}
          secondaryCta={{
            href: compliancePlanHref('customer_stories_hero'),
            label: PUBLIC_CTA_LABELS.compliancePlan,
          }}
        />
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

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
                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-6 transition-colors hover:border-white/20 hover:bg-white/[0.06]"
              >
                <h2 className="text-lg font-semibold text-white">{s.title}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-slate-400">
                    {s.context}
                  </span>
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
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

                {/* Quote block removed 2026-05-28, the previous
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Buyer-ready proof walkthrough CTA */}
      <DeferredSection minHeight={160}>
        <section className="relative mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          <ScrollReveal variant="depthSlide" range={[0, 0.35]}>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-7 lg:p-10">
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

      {/* ROI Proof: Worked Example */}
      <DeferredSection minHeight={500}>
        <section className="relative isolate overflow-hidden mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <ScrollReveal variant="depthSlide" range={[0, 0.35]}>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 lg:p-10">
              <h3 className="text-lg font-semibold text-white">
                The four workflows worth measuring
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
                This is a worksheet, not a result. It assumes a multi-site NDIS
                provider with about 400 staff, three full-time compliance people
                and four audit cycles a year. During an evaluation each row gets
                replaced with your own figures, so the difference is measured
                rather than asserted.
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
                        Assumed manual effort
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                        Target with FormaOS
                      </th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-white">
                        Difference to verify
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
                      <td className="py-2.5 px-4 text-center font-semibold text-white">
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
                      <td className="py-2.5 px-4 text-center font-semibold text-white">
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
                      <td className="py-2.5 px-4 text-center font-semibold text-white">
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
                      <td className="py-2.5 px-4 text-center font-semibold text-white">
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
                        Hours to measure per quarter
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-white">
                        ~326 hrs
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <p className="mt-4 text-xs leading-relaxed text-slate-500">
                No deployment sits behind these figures. They are starting
                assumptions to test against your own operation, line by line,
                and none of them belongs in a business case until it has been.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href={compliancePlanHref('customer_stories_worksheet')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-6 py-3 text-sm font-semibold shadow-lg transition hover:opacity-90"
                >
                  {PUBLIC_CTA_LABELS.compliancePlan}
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
