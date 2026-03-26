import Link from 'next/link';
import { ArrowRight, ShieldCheck, Building2, FileCheck2 } from 'lucide-react';

const PROOF_BLOCKS = [
  {
    icon: FileCheck2,
    eyebrow: 'For Operators',
    title: 'Controls run as workflows, not as documents',
    body:
      'Named tasks, approval gates, and evidence chains execute inside daily operations — not in a separate compliance layer.',
    href: '/product',
    cta: 'See how it works',
  },
  {
    icon: Building2,
    eyebrow: 'For Enterprise Buyers',
    title: 'One evaluation flow from security review to rollout',
    body:
      'Identity controls, audit exports, hosting posture, and procurement artifacts stay in a single narrative buyers can verify.',
    href: '/enterprise',
    cta: 'See enterprise path',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'For Security Reviewers',
    title: 'Trust evidence is visible before the first call',
    body:
      'Trust documentation, evidence defensibility, and review-ready context surface early so reviewers can verify substance upfront.',
    href: '/trust',
    cta: 'Visit trust center',
  },
] as const;

export function HomeProofStaticShell() {
  return (
    <section className="relative z-10 border-y border-white/10 bg-slate-950 px-6 py-14 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="mk-eyebrow text-cyan-200">
            Why Buyers Stay
          </p>
          <h2 className="mk-heading-section mt-3 text-white">
            Three paths to conviction — visible before the first call
          </h2>
          <p className="mk-body-sm mt-4 max-w-2xl text-slate-300">
            Operators see accountable workflows. Security reviewers see
            defensible evidence. Procurement sees a structured evaluation path.
            Each audience gets substance without waiting for a demo.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {PROOF_BLOCKS.map((block) => (
            <article
              key={block.title}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
            >
              <div className="inline-flex rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-3">
                <block.icon className="h-5 w-5 text-cyan-200" aria-hidden="true" />
              </div>
              <p className="mk-eyebrow mt-4 text-slate-400">
                {block.eyebrow}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                {block.title}
              </h3>
              <p className="mk-body-sm mt-3 text-slate-300">
                {block.body}
              </p>
              <Link
                href={block.href}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 transition-colors hover:text-white"
              >
                {block.cta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
