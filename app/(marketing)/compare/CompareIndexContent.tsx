'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Scale, ShieldCheck } from 'lucide-react';
import { Reveal } from '@/components/motion';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import { motion } from 'framer-motion';
import { CompareHeroVisual } from './components/CompareHeroVisual';
import { DotGrid } from '@/components/marketing/SectionBackgrounds';
import { compliancePlanHref, PUBLIC_CTA_LABELS } from '@/lib/marketing/cta';

const comparisons = [
  {
    href: '/compare/complispace',
    name: 'Ideagen Policy Logic',
    tagline:
      'Enterprise GRC training + policy management vs operational compliance execution',
  },
  {
    href: '/compare/riskware',
    name: 'Riskware',
    tagline:
      'Risk register and audit tools vs workflow-enforced evidence operating system',
  },
  {
    href: '/compare/6clicks',
    name: '6clicks',
    tagline:
      'GRC framework coverage vs accountable workflow execution and evidence posture',
  },
  {
    href: '/compare/healthmetrics',
    name: 'HealthMetrics',
    tagline:
      'Clinical governance and quality reporting vs operational compliance with evidence chain-of-custody',
  },
] as const;

const differentiators = [
  'Purpose-built for NDIS, aged care, healthcare, and childcare — not SaaS security teams',
  'Operational accountability: tasks, owners, deadlines, and audit history in one chain',
  'Evidence defensibility: verification workflows and chain-of-custody for regulators',
  'Australian data residency and pre-built frameworks for AU-regulated industries',
] as const;

const evaluationPlaybook = [
  {
    title: '1. Define outcomes, not pages',
    detail:
      'Assess whether the platform helps your team evaluate risk, prove readiness, and operate controls continuously.',
  },
  {
    title: '2. Validate workflow defensibility',
    detail:
      'Test if tasks, evidence, ownership, and approvals stay connected in one auditable chain-of-custody.',
  },
  {
    title: '3. Run a buyer-grade trust review',
    detail:
      'Use a procurement lens: security review packet, trust artifacts, and objection handling for legal/security teams.',
  },
] as const;

