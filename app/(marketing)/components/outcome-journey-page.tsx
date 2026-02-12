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
    <div className="relative overflow-hidden bg-[#0a0f1c] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(59,130,246,0.12),_transparent_40%)]" />

      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pb-24 lg:pt-36">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-200">
          <Sparkles className="h-3.5 w-3.5" />
          {badge}
        </div>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
              {description}
            </p>

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
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
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
                <div
                  key={step}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/40 px-3 py-2.5 text-sm text-slate-200"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-200">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
        <div className="grid gap-4 md:grid-cols-2">
          {outcomes.map((outcome) => (
            <div
              key={outcome}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-start gap-3">
                <Target className="mt-0.5 h-5 w-5 text-cyan-300" />
                <p className="text-sm leading-relaxed text-slate-200">
                  {outcome}
                </p>
              </div>
            </div>
          ))}
        </div>

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
      </section>
    </div>
  );
}
