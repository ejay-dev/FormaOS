import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { brand } from '@/config/brand';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';
const appBase = brand.seo.appUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'FormaOS | Compare: Secureframe',
  description:
    'FormaOS vs Secureframe: compliance program setup plus operational execution with evidence verification and audit-ready governance.',
  alternates: {
    canonical: `${siteUrl}/compare/secureframe`,
  },
};

const points = [
  {
    title: 'Compliance as an operating model',
    detail:
      'FormaOS connects governance structure to the work that proves compliance: policies, tasks, evidence, and audit history in one chain.',
  },
  {
    title: 'Verification layer for evidence',
    detail:
      'FormaOS emphasizes verification status, segregation, and audit history so evidence is defensible, not just stored.',
  },
  {
    title: 'Execution visibility for leadership',
    detail:
      'FormaOS is built to communicate readiness as operational truth: owners, deadlines, gaps, and posture snapshots.',
  },
] as const;

const idealIf = [
  'Your audits depend on operations (not only security policy)',
  'You need verified evidence and approval history',
  'You want a single control execution view across teams',
] as const;

export default function CompareSecureframePage() {
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
          FormaOS vs Secureframe
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
          Secureframe helps teams organize compliance programs. FormaOS is built
          to operationalize compliance into governed workflows and verified
          evidence chains, designed for audit defense.
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
            href={`${appBase}/auth/signup?source=compare_secureframe`}
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

