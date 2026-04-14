'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { SectionChoreography } from '@/components/motion/SectionChoreography';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  FileCheck2,
  Globe,
  Lock,
  Quote,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';

/* ── Top buyer objections with concise answers ── */

const objectionCards = [
  {
    objection: '"How do we complete security review before sign-off?"',
    response:
      'FormaOS ships a security review packet with architecture overview, DPA, and vendor questionnaire material so your security team can start immediately.',
    icon: ShieldAlert,
    proof: 'Security packet included',
  },
  {
    objection: '"Where is our data stored?"',
    response:
      'AU-hosted by default. Additional residency requirements are reviewed during procurement with a Data Processing Agreement available for legal review.',
    icon: Globe,
    proof: 'Data sovereignty controls',
  },
  {
    objection: '"Can we get our data out if we leave?"',
    response:
      'Evidence, controls, audit trails, and framework mappings export in standard formats. Full data portability is guaranteed.',
    icon: Lock,
    proof: 'Full data portability',
  },
  {
    objection: '"Does it work across multiple sites?"',
    response:
      'Multi-entity and multi-site management is a core capability with centralized oversight and local accountability per site.',
    icon: Building2,
    proof: 'Multi-entity by design',
  },
] as const;

/* ── 3-step procurement flow ── */

const procurementSteps = [
  {
    step: '01',
    title: 'Start your trial',
    detail:
      'Full platform access for 14 days. Bring your security, compliance, and operations stakeholders in from day one.',
    icon: BadgeCheck,
  },
  {
    step: '02',
    title: 'Run security review in parallel',
    detail:
      'Use the security packet and trust center artifacts while teams validate workspace fit in trial.',
    icon: ShieldCheck,
  },
  {
    step: '03',
    title: 'Close with defensible proof',
    detail:
      'Present ownership trails, evidence chains, and readiness posture for approval without rework.',
    icon: FileCheck2,
  },
] as const;

const artifactBadges = [
  'Security review packet',
  'Trust center documents',
  'Framework mapping overview',
  'DPA & data residency docs',
  'Access & identity model',
  'Enterprise service terms',
] as const;

export function ObjectionHandlingSection() {
  return (
    <section className="mk-section home-section home-section--proof relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-400/10 to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        {/* Header */}
        <ScrollReveal
          variant="blurIn"
          range={[0, 0.3]}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
            <BadgeCheck className="h-3.5 w-3.5" />
            Enterprise Ready
          </div>
          <h2 className="text-2xl font-bold text-white sm:text-4xl">
            From evaluation to procurement — no blockers
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-400 sm:text-base">
            FormaOS ships with the trust artifacts, security documentation, and
            buyer-facing proof that enterprise procurement teams need on day one.
          </p>
        </ScrollReveal>

        {/* Objection cards - 2x2 grid */}
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {objectionCards.map((card, idx) => (
            <ScrollReveal
              key={card.objection}
              variant="clipUp"
              range={[idx * 0.03, 0.28 + idx * 0.03]}
            >
              <article className="group relative rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 hover:bg-white/[0.03] hover:border-violet-400/15 transition-all duration-300">
                <Quote className="w-6 h-6 text-white/[0.06] mb-3" />

                <p className="text-sm font-semibold text-white leading-snug mb-3">
                  {card.objection}
                </p>

                <p className="text-sm leading-relaxed text-slate-400 mb-4">
                  {card.response}
                </p>

                <div className="flex items-center gap-2">
                  <card.icon className="h-3.5 w-3.5 text-violet-400/50" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-violet-400/50 bg-violet-500/[0.06] border border-violet-400/10 rounded px-2 py-0.5">
                    {card.proof}
                  </span>
                </div>
              </article>
            </ScrollReveal>
          ))}
        </div>

        {/* Procurement 3-step flow */}
        <ScrollReveal variant="slideUp" range={[0.05, 0.35]} className="mt-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-5 text-center">
            Typical evaluation path
          </p>
          <SectionChoreography
            pattern="stagger-wave"
            stagger={0.1}
            className="grid gap-4 md:grid-cols-3"
          >
            {procurementSteps.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 hover:border-violet-400/15 hover:bg-white/[0.04] transition-all duration-300"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="inline-flex items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10 p-2.5">
                      <Icon className="w-5 h-5 text-violet-400" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400/60">
                      Step {item.step}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-400">
                    {item.detail}
                  </p>
                </div>
              );
            })}
          </SectionChoreography>
        </ScrollReveal>

        {/* Artifact badges */}
        <ScrollReveal variant="fadeUp" range={[0.05, 0.35]} className="mt-6">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/20 to-transparent" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Buyer-facing artifacts included from day one
            </p>
            <div className="flex flex-wrap gap-2">
              {artifactBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-violet-400/15 bg-violet-500/[0.06] px-3 py-1 text-xs text-violet-300"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* CTAs */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/trust"
            className="mk-btn mk-btn-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
          >
            Open Trust Center
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/security-review"
            className="mk-btn mk-btn-secondary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white"
          >
            Review Security Packet
          </Link>
        </div>
      </div>
    </section>
  );
}
