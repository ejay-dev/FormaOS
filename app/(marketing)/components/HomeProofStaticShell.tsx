import Link from 'next/link';
import { ArrowRight, ShieldCheck, Building2, FileCheck2 } from 'lucide-react';

const PROOF_BLOCKS = [
  {
    icon: FileCheck2,
    eyebrow: 'Operational System',
    title: 'Controls become accountable execution, not passive documentation',
    body:
      'Turn control requirements into named tasks, approval checkpoints, and evidence chains that teams can run inside daily operations.',
    href: '/product',
    cta: 'Explore product workflow',
  },
  {
    icon: Building2,
    eyebrow: 'Enterprise Buying',
    title: 'Security review, procurement, and rollout stay in one narrative',
    body:
      'Show identity controls, audit-ready exports, hosting posture, and buyer-facing assurance without inventing a separate trust story by hand.',
    href: '/enterprise',
    cta: 'See enterprise path',
  },
  {
    icon: ShieldCheck,
    eyebrow: 'Trust Review',
    title: 'Buyer assurance is visible before the first sales call',
    body:
      'Surface trust documentation, evidence defensibility, and review-ready context early so serious buyers can verify substance before they book a demo.',
    href: '/trust',
    cta: 'Visit trust center',
  },
] as const;

export function HomeProofStaticShell() {
  return (
    <section className="relative z-10 border-y border-white/10 bg-slate-950 px-6 py-14 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200">
            Why Buyers Stay
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Product story, proof path, and trust path in the first scroll
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            FormaOS is strongest when operators, security reviewers, and
            procurement teams can each see how the platform works without
            waiting for a fully interactive demo.
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
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {block.eyebrow}
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white">
                {block.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
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
