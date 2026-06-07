'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import dynamic from 'next/dynamic';

const ComplianceNetworkViz = dynamic(
  () => import('@/components/motion/ComplianceNetworkViz'),
  { ssr: false, loading: () => null },
);

const legendItems = [
  {
    label: 'Frameworks',
    count: '5 supported',
    status: 'Active',
  },
  {
    label: 'Controls',
    count: '6 mapped',
    status: 'Enforced',
  },
  {
    label: 'Evidence',
    count: '4 types',
    status: 'Verified',
  },
  {
    label: 'Tasks',
    count: '3 workflows',
    status: 'Running',
  },
];

// Mobile-native form of the node graph: the same Frameworks → Controls →
// Tasks → Evidence dependency chain as a vertical trace. The SVG galaxy is
// unreadable on a phone (and renders blank under prefers-reduced-motion).
const lifecycleStages = [
  {
    label: 'Frameworks',
    count: '5 supported',
    detail: 'The obligations from every standard you adopt.',
  },
  {
    label: 'Controls',
    count: '6 mapped',
    detail: 'Each framework maps to the controls that enforce it.',
  },
  {
    label: 'Tasks',
    count: '3 workflows',
    detail: 'Controls generate owned, scheduled work.',
  },
  {
    label: 'Evidence',
    count: '4 types',
    detail: 'Tasks produce verifiable, audit-ready evidence.',
  },
];

export function ComplianceNetworkSection() {
  return (
    <section className="mk-section home-section home-section--network relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Editorial header, asymmetric, left-aligned. A labelled rule and a
            paired description column replace the centred eyebrow-pill template. */}
        <ScrollReveal variant="blurIn" range={[0, 0.3]} className="mb-10 lg:mb-16">
          <div className="grid gap-x-10 gap-y-6 border-b border-white/[0.06] pb-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              {/* Eyebrow as a relationship chain, previews the graph below and
                  differentiates this header from the labelled-rule used by the
                  sections above it. */}
              <div className="mb-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                <span>Frameworks</span>
                <span className="text-slate-500">&rarr;</span>
                <span>Controls</span>
                <span className="text-slate-500">&rarr;</span>
                <span>Tasks</span>
                <span className="text-slate-500">&rarr;</span>
                <span className="text-slate-300">Evidence</span>
              </div>
              <h2 className="font-display text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl md:text-[2.75rem]">
                See how everything connects
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
                Frameworks map to controls. Controls generate tasks. Tasks produce
                evidence. Tap or hover any node to trace its compliance
                relationships.
              </p>
            </div>
          </div>

          {/* Legend row - enhanced with live status pulse (mobile uses the
              vertical lifecycle trace below instead, so hide it < sm) */}
          <div className="mt-8 hidden flex-wrap items-center gap-2.5 sm:flex sm:gap-4 lg:gap-5">
            {legendItems.map((item) => (
              <div
                key={item.label}
                className="group flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 transition-colors hover:border-white/20 sm:gap-3 sm:px-4 sm:py-3"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                <div className="text-left">
                  <div className="text-xs font-semibold text-white sm:text-sm sm:font-medium">
                    {item.label}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span>{item.count}</span>
                    <span className="text-[8px] text-slate-500">•</span>
                    <span className="text-slate-400">{item.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Full-width canvas - upgraded container */}
        <ScrollReveal variant="fadeUp" range={[0, 0.35]}>
          {/* Mobile: the dependency chain as a vertical trace (the SVG galaxy
              is unreadable on a phone and renders blank under reduced motion) */}
          <ol className="relative sm:hidden">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-6 left-[0.9375rem] top-6 w-px bg-white/[0.1]"
            />
            {lifecycleStages.map((stage, i) => (
              <li key={stage.label} className="relative flex gap-4 pb-5 last:pb-0">
                <span className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.12] bg-slate-950 font-mono text-[11px] font-semibold text-slate-300">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold text-white">
                      {stage.label}
                    </span>
                    <span className="text-[11px] tabular-nums text-slate-400">
                      {stage.count}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] leading-snug text-slate-400">
                    {stage.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="relative hidden min-h-[280px] overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] aspect-[3/2] sm:block sm:min-h-[500px] sm:aspect-[16/11] lg:min-h-0 lg:aspect-[16/7]">
            {/* Dot grid with center-focused mask */}
            <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_center,rgba(148,163,184,0.3)_1px,transparent_1.2px)] [background-size:28px_28px] [mask-image:radial-gradient(circle_at_center,black_25%,transparent_85%)]" />

            {/* Desktop overlay cards */}
            <div className="pointer-events-none absolute inset-x-4 top-4 z-20 hidden lg:flex items-start justify-between gap-3">
              <div className="max-w-[48%] rounded-xl border border-white/[0.08] bg-slate-950/70 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    Live Mapping
                  </p>
                </div>
                <p className="text-xs text-slate-400">
                  Framework obligations connected to active controls.
                </p>
              </div>
              <div className="max-w-[48%] rounded-xl border border-white/[0.08] bg-slate-950/70 px-4 py-3 backdrop-blur-md text-right">
                <div className="flex items-center justify-end gap-2 mb-1.5">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    Audit Readiness
                  </p>
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                </div>
                <p className="text-xs text-slate-400">
                  Task and evidence chains remain continuously verifiable.
                </p>
              </div>
            </div>

            {/* Bottom status bar */}
            <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 hidden lg:flex items-center justify-between">
              <div className="flex items-center gap-3 rounded-lg bg-slate-950/60 px-3 py-1.5 backdrop-blur-md border border-white/[0.08]">
                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  Nodes
                </span>
                <span className="text-xs font-mono text-slate-300">18</span>
                <span className="h-3 w-px bg-slate-700" />
                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  Edges
                </span>
                <span className="text-xs font-mono text-slate-300">22</span>
                <span className="h-3 w-px bg-slate-700" />
                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  Coverage
                </span>
                <span className="text-xs font-mono text-slate-300">100%</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-950/60 px-3 py-1.5 backdrop-blur-md border border-white/[0.08]">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400">
                  All Systems Nominal
                </span>
              </div>
            </div>

            <ComplianceNetworkViz className="absolute inset-0 z-10" />
          </div>

          <div className="mt-5 text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 text-xs text-slate-400 sm:text-sm">
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-slate-600" />
              Trace dependencies from{' '}
              <span className="text-slate-200">Frameworks</span> to{' '}
              <span className="text-slate-200">Controls</span> to{' '}
              <span className="text-slate-200">Evidence</span> to{' '}
              <span className="text-slate-200">Tasks</span>
              <span className="h-px w-6 bg-gradient-to-l from-transparent to-slate-600" />
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
