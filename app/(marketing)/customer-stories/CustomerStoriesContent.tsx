'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Quote, ShieldCheck } from 'lucide-react';
import { brand } from '@/config/brand';
import { Reveal, VisualDivider } from '@/components/motion';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import { easing, duration } from '@/config/motion';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

const stories = [
  {
    title: 'National disability services provider',
    situation:
      'Rapid growth created fragmented evidence, unclear ownership, and high audit risk across multiple sites.',
    outcome: [
      'Centralized evidence vault with verification flow',
      'Clear control ownership and task accountability',
      'Faster audit response with exportable bundles',
    ],
    quote:
      'We stopped chasing evidence in folders. FormaOS made accountability explicit and defensible.',
  },
  {
    title: 'Regional healthcare operator',
    situation:
      'Operational controls existed, but proof was inconsistent. Leadership lacked a single readiness view.',
    outcome: [
      'Control-to-evidence mapping with audit history',
      'Executive posture view aligned to frameworks',
      'Operational workflows tied to compliance requirements',
    ],
    quote:
      'We finally had one place to prove what happened, when it happened, and who approved it.',
  },
  {
    title: 'Multi-site aged care organization',
    situation:
      'Policy changes were hard to roll out, and periodic reviews slipped without reliable triggers.',
    outcome: [
      'Policy review cadence enforced with tasks',
      'Evidence renewal and expiry tracking',
      'Audit trail for changes and approvals',
    ],
    quote:
      'The system makes compliance routine. We can focus on operations and still be audit-ready.',
  },
] as const;

export default function CustomerStoriesContent() {
  return (
    <MarketingPageShell>
      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 lg:px-8 lg:pb-16 lg:pt-36">
        <Reveal variant="fadeInUp">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-100">
            <ShieldCheck className="h-4 w-4" />
            Proof in Practice
          </div>
        </Reveal>
        <Reveal variant="fadeInUp" delay={0.1}>
          <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            Use case scenarios from regulated industries
          </h1>
        </Reveal>
        <Reveal variant="fadeInUp" delay={0.2}>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
            These examples are anonymized by default. If you&apos;re evaluating FormaOS
            for procurement, we can share deeper walkthroughs under NDA.
          </p>
        </Reveal>
        <Reveal variant="fadeInUp" delay={0.3}>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(34,211,238,0.25)] transition hover:shadow-[0_0_32px_rgba(34,211,238,0.4)]"
            >
              Request a Guided Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`${appBase}/auth/signup?source=customer_stories`}
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Start Free Trial
            </Link>
          </div>
        </Reveal>
      </section>

      <VisualDivider />

      {/* Story Cards */}
      <DeferredSection minHeight={500}>
        <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {stories.map((s, i) => (
              <ScrollReveal key={s.title} variant="fadeUp" range={[i * 0.04, 0.3 + i * 0.04]}>
                <motion.article
                  whileHover={{ y: -6 }}
                  className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-6 transition-colors hover:border-cyan-500/20 hover:bg-white/[0.06]"
                >
                  <h2 className="text-lg font-semibold text-white">{s.title}</h2>
                  <div className="mt-3 text-sm leading-relaxed text-slate-300">
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
                      <p className="text-sm leading-relaxed text-slate-200">
                        {s.quote}
                      </p>
                    </div>
                  </div>
                </motion.article>
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>

      <VisualDivider />

      {/* Buyer-ready proof walkthrough CTA */}
      <DeferredSection minHeight={160}>
        <section className="relative mx-auto max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent backdrop-blur-sm p-7 lg:p-10">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Want a buyer-ready proof walkthrough?
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                    We can walk your team through security, posture reporting, and
                    evidence defensibility using your evaluation criteria.
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
          </Reveal>
        </section>
      </DeferredSection>

      {/* ROI Proof */}
      <DeferredSection minHeight={400}>
        <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-7 lg:p-10">
              <h3 className="text-lg font-semibold text-white">ROI Proof (Structure)</h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-300">
                Procurement teams typically approve when ROI inputs are explicit. We
                recommend capturing hours saved by function (audit prep, evidence
                collection, register tracking, incident handling) and converting to
                fully loaded wage rates (low/median/high).
              </p>
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: duration.fast, delay: 0.1, ease: easing.signature }}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4"
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Inputs
                  </div>
                  <ul className="mt-2 space-y-2 text-sm text-slate-300">
                    <li>Hours saved per month (by workflow)</li>
                    <li>Audit cycle frequency</li>
                    <li>Wage assumptions (low/median/high)</li>
                  </ul>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: duration.fast, delay: 0.18, ease: easing.signature }}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4"
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Outputs
                  </div>
                  <ul className="mt-2 space-y-2 text-sm text-slate-300">
                    <li>Monthly savings ($)</li>
                    <li>Annualized savings ($)</li>
                    <li>Payback period (months)</li>
                  </ul>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: duration.fast, delay: 0.26, ease: easing.signature }}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.04] p-4"
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Proof
                  </div>
                  <ul className="mt-2 space-y-2 text-sm text-slate-300">
                    <li>Export bundle timestamps</li>
                    <li>Audit log excerpts</li>
                    <li>Governance pack PDF/ZIP artifacts</li>
                  </ul>
                </motion.div>
              </div>

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
          </Reveal>
        </section>
      </DeferredSection>
    </MarketingPageShell>
  );
}
