import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Quote, ShieldCheck } from 'lucide-react';
import { brand } from '@/config/brand';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://formaos.com.au';
const appBase = brand.seo.appUrl.replace(/\/$/, '');

export const metadata: Metadata = {
  title: 'FormaOS | Use Case Scenarios',
  description:
    'Example scenarios showing how regulated operators use FormaOS to govern controls, evidence, and audit readiness.',
  alternates: {
    canonical: `${siteUrl}/customer-stories`,
  },
  openGraph: {
    title: 'FormaOS | Use Case Scenarios',
    description:
      'Example scenarios showing how regulated operators use FormaOS to govern controls, evidence, and audit readiness.',
    type: 'website',
    url: `${siteUrl}/customer-stories`,
  },
};

const stories = [
  {
    title: 'National disability services provider',
    situation:
      'Rapid growth created fragmented evidence, unclear ownership, and high audit risk across multiple sites.',
    outcome: [
      'Centralized evidence vault with verification flow',
      'Clear control ownership and task accountability',
      'Faster audit response with exportable bundles',
    ],
    quote:
      'We stopped chasing evidence in folders. FormaOS made accountability explicit and defensible.',
  },
  {
    title: 'Regional healthcare operator',
    situation:
      'Operational controls existed, but proof was inconsistent. Leadership lacked a single readiness view.',
    outcome: [
      'Control-to-evidence mapping with audit history',
      'Executive posture view aligned to frameworks',
      'Operational workflows tied to compliance requirements',
    ],
    quote:
      'We finally had one place to prove what happened, when it happened, and who approved it.',
  },
  {
    title: 'Multi-site aged care organization',
    situation:
      'Policy changes were hard to roll out, and periodic reviews slipped without reliable triggers.',
    outcome: [
      'Policy review cadence enforced with tasks',
      'Evidence renewal and expiry tracking',
      'Audit trail for changes and approvals',
    ],
    quote:
      'The system makes compliance routine. We can focus on operations and still be audit-ready.',
  },
] as const;

export default function CustomerStoriesPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0f1c] text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_45%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.10),_transparent_42%)]" />

      <section className="relative mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 lg:px-8 lg:pb-16 lg:pt-36">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cyan-100">
          <ShieldCheck className="h-4 w-4" />
          Proof in Practice
        </div>
        <h1 className="mt-6 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
          Use case scenarios from regulated industries
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
          These examples are anonymized by default. If you’re evaluating FormaOS
          for procurement, we can share deeper walkthroughs under NDA.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Request a Guided Demo
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`${appBase}/auth/signup?source=customer_stories`}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            Start Free Trial
          </Link>
        </div>
      </section>

      <section className="relative mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          {stories.map((s) => (
            <article
              key={s.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-6"
            >
              <h2 className="text-lg font-semibold text-white">{s.title}</h2>
              <div className="mt-3 text-sm leading-relaxed text-slate-300">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Situation
                </div>
                <p className="mt-2">{s.situation}</p>
              </div>

              <div className="mt-5">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Outcomes
                </div>
                <ul className="mt-2 space-y-2 text-sm text-slate-300">
                  {s.outcome.map((o) => (
                    <li key={o} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-300" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex rounded-lg border border-cyan-400/20 bg-cyan-500/10 p-2">
                    <Quote className="h-4 w-4 text-cyan-200" />
                  </div>
                  <p className="text-sm leading-relaxed text-slate-200">
                    {s.quote}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-white/10 bg-gradient-to-br from-white/7 via-white/4 to-transparent p-7 lg:p-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Want a buyer-ready proof walkthrough?
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
                We can walk your team through security, posture reporting, and
                evidence defensibility using your evaluation criteria.
              </p>
            </div>
            <Link
              href="/security-review"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Security Review Packet
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

