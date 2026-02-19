'use client';

import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { brand } from '@/config/brand';
import { Reveal, VisualDivider } from '@/components/motion';
import { easing, duration } from '@/config/motion';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
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
      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pb-24 lg:pt-36">
        <Reveal variant="fadeInUp">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            {badge}
          </div>
        </Reveal>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <Reveal variant="fadeInUp" delay={0.1}>
              <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                {title}
              </h1>
            </Reveal>
            <Reveal variant="fadeInUp" delay={0.2}>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
                {description}
              </p>
            </Reveal>

            <Reveal variant="fadeInUp" delay={0.3}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={`${appBase}/auth/signup?journey=${journeyKey}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(34,211,238,0.28)] transition hover:shadow-[0_0_34px_rgba(34,211,238,0.4)]"
                >
                  Start Guided Activation
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Request Enterprise Demo
                </Link>
              </div>
            </Reveal>
          </div>

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
        </div>
      </section>

      <VisualDivider />

      {/* Outcomes Grid */}
      <DeferredSection minHeight={280}>
        <section className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
          <div className="grid gap-4 md:grid-cols-2">
            {outcomes.map((outcome, i) => (
              <ScrollReveal
                key={outcome}
                variant="fadeUp"
                range={[i * 0.04, 0.3 + i * 0.04]}
              >
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-sm p-5 transition-colors hover:border-cyan-500/15">
                  <div className="flex items-start gap-3">
                    <Target className="mt-0.5 h-5 w-5 text-cyan-300 flex-shrink-0" />
                    <p className="text-sm leading-relaxed text-slate-200">
                      {outcome}
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

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
