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
          <SectionChoreography pattern="stagger-wave" className="grid gap-4 lg:grid-cols-3">
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
                      <p className="text-sm leading-relaxed text-slate-200 italic">
                        "{s.quote}"
                      </p>
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

      {/* ROI Proof */}
      <DeferredSection minHeight={400}>
        <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <ScrollReveal variant="depthSlide" range={[0, 0.35]}>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-7 lg:p-10">
              <h3 className="text-lg font-semibold text-white">
                ROI Proof (Structure)
              </h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
                Procurement teams typically approve when ROI inputs are
                explicit. We recommend capturing hours saved by function (audit
                prep, evidence collection, register tracking, incident handling)
                and converting to fully loaded wage rates (low/median/high).
              </p>
              <SectionChoreography pattern="stagger-wave" className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Inputs
                  </div>
                  <ul className="mt-2 space-y-2 text-sm text-slate-300">
                    <li>Hours saved per month (by workflow)</li>
                    <li>Audit cycle frequency</li>
                    <li>Wage assumptions (low/median/high)</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Outputs
                  </div>
                  <ul className="mt-2 space-y-2 text-sm text-slate-300">
                    <li>Monthly savings ($)</li>
                    <li>Annualized savings ($)</li>
                    <li>Payback period (months)</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Proof
                  </div>
                  <ul className="mt-2 space-y-2 text-sm text-slate-300">
                    <li>Export bundle timestamps</li>
                    <li>Audit log excerpts</li>
                    <li>Governance pack PDF/ZIP artifacts</li>
                  </ul>
                </div>
              </SectionChoreography>

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
