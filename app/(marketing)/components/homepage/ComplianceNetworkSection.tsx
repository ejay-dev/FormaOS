'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import dynamic from 'next/dynamic';

const ComplianceNetworkViz = dynamic(
  () => import('@/components/motion/ComplianceNetworkViz'),
  { ssr: false, loading: () => null },
);

const legendItems = [
  {
    color: 'bg-teal-400',
    glow: 'shadow-teal-400/40',
    label: 'Frameworks',
    count: '5 supported',
    status: 'Active',
  },
  {
    color: 'bg-indigo-400',
    glow: 'shadow-indigo-400/40',
    label: 'Controls',
    count: '6 mapped',
    status: 'Enforced',
  },
  {
    color: 'bg-emerald-400',
    glow: 'shadow-emerald-400/40',
    label: 'Evidence',
    count: '4 types',
    status: 'Verified',
  },
  {
    color: 'bg-amber-400',
    glow: 'shadow-amber-400/40',
    label: 'Tasks',
    count: '3 workflows',
    status: 'Running',
  },
];

export function ComplianceNetworkSection() {
  return (
    <section className="mk-section home-section home-section--network relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/10 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Centered header */}
        <ScrollReveal
          variant="blurIn"
          range={[0, 0.3]}
          className="mb-10 text-center lg:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-400" />
            </span>
            Compliance Data Model
          </div>

          <h2 className="mb-5 text-2xl font-bold sm:text-4xl lg:text-5xl">
            See How Everything
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
              {' '}
              Connects
            </span>
          </h2>

          <p className="mx-auto mb-7 max-w-2xl text-base leading-relaxed text-gray-400 sm:text-lg">
            Frameworks map to controls. Controls generate tasks. Tasks produce
            evidence. Tap or hover any node to trace its compliance
            relationships.
          </p>

          {/* Legend row — enhanced with live status pulse */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 lg:gap-5">
            {legendItems.map((item) => (
              <div
                key={item.label}
                className="home-panel home-panel--soft group flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-slate-950/50 px-3 py-2.5 backdrop-blur-sm transition-colors hover:border-white/[0.12] sm:gap-3 sm:px-4 sm:py-3"
              >
                <div className="relative">
                  <div
                    className={`h-3 w-3 rounded-full ${item.color} ${item.glow} shadow-[0_0_8px]`}
                  />
                  <div
                    className={`absolute inset-0 h-3 w-3 rounded-full ${item.color} animate-ping opacity-30`}
                  />
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-white sm:text-sm sm:font-medium">
                    {item.label}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                    <span>{item.count}</span>
                    <span className="text-[8px] text-gray-600">•</span>
                    <span className="text-teal-400/70">{item.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Full-width canvas — upgraded container */}
        <ScrollReveal variant="fadeUp" range={[0, 0.35]}>
          {/* Mobile info cards */}
          <div className="mb-4 grid gap-2 sm:hidden">
            <div className="home-panel home-panel--soft rounded-xl border border-teal-400/15 bg-slate-950/60 px-4 py-3 text-left backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-400" />
                </span>
                <p className="text-[10px] uppercase tracking-[0.18em] text-teal-300/80">
                  Live Mapping
                </p>
              </div>
              <p className="mt-1.5 text-xs text-slate-300">
                Framework obligations connected to active controls.
              </p>
            </div>
            <div className="home-panel home-panel--soft rounded-xl border border-indigo-400/20 bg-slate-950/60 px-4 py-3 text-left backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
                </span>
                <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-300/80">
                  Audit Readiness
                </p>
              </div>
              <p className="mt-1.5 text-xs text-slate-300">
                Task and evidence chains remain continuously verifiable.
              </p>
            </div>
          </div>

          <div className="home-panel home-panel--strong relative min-h-[280px] overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-gray-950/90 via-[#060c1e] to-[#040810] shadow-2xl shadow-black/40 ring-1 ring-white/[0.03] aspect-[3/2] sm:min-h-[500px] sm:aspect-[16/11] lg:min-h-0 lg:aspect-[16/7]">
            {/* Multi-layer radial glows */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(20,184,166,0.12),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.10),transparent_42%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_75%,rgba(52,211,153,0.08),transparent_48%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_85%,rgba(99,102,241,0.06),transparent_45%)]" />

            {/* Dot grid with center-focused mask */}
            <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_center,rgba(148,163,184,0.3)_1px,transparent_1.2px)] [background-size:28px_28px] [mask-image:radial-gradient(circle_at_center,black_25%,transparent_85%)]" />

            {/* Corner glows */}
            <div className="absolute top-0 left-0 w-48 h-48 bg-gradient-to-br from-teal-500/8 to-transparent rounded-br-full" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-gradient-to-tl from-emerald-500/6 to-transparent rounded-tl-full" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/5 to-transparent rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-500/4 to-transparent rounded-tr-full" />

            {/* Edge glow lines */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-400/15 to-transparent" />
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-teal-400/10 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent" />

            {/* Desktop overlay cards */}
            <div className="pointer-events-none absolute inset-x-4 top-4 z-20 hidden lg:flex items-start justify-between gap-3">
              <div className="home-panel home-panel--soft max-w-[48%] rounded-xl border border-teal-400/12 bg-slate-950/70 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-400" />
                  </span>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-teal-300/80">
                    Live Mapping
                  </p>
                </div>
                <p className="text-xs text-slate-300/80">
                  Framework obligations connected to active controls.
                </p>
              </div>
              <div className="home-panel home-panel--soft max-w-[48%] rounded-xl border border-indigo-400/15 bg-slate-950/70 px-4 py-3 backdrop-blur-md text-right">
                <div className="flex items-center justify-end gap-2 mb-1.5">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-300/80">
                    Audit Readiness
                  </p>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  </span>
                </div>
                <p className="text-xs text-slate-300/80">
                  Task and evidence chains remain continuously verifiable.
                </p>
              </div>
            </div>

            {/* Bottom status bar */}
            <div className="pointer-events-none absolute inset-x-4 bottom-4 z-20 hidden lg:flex items-center justify-between">
              <div className="flex items-center gap-3 rounded-lg bg-slate-950/60 px-3 py-1.5 backdrop-blur-md border border-white/[0.04]">
                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  Nodes
                </span>
                <span className="text-xs font-mono text-teal-300/80">18</span>
                <span className="h-3 w-px bg-slate-700" />
                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  Edges
                </span>
                <span className="text-xs font-mono text-indigo-300/80">22</span>
                <span className="h-3 w-px bg-slate-700" />
                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  Coverage
                </span>
                <span className="text-xs font-mono text-emerald-300/80">
                  100%
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-950/60 px-3 py-1.5 backdrop-blur-md border border-white/[0.04]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[10px] uppercase tracking-[0.14em] text-emerald-400/80">
                  All Systems Nominal
                </span>
              </div>
            </div>

            <ComplianceNetworkViz className="absolute inset-0 z-10" />
          </div>

          <div className="mt-5 text-center">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/50 px-4 py-2 text-xs text-slate-400 backdrop-blur-sm sm:text-sm">
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-slate-600" />
              Trace dependencies from{' '}
              <span className="text-teal-300">Frameworks</span> to{' '}
              <span className="text-indigo-300">Controls</span> to{' '}
              <span className="text-emerald-300">Evidence</span> to{' '}
              <span className="text-amber-300">Tasks</span>
              <span className="h-px w-6 bg-gradient-to-l from-transparent to-slate-600" />
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
