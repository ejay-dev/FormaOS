'use client';

import {
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { brand } from '@/config/brand';
import { Reveal, VisualDivider } from '@/components/motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { MarketingPageShell } from './shared/MarketingPageShell';
import { DeferredSection } from './shared';

type JourneyPageProps = {
  badge: string;
  title: string;
  description: string;
  proofLabel: string;
  proofValue: string;
  workflow: string[];
  outcomes: string[];
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
  workflow,
  outcomes,
  journeyKey,
}: JourneyPageProps) {
  return (
    <MarketingPageShell>
      {/* Hero */}
      <ImmersiveHero
        theme="outcome-journey"
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
                Benchmarked from live compliance workflows in regulated
                environments.
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
          label: 'Start Guided Activation',
        }}
        secondaryCta={{
          href: '/contact',
          label: 'Request Enterprise Demo',
        }}
      />

      <VisualDivider />

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
                {TRUST_ARTIFACTS.map((artifact) => (
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