export default function CompareIndexContent() {
  return (
    <MarketingPageShell>
      {/* Hero */}
      <ImmersiveHero
        theme="compare"
        visualContent={<CompareHeroVisual competitor="Alternatives" />}
        badge={{ icon: <Scale className="w-4 h-4" />, text: 'Compare' }}
        headline={
          <>
            FormaOS vs the
            <br />
            <span className="text-foreground">
              Alternatives
            </span>
          </>
        }
        subheadline="How FormaOS compares to GRC tools, care software, and legacy compliance — on the features that matter for NDIS, aged care, and healthcare."
        primaryCta={{
          href: '/contact?type=procurement',
          label: 'Start Buyer Review',
        }}
        secondaryCta={{
          href: compliancePlanHref('compare_index_hero'),
          label: PUBLIC_CTA_LABELS.compliancePlan,
        }}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Competitor Cards */}
      <DeferredSection minHeight={240}>
        <section className="mk-section relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <DotGrid />
          <SectionChoreography
            pattern="alternating"
            className="grid gap-4 lg:grid-cols-3"
          >
            {comparisons.map((c) => (
              <motion.div key={c.href} whileHover={{ y: -6 }}>
                <Link
                  href={c.href}
                  className="group block rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-6 transition-colors hover:border-cyan-500/20 hover:bg-white/[0.06]"
                >
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Compare
                  </div>
                  <div className="mt-2 text-xl font-semibold text-white">
                    FormaOS vs {c.name}
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{c.tagline}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
                    View comparison
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </SectionChoreography>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* What "compliance OS" means vs traditional GRC — SSR'd */}
      <section
        aria-labelledby="compare-category-explainer"
        className="relative mx-auto max-w-5xl px-4 pb-14 sm:px-6 lg:px-8"
      >
        <h2
          id="compare-category-explainer"
          className="text-3xl sm:text-4xl font-bold text-white"
        >
          Compliance OS vs traditional GRC and care software
        </h2>
        <p className="mt-4 text-slate-300 leading-relaxed">
          Most platforms that show up in a procurement shortlist sit in one
          of three buckets: legacy GRC suites built for SaaS security teams
          (6clicks, Riskware), policy and training repositories with light
          workflow on top (Ideagen / CompliSpace), or vertical care software
          that solves clinical reporting but treats compliance as a side
          module (HealthMetrics). Each does its bucket well. None of them
          treat compliance as an operating layer that the rest of the
          business plugs into.
        </p>
        <p className="mt-4 text-slate-300 leading-relaxed">
          FormaOS is a compliance operating system. The distinction matters
          when you are running a regulated organisation — an NDIS provider
          managing 80 staff and a quarterly audit window, an aged-care
          operator preparing for an unannounced visit, a financial services
          licensee whose ASIC obligations cross five teams. You need the
          policy library, the training records, the risk register, and the
          control execution to be the <em>same</em> system, with one
          accountability graph and one evidence chain.
        </p>

        <h3 className="mt-10 text-xl font-semibold text-white">
          What this changes in practice
        </h3>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5">
            <h4 className="text-base font-semibold text-white">
              Single source of truth
            </h4>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Policies, controls, evidence, training, incidents, and risk
              register live in one graph. Updating a control updates every
              framework that references it — no spreadsheet duplication, no
              quarterly reconciliation between tools.
            </p>
          </article>
          <article className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5">
            <h4 className="text-base font-semibold text-white">
              Named accountability
            </h4>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Every obligation has a named owner with a real due date.
              Compliance is no longer &quot;everyone&apos;s job&quot; — it is
              specific people, with specific evidence, on a calendar the
              board can read.
            </p>
          </article>
          <article className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5">
            <h4 className="text-base font-semibold text-white">
              Audit-ready continuously
            </h4>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              Evidence bundles regenerate as work happens. When the audit
              window opens — scheduled or unannounced — the export is one
              click, not a six-week scramble through email, Drive, and the
              old SharePoint nobody remembers the password for.
            </p>
          </article>
          <article className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5">
            <h4 className="text-base font-semibold text-white">
              Built for Australian regulators
            </h4>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              NDIS Practice Standards, AHPRA, NSQHS, ACECQA, AFS licence,
              AUSTRAC, SafeWork — the obligation library is pre-built for
              the regulators Australian operators actually answer to, not
              ported from a US SOC 2 tool.
            </p>
          </article>
        </div>

        <h3 className="mt-10 text-xl font-semibold text-white">
          How to read the comparisons below
        </h3>
        <p className="mt-4 text-slate-300 leading-relaxed">
          The four head-to-head pages cover the platforms we hear about most
          in buyer conversations. They are written for compliance leaders
          who already know what they need — not as feature checklists, but
          as a clear read on where each platform&apos;s centre of gravity
          actually sits. If you are evaluating something not listed,{' '}
          <Link
            href="/contact?type=procurement"
            className="text-cyan-300 underline-offset-4 hover:underline"
          >
            start a buyer review
          </Link>{' '}
          and we will work through your specific shortlist.
        </p>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      </div>

      {/* Differentiators */}
      <DeferredSection minHeight={280}>
        <section className="mk-section relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent backdrop-blur-sm p-7 lg:p-10">
              <div className="flex items-center gap-3">
                <div className="inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
                  <ShieldCheck className="h-5 w-5 text-cyan-200" />
                </div>
                <h2 className="text-lg font-semibold text-white">
                  What FormaOS is optimized for
                </h2>
              </div>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2 text-sm text-slate-300">
                {differentiators.map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-slate-500">
                Comparisons are high-level and intended for evaluation. Specific
                feature parity varies by plan and deployment.
              </p>
            </div>
          </Reveal>
        </section>
      </DeferredSection>

      {/* Evaluation Playbook */}
      <DeferredSection minHeight={240}>
        <section className="mk-section relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionChoreography
            pattern="alternating"
            className="grid gap-4 lg:grid-cols-3"
          >
            {evaluationPlaybook.map((step) => (
              <motion.article
                key={step.title}
                whileHover={{ y: -6 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-6 transition-colors hover:border-cyan-500/20 hover:bg-white/[0.06]"
              >
                <h3 className="text-sm font-semibold uppercase tracking-wider text-cyan-200">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {step.detail}
                </p>
              </motion.article>
            ))}
          </SectionChoreography>
        </section>
      </DeferredSection>
    </MarketingPageShell>
  );
}
