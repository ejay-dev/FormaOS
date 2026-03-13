'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';

const BEFORE = [
  'Point-in-time snapshots, not continuous posture',
  'Evidence reconstructed days before every audit',
  'Ownership assumed — never assigned or enforced',
  'No single source of truth when regulators ask',
  'Controls documented. Never enforced.',
] as const;

const AFTER = [
  'Real-time compliance posture — always current',
  'Immutable evidence generated as work happens',
  'Every control owned by a named person or team',
  'Framework-mapped audit packets in minutes',
  'Controls block non-compliance before it occurs',
] as const;

export function ValueProposition() {
  return (
    <section className="mk-section home-section home-section--contrast relative">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">

        {/* Editorial statement — left-aligned, large, no badge */}
        <ScrollReveal variant="fadeUp">
          <div className="mb-14 max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-600 mb-4">
              The architecture difference
            </p>
            <h2 className="text-3xl font-semibold leading-[1.15] tracking-[-0.02em] text-white sm:text-4xl">
              Most compliance tools help you{' '}
              <span className="text-slate-500">document.</span>
              <br />
              FormaOS{' '}
              <span className="text-teal-400">enforces.</span>
            </h2>
            <p className="mt-5 text-base leading-[1.75] text-slate-400 max-w-xl">
              The difference isn't features. It's architecture. FormaOS is an
              operating layer that runs your compliance program continuously —
              not a repository you update before audits.
            </p>
          </div>
        </ScrollReveal>

        {/* Comparison — two columns, no card wrapper */}
        <div className="grid md:grid-cols-2 gap-0.5 overflow-hidden rounded-2xl border border-white/[0.07]">

          {/* Before */}
          <ScrollReveal variant="fadeUp">
            <div className="bg-slate-900/40 px-7 py-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-rose-500/10 text-[11px] font-bold text-rose-400">
                  ✕
                </span>
                <p className="text-sm font-medium text-slate-400">
                  Other tools
                </p>
              </div>
              <ul className="space-y-3">
                {BEFORE.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-slate-500 leading-[1.6]"
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-700" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* After */}
          <ScrollReveal variant="fadeUp">
            <div className="bg-slate-900/60 border-l border-white/[0.07] px-7 py-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-teal-500/10 text-[11px] font-bold text-teal-400">
                  ✓
                </span>
                <p className="text-sm font-medium text-slate-200">
                  FormaOS
                </p>
              </div>
              <ul className="space-y-3">
                {AFTER.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-slate-300 leading-[1.6]"
                  >
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-teal-500/50" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
