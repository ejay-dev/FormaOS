import Link from 'next/link';
import { ArrowRight, ShieldCheck, Building2, FileCheck2 } from 'lucide-react';

/* Three audiences, one evaluation. No per-card colour identity: the palette
   stays monochrome so the copy carries it. Server-rendered, so the three
   entry paths are in the initial HTML. */

const PROOF_BLOCKS = [
  {
    icon: FileCheck2,
    audience: 'Operators',
    title: 'Controls run as workflows, not as documents',
    body: 'Named tasks, approval gates, and evidence chains execute inside daily operations, not in a separate compliance layer.',
    href: '/product',
    cta: 'See how it works',
  },
  {
    icon: Building2,
    audience: 'Enterprise buyers',
    title: 'One evaluation flow from security review to rollout',
    body: 'Identity controls, audit exports, hosting posture, and procurement artifacts stay in a single narrative buyers can verify.',
    href: '/enterprise',
    cta: 'See enterprise path',
  },
  {
    icon: ShieldCheck,
    audience: 'Security reviewers',
    title: 'Trust evidence is visible before the first call',
    body: 'Trust documentation, evidence defensibility, and review-ready context surface early so reviewers can verify substance upfront.',
    href: '/trust',
    cta: 'Visit trust centre',
  },
] as const;

function ConvictionCard({
  block,
}: {
  block: (typeof PROOF_BLOCKS)[number];
}) {
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-white/[0.08] bg-white/[0.02] p-7 transition-colors duration-300 hover:border-white/20 sm:p-8">
      <div className="inline-flex w-fit rounded-xl border border-white/10 bg-white/[0.05] p-3">
        <block.icon className="h-5 w-5 text-zinc-300" aria-hidden="true" />
      </div>

      <p className="mt-6 text-sm font-medium text-zinc-300">{block.audience}</p>
      <h3 className="mt-2 text-lg font-semibold leading-snug text-white">
        {block.title}
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-zinc-400">{block.body}</p>

      <Link
        href={block.href}
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white"
      >
        {block.cta}
        <ArrowRight
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </article>
  );
}

export function HomeProofStaticShell() {
  return (
    <section className="relative z-10 overflow-hidden bg-marketing-bg px-6 pt-20 pb-4 sm:px-8 sm:pt-24 sm:pb-6 lg:px-12 lg:pt-28 lg:pb-8">
      {/* Single hairline top seam, no rainbow edge glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Editorial header: headline left, the argument in a paired column,
            no label above it. */}
        <div className="mb-12 grid gap-x-10 gap-y-5 border-b border-white/[0.06] pb-10 lg:mb-14 lg:grid-cols-12 lg:items-end">
          <h2 className="font-display text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:col-span-7 lg:text-[2.6rem]">
            Three paths to conviction, visible before the first call
          </h2>
          <p className="max-w-md text-base leading-relaxed text-zinc-400 lg:col-span-5">
            Operators see accountable workflows. Security reviewers see
            defensible evidence. Procurement sees a structured evaluation path.
            Each audience gets substance without waiting for a demo.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {PROOF_BLOCKS.map((block) => (
            <ConvictionCard key={block.title} block={block} />
          ))}
        </div>
      </div>
    </section>
  );
}
