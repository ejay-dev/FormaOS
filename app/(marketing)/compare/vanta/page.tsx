import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { brand } from '@/config/brand';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';
const appBase = brand.seo.appUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'FormaOS | Compare: Vanta',
  description:
    'FormaOS vs Vanta: operational compliance execution with defensible evidence workflows and audit-ready governance.',
  alternates: {
    canonical: `${siteUrl}/compare/vanta`,
  },
};

const points = [
  {
    title: 'Execution-first operating system',
    detail:
      'FormaOS is designed to run compliance as work: controls become tasks, owners, deadlines, and evidence requirements.',
  },
  {
    title: 'Evidence defensibility workflows',
    detail:
      'Verification status, audit history, and chain-of-custody context reduce reviewer ambiguity and improve audit response.',
  },
  {
    title: 'Built for regulated operators',
    detail:
      'Beyond security teams: FormaOS supports operational compliance patterns across healthcare, disability services, and multi-site environments.',
  },
] as const;

const idealIf = [
  'You need workflows that enforce accountability across teams',
  'Evidence should be verified and defensible, not only collected',
  'You want posture reporting that maps to operational reality',
] as const;

const procurementChecks = [
  {
    title: 'Security review acceleration',
    detail:
      'Use the FormaOS security review packet to address architecture and control questions early.',
  },
  {
    title: 'Defensible workflow proof',
    detail:
      'Demonstrate owner-level execution with tasks, approvals, and evidence history in one chain.',
  },
  {
    title: 'Pilot-to-rollout confidence',
    detail:
      'Start with one business unit, validate outcomes, then scale to broader teams and entities.',
  },
] as const;

export default function CompareVantaPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f1c] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.10),_transparent_42%)]" />

      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 lg:px-8 lg:pb-16 lg:pt-36">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-100">
            <Sparkles className="h-4 w-4" />
            Comparison
          </span>
          <Link
            href="/compare"
            className="text-xs font-semibold text-slate-400 hover:text-white"
          >
            Back to Compare
          </Link>
        </div>

        <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
          FormaOS vs Vanta
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
          Vanta is widely used for compliance automation. FormaOS is built to
          operationalize compliance as an execution system with evidence
          defensibility at the workflow level.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Request Buyer Walkthrough
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`${appBase}/auth/signup?source=compare_vanta`}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {points.map((p) => (
            <article
              key={p.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <div className="mb-4 inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
                <ShieldCheck className="h-5 w-5 text-cyan-200" />
              </div>
              <h2 className="text-lg font-semibold text-white">{p.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                {p.detail}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-7">
          <h2 className="text-lg font-semibold text-white">
            Procurement Evaluation Focus
          </h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {procurementChecks.map((check) => (
              <article
                key={check.title}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-200">
                  {check.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">
                  {check.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/7 via-white/4 to-transparent p-7 lg:p-10">
          <h3 className="text-lg font-semibold text-white">FormaOS is ideal if</h3>
          <ul className="mt-4 space-y-2 text-sm text-slate-300">
            {idealIf.map((i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                <span>{i}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/security-review"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Security Review Packet
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/frameworks"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Framework Coverage
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-6 text-xs text-slate-500">
            This page is an evaluation aid, not a claim of feature parity.
          </p>
        </div>
      </section>
    </div>
  );
}
