import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, FileLock2, CheckCircle2, ArrowRight } from 'lucide-react';
import { brand } from '@/config/brand';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';
const appBase = brand.seo.appUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'FormaOS | Trust Center',
  description:
    'Customer-facing assurance portal for compliance posture, security controls, and audit readiness artifacts.',
  alternates: {
    canonical: `${siteUrl}/trust`,
  },
};

const assuranceModules = [
  {
    title: 'Live compliance posture',
    detail:
      'Share framework-level posture snapshots with auditors and enterprise buyers.',
  },
  {
    title: 'Security questionnaire acceleration',
    detail:
      'Respond to due-diligence requests using reusable control-and-evidence mappings.',
  },
  {
    title: 'Controlled document access',
    detail:
      'Grant time-bound access to policies, controls, and certification artifacts.',
  },
];

const trustSignals = [
  'Immutable audit history',
  'Framework-mapped controls',
  'Role-based access governance',
  'Evidence chain integrity',
];

export default function TrustCenterPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f1c] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.14),_transparent_40%)]" />

      <section className="relative mx-auto max-w-7xl px-4 pb-16 pt-28 sm:px-6 lg:px-8 lg:pb-24 lg:pt-36">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-100">
          <ShieldCheck className="h-4 w-4" />
          Trust-as-Revenue
        </div>

        <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
          Enterprise Trust Center for Faster Security Review Cycles
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
          FormaOS gives customers and auditors controlled visibility into live
          compliance posture, evidence integrity, and security governance
          artifacts.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={`${appBase}/auth/signup?source=trust_center`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Start Trust-Ready Trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Request Security Review Walkthrough
          </Link>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <Link
            href="/security-review"
            className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/7"
          >
            <div className="mb-4 inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
              <ShieldCheck className="h-5 w-5 text-cyan-300" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Security Review Packet
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Procurement-ready walkthrough covering architecture, access
              controls, audit logging, and evidence defensibility.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
              Review packet
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
          <Link
            href="/frameworks"
            className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/7"
          >
            <div className="mb-4 inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
              <FileLock2 className="h-5 w-5 text-cyan-300" />
            </div>
            <h2 className="text-lg font-semibold text-white">
              Framework Coverage
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              See mapped framework packs and how controls become executable work
              with contextual evidence.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
              View coverage
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
          <Link
            href="/compare"
            className="group rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/7"
          >
            <div className="mb-4 inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
              <CheckCircle2 className="h-5 w-5 text-cyan-300" />
            </div>
            <h2 className="text-lg font-semibold text-white">Compare</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Compare FormaOS against popular compliance tools and evaluate the
              execution-first difference.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200">
              See comparisons
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>
      </section>

      <section className="relative mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:px-6 lg:grid-cols-3 lg:px-8 lg:pb-24">
        {assuranceModules.map((module) => (
          <article
            key={module.title}
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-4 inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
              <FileLock2 className="h-5 w-5 text-cyan-300" />
            </div>
            <h2 className="text-lg font-semibold text-white">{module.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              {module.detail}
            </p>
          </article>
        ))}
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-200">
            Assurance Signals
          </h3>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {trustSignals.map((signal) => (
              <span
                key={signal}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-100"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {signal}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
