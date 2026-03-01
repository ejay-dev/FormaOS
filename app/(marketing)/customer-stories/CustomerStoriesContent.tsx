'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Quote, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { brand } from '@/config/brand';
import { VisualDivider } from '@/components/motion';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import { CustomerStoriesHeroVisual } from './components/CustomerStoriesHeroVisual';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

const stories = [
  {
    title: 'National disability services provider',
    context: 'NDIS provider — 400+ staff, multi-state operations, NDIS Commission registered',
    framework: 'NDIS Practice Standards (all 8 modules)',
    situation:
      'Rapid growth created fragmented evidence, unclear ownership, and high audit risk across multiple sites. Reportable incidents were tracked in spreadsheets — NDIS Commission audits required days of reconstruction.',
    outcome: [
      'Centralized evidence vault with verification and sign-off chain',
      'Clear control ownership at every practice standard module',
      'Reportable incident response down from 3 days to under 24 hours',
      'Audit preparation time reduced from 3 weeks to under 4 hours',
    ],
    quote:
      'We stopped chasing evidence in folders. FormaOS made accountability explicit and defensible — the Commission auditor had everything in front of them in 2 hours.',
    attribution: 'Head of Quality & Compliance',
  },
  {
    title: 'Regional healthcare operator',
    context: 'Healthcare network — 6 sites, NSQHS accredited, AHPRA practitioners',
    framework: 'NSQHS Standards + AHPRA + RACGP',
    situation:
      'Clinical governance controls existed on paper, but proof was inconsistent across sites. AHPRA registration renewals were tracked manually — two near-misses in 12 months. Leadership had no live posture view ahead of accreditation.',
    outcome: [
      'Control-to-evidence mapping with NSQHS Standards linkage',
      'AHPRA registration expiry alerts at 90/60/30-day intervals',
      'Executive posture dashboard with real-time framework coverage',
      'NSQHS accreditation achieved first-pass with no major findings',
    ],
    quote:
      'We finally had one place to prove what happened, when it happened, and who approved it. The accreditation visit was the easiest we have had in 8 years.',
    attribution: 'Director of Clinical Governance',
  },
  {
    title: 'Multi-site aged care organization',
    context: 'Aged care provider — 12 residential facilities, Aged Care Quality and Safety Commission registered',
    framework: 'Aged Care Quality Standards (8 standards)',
    situation:
      'Policy changes were hard to roll out uniformly, periodic reviews slipped without reliable triggers, and Standard 8 governance reporting consumed weeks of executive time before each Commission visit.',
    outcome: [
      'Policy review cadence enforced with automated task triggers',
      'Evidence renewal and expiry tracking across all 12 facilities',
      'Standard 8 governance reporting cut from 3 weeks to 2 days',
      'Commission visit resulted in commendable outcomes — no sanctions',
    ],
    quote:
      'The system makes compliance routine. We can focus on care delivery and still be fully audit-ready — Commission or not.',
    attribution: 'CEO & Registered Provider',
  },
  {
    title: 'Mid-market financial services firm',
    context: 'Financial services — 200+ staff, ASIC and APRA regulated, AML/CTF reporting obligations',
    framework: 'ISO 27001 + APRA CPS 234 + AML/CTF Act',
    situation:
      'Rapid fintech partnerships introduced new third-party risk, but control ownership and evidence collection remained manual. ASIC breach reporting timelines were tight — the team relied on email threads and shared drives to reconstruct incident histories. Board governance reporting consumed days of analyst time each quarter.',
    outcome: [
      'APRA CPS 234 control mapping with named owners and evidence trails',
      'ASIC reportable situation response time reduced from days to under 4 hours',
      'Board governance packs generated in minutes instead of days',
      'ISO 27001 surveillance audit passed with zero non-conformities',
    ],
    quote:
      'Our auditors used to spend the first two days requesting documents. Now they log into the read-only evidence room and have everything before the opening meeting.',
    attribution: 'Head of Governance, Risk & Compliance',
  },
] as const;

