'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Scale, ShieldCheck, Info } from 'lucide-react';
import { brand } from '@/config/brand';
import { Reveal, VisualDivider } from '@/components/motion';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { CursorTilt } from '@/components/motion/CursorTilt';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DeferredSection } from '../components/shared';
import { motion } from 'framer-motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { isCareLaunchMode } from '@/lib/vertical-launch';

const appBase = brand.seo.appUrl.replace(/\/$/, '');
const careLaunchMode = isCareLaunchMode();

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
      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 lg:px-8 lg:pb-16 lg:pt-36 overflow-hidden">
        <HeroAtmosphere topColor="cyan" bottomColor="blue" />
        <CursorTilt intensity={3} glowFollow glowColor="34,211,238" className="relative z-10">
          <Reveal variant="fadeInUp">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-100">
              <Scale className="h-4 w-4" />
              Compare
            </div>
          </Reveal>
          <Reveal variant="fadeInUp" delay={0.1}>
            <h1 className="mt-6 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              Evaluate FormaOS against modern compliance tools
            </h1>
          </Reveal>
          <Reveal variant="fadeInUp" delay={0.2}>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Many platforms help you prepare for an audit. FormaOS is designed to
              operate compliance continuously: enforce controls as workflows and
              keep evidence defensible by default.
            </p>
          </Reveal>

          {/* Care-launch notice — shown when comparisons are not care-specific */}
          {careLaunchMode && (
            <Reveal variant="fadeInUp" delay={0.25}>
              <div className="mt-6 inline-flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-sm text-amber-200 max-w-2xl">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-400" />
                <span>
                  These comparison pages were designed for a general enterprise audience. FormaOS is currently
                  focused on care providers (NDIS, Aged Care, Healthcare & Child Care). The comparisons below
                  remain accessible but are not our primary promotional focus right now.
                </span>
              </div>
            </Reveal>
          )}

          <Reveal variant="fadeInUp" delay={0.3}>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(34,211,238,0.25)] transition hover:shadow-[0_0_32px_rgba(34,211,238,0.4)]"
              >
                Request Evaluation Walkthrough
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`${appBase}/auth/signup?source=compare`}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-colors"
              >
                Start Free Trial
              </Link>
            </div>
          </Reveal>
        </CursorTilt>
      </section>

      <VisualDivider />

      {/* Competitor Cards */}
      <DeferredSection minHeight={240}>
        <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {comparisons.map((c, i) => (
              <ScrollReveal key={c.href} variant="fadeUp" range={[i * 0.04, 0.3 + i * 0.04]}>
                <motion.div whileHover={{ y: -6 }}>
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
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>

      <VisualDivider gradient={false} />

      {/* Differentiators */}
      <DeferredSection minHeight={280}>
        <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
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
        <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          <div className="grid gap-4 lg:grid-cols-3">
            {evaluationPlaybook.map((step, i) => (
              <ScrollReveal key={step.title} variant="fadeUp" range={[i * 0.04, 0.3 + i * 0.04]}>
                <motion.article
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
              </ScrollReveal>
            ))}
          </div>
        </section>
      </DeferredSection>
    </MarketingPageShell>
  );
}
