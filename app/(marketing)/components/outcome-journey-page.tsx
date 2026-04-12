'use client';

import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { brand } from '@/config/brand';
import { Reveal } from '@/components/motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { MarketingPageShell } from './shared/MarketingPageShell';
import { DeferredSection } from './shared';
import { OutcomeJourneyHeroVisual } from './OutcomeJourneyHeroVisual';

type JourneyPageProps = {
  badge: string;
  title: string;
  description: string;
  proofLabel: string;
  proofValue: string;
  proofNote?: string;
  workflow: string[];
  outcomes: string[];
  pillarsEyebrow: string;
  pillarsTitle: string;
  pillarsDescription: string;
  pillars: Array<{
    title: string;
    detail: string;
    href: string;
    cta: string;
  }>;
  trustArtifacts?: string[];
  journeyKey: 'evaluate' | 'prove' | 'operate' | 'govern';
};

const appBase = brand.seo.appUrl.replace(/\/$/, '');

const TRUST_ARTIFACTS = [
  'Framework-aligned controls',
  'Immutable audit trails',
  'Role-based access governance',
  'Defensible evidence chains',
];

export function OutcomeJourneyPage({
  badge,
  title,
  description,
  proofLabel,
  proofValue,
  proofNote,
  workflow,
  outcomes,
  pillarsEyebrow,
  pillarsTitle,
  pillarsDescription,
  pillars,
  trustArtifacts,
  journeyKey,
}: JourneyPageProps) {
  const resolvedTrustArtifacts = trustArtifacts ?? TRUST_ARTIFACTS;

  return (
    <MarketingPageShell>
      {/* Hero */}
      <ImmersiveHero
        theme="outcome-journey"
        visualContent={<OutcomeJourneyHeroVisual journeyKey={journeyKey} />}
        badge={{
          icon: <Sparkles className="h-3.5 w-3.5" />,
          text: badge,
        }}
        headline={title}
        subheadline={description}
        extras={
          <Reveal variant="fadeInUp" delay={0.2}>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-6">
              <div className="text-xs uppercase tracking-wider text-slate-400">
                {proofLabel}
              </div>
              <div className="mt-2 text-3xl font-black text-cyan-300">
                {proofValue}
              </div>
              <p className="mt-2 text-sm text-slate-400">
                {proofNote ??
                  'Used by regulated teams that need clearer accountability, earlier risk visibility, and stronger review readiness.'}
              </p>
              <div className="mt-6 space-y-3">
                {workflow.map((step, idx) => (
                  <ScrollReveal
                    key={step}
                    variant="fadeLeft"
                    range={[idx * 0.04, 0.3 + idx * 0.04]}
                  >
                    <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-slate-950/40 px-3 py-2.5 text-sm text-slate-200">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-200">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </Reveal>
        }
        primaryCta={{
          href: `${appBase}/auth/signup?journey=${journeyKey}`,
          label: 'Start Free Trial',
        }}
        secondaryCta={{
          href: '/contact',
          label: 'Book Enterprise Demo',
        }}
      />

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>

      <DeferredSection minHeight={320}>
        <section className="mk-section relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal variant="fadeInUp">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
                {pillarsEyebrow}
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {pillarsTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-300 sm:text-base">
                {pillarsDescription}
              </p>
            </div>
          </Reveal>

          <SectionChoreography
            pattern="stagger-wave"
            className="mt-10 grid gap-4 lg:grid-cols-3"
          >
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 backdrop-blur-sm"
              >
                <h3 className="text-lg font-semibold text-white">
                  {pillar.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  {pillar.detail}
                </p>
                <a
                  href={pillar.href}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition-colors hover:text-white"
                >
                  {pillar.cta}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>
            ))}
          </SectionChoreography>
        </section>
      </DeferredSection>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3"><div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" /></div>

      {/* Outcomes Grid */}
      <DeferredSection minHeight={280}>
        <section className="mk-section relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionChoreography pattern="cascade" className="grid gap-4 md:grid-cols-2">
            {outcomes.map((outcome) => (
                <div key={outcome} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-5 transition-colors hover:border-cyan-500/15">
                  <div className="flex items-start gap-3">
                    <Target className="mt-0.5 h-5 w-5 text-cyan-300 flex-shrink-0" />
                    <p className="text-sm leading-relaxed text-slate-200">
                      {outcome}
                    </p>
                  </div>
                </div>
            ))}
          </SectionChoreography>

          <Reveal delay={0.2}>
            <div className="mt-10 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                Enterprise Trust Layer
              </div>
              <div className="flex flex-wrap gap-3">
                {resolvedTrustArtifacts.map((artifact) => (
                  <div
                    key={artifact}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-100"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {artifact}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </section>
      </DeferredSection>
    </MarketingPageShell>
  );
}