export default function CustomerStoriesContent() {
  return (
    <MarketingPageShell>
      {/* Hero */}
      <ImmersiveHero
        theme="customer-stories"
        visualContent={<CustomerStoriesHeroVisual />}
        badge={{ icon: <ShieldCheck className="w-4 h-4" />, text: 'Proof in Practice' }}
        headline={
          <>
            Use Case Scenarios from
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-teal-400 bg-clip-text text-transparent">
              Regulated Industries
            </span>
          </>
        }
        subheadline="These examples are anonymized by default. If you're evaluating FormaOS for procurement, we can share deeper walkthroughs under NDA."
        primaryCta={{ href: '/contact', label: 'Request a Guided Demo' }}
        secondaryCta={{ href: `${appBase}/auth/signup?source=customer_stories`, label: 'Start Free Trial' }}
      />

      <VisualDivider />

      {/* Story Cards */}
      <DeferredSection minHeight={500}>
        <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <SectionChoreography pattern="stagger-wave" className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            {stories.map((s) => (
                <motion.article
                  key={s.title}
                  whileHover={{ y: -6 }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-6 transition-colors hover:border-cyan-500/20 hover:bg-white/[0.06]"
                >
                  <h2 className="text-lg font-semibold text-white">
                    {s.title}
                  </h2>
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

                  <div className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
                        <Quote className="h-4 w-4 text-cyan-200" />
                      </div>
                      <div>
                        <p className="text-sm leading-relaxed text-slate-200 italic">
                          &ldquo;{s.quote}&rdquo;
                        </p>
                        {'attribution' in s && (
                          <p className="mt-2 text-xs font-medium text-slate-400">
                            — {s.attribution}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
            ))}
          </SectionChoreography>
        </section>
      </DeferredSection>

      <VisualDivider />

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

      {/* ROI Proof — Worked Example */}
      <DeferredSection minHeight={500}>
        <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <ScrollReveal variant="depthSlide" range={[0, 0.35]}>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-7 lg:p-10">
              <h3 className="text-lg font-semibold text-white">
                ROI Proof — Worked Example
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
                Based on an NDIS provider with 400 staff, 3 FTE compliance team, and 4 audit cycles per year. Loaded hourly rate: $85/hr (mid-market compliance analyst).
              </p>

              {/* Worked example table */}
              <div className="mt-6 rounded-xl border border-white/[0.08] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.03]">
                      <th className="text-left py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Workflow</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-rose-400">Before FormaOS</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-emerald-400">After FormaOS</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold uppercase tracking-wider text-teal-400">Hours Saved / Cycle</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-300">
                    <tr className="border-b border-white/[0.04]">
                      <td className="py-2.5 px-4">Audit preparation</td>
                      <td className="py-2.5 px-4 text-center">3 weeks (120 hrs)</td>
                      <td className="py-2.5 px-4 text-center">4 hours</td>
                      <td className="py-2.5 px-4 text-center font-semibold text-teal-400">116 hrs</td>
                    </tr>
                    <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                      <td className="py-2.5 px-4">Evidence collection & verification</td>
                      <td className="py-2.5 px-4 text-center">40 hrs / month</td>
                      <td className="py-2.5 px-4 text-center">8 hrs / month</td>
                      <td className="py-2.5 px-4 text-center font-semibold text-teal-400">96 hrs / quarter</td>
                    </tr>
                    <tr className="border-b border-white/[0.04]">
                      <td className="py-2.5 px-4">Credential & register tracking</td>
                      <td className="py-2.5 px-4 text-center">20 hrs / month</td>
                      <td className="py-2.5 px-4 text-center">2 hrs / month</td>
                      <td className="py-2.5 px-4 text-center font-semibold text-teal-400">54 hrs / quarter</td>
                    </tr>
                    <tr className="border-b border-white/[0.04] bg-white/[0.01]">
                      <td className="py-2.5 px-4">Incident response documentation</td>
                      <td className="py-2.5 px-4 text-center">3 days per incident</td>
                      <td className="py-2.5 px-4 text-center">4 hours per incident</td>
                      <td className="py-2.5 px-4 text-center font-semibold text-teal-400">~60 hrs / quarter</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-white/[0.03]">
                      <td className="py-3 px-4 font-semibold text-white" colSpan={3}>Total hours saved per quarter</td>
                      <td className="py-3 px-4 text-center font-bold text-teal-400">~326 hrs</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* ROI summary */}
              <SectionChoreography pattern="stagger-wave" className="mt-6 grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 text-center">
                  <div className="text-xl font-bold text-teal-400">$27,710</div>
                  <div className="text-xs text-slate-400 mt-1">Quarterly savings</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">326 hrs × $85/hr</div>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 text-center">
                  <div className="text-xl font-bold text-teal-400">$110,840</div>
                  <div className="text-xs text-slate-400 mt-1">Annual savings</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">4 audit cycles / year</div>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 text-center">
                  <div className="text-xl font-bold text-teal-400">&lt; 1 month</div>
                  <div className="text-xs text-slate-400 mt-1">Payback period</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">At Professional tier pricing</div>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4 text-center">
                  <div className="text-xl font-bold text-teal-400">38×</div>
                  <div className="text-xs text-slate-400 mt-1">Annual ROI multiple</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Savings ÷ annual license</div>
                </div>
              </SectionChoreography>

              <p className="mt-4 text-[10px] text-slate-500">
                Illustrative example based on typical NDIS provider metrics. Actual savings vary by organization size, audit frequency, and compliance team structure. We can model your specific scenario during evaluation.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/customer-stories/template"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(34,211,238,0.25)] transition hover:shadow-[0_0_32px_rgba(34,211,238,0.4)]"
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
