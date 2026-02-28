'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Scale, ShieldCheck } from 'lucide-react';
import { brand } from '@/config/brand';
import { Reveal, VisualDivider } from '@/components/motion';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import { motion } from 'framer-motion';
import { CompareHeroVisual } from './components/CompareHeroVisual';

const appBase = brand.seo.appUrl.replace(/\/$/, '');

const comparisons = [
  {
    href: '/compare/vanta',
    name: 'Vanta',
    tagline: 'Compliance automation vs compliance execution OS',
  },
  {
    href: '/compare/drata',
    name: 'Drata',
    tagline: 'Continuous monitoring vs operational workflow governance',
  },
  {
    href: '/compare/secureframe',
    name: 'Secureframe',
    tagline: 'Program setup vs defensible workflow and evidence chain',
  },
] as const;

const differentiators = [
  'Operational accountability: tasks, owners, deadlines, and audit history',
  'Evidence defensibility: verification workflows and chain-of-custody context',
  'Cross-surface trust: buyer-facing assurance and posture snapshots',
  'Built for regulated operators, not only security teams',
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
            Evaluate FormaOS Against
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-teal-400 bg-clip-text text-transparent">
              Modern Compliance Tools
            </span>
          </>
        }
        subheadline="Compare platforms by execution depth: workflow-enforced controls, accountable ownership, and defensible evidence."
        primaryCta={{ href: '/contact', label: 'Book Evaluation Demo' }}
        secondaryCta={{ href: `${appBase}/auth/signup?source=compare`, label: 'Start Free Trial' }}
      />

      <VisualDivider />

      {/* Competitor Cards */}
      <DeferredSection minHeight={240}>
        <section className="mk-section relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionChoreography pattern="alternating" className="grid gap-4 lg:grid-cols-3">
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

      <VisualDivider gradient={false} />

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
          <SectionChoreography pattern="alternating" className="grid gap-4 lg:grid-cols-3">
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
