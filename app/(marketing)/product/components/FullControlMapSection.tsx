'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import dynamic from 'next/dynamic';

const FullControlMapViz = dynamic(
  () => import('@/components/motion/FullControlMapViz'),
  { ssr: false, loading: () => null },
);

const CONTROL_MAP_STATS = {
  frameworks: 7,
  controls: 147,
  crossEdges: 42,
};

const frameworkChips = [
  {
    id: 'iso',
    color: 'bg-teal-400',
    glow: 'shadow-teal-400/40',
    label: 'ISO 27001',
    count: 21,
  },
  {
    id: 'soc',
    color: 'bg-indigo-400',
    glow: 'shadow-indigo-400/40',
    label: 'SOC 2',
    count: 21,
  },
  {
    id: 'nist',
    color: 'bg-sky-400',
    glow: 'shadow-sky-400/40',
    label: 'NIST CSF',
    count: 21,
  },
  {
    id: 'hipaa',
    color: 'bg-pink-400',
    glow: 'shadow-pink-400/40',
    label: 'HIPAA',
    count: 20,
  },
  {
    id: 'gdpr',
    color: 'bg-violet-400',
    glow: 'shadow-violet-400/40',
    label: 'GDPR',
    count: 19,
  },
  {
    id: 'pci',
    color: 'bg-orange-400',
    glow: 'shadow-orange-400/40',
    label: 'PCI DSS',
    count: 19,
  },
  {
    id: 'cis',
    color: 'bg-emerald-400',
    glow: 'shadow-emerald-400/40',
    label: 'CIS Controls',
    count: 22,
  },
];

const statBlocks = [
  { label: 'Frameworks', value: '7', accent: 'text-teal-300/80' },
  { label: 'Controls', value: '147', accent: 'text-indigo-300/80' },
  { label: 'Cross-Links', value: '42', accent: 'text-sky-300/80' },
  { label: 'Coverage', value: '100%', accent: 'text-emerald-300/80' },
];

export function FullControlMapSection() {
  return (
    <section className="mk-section relative overflow-hidden py-24 lg:py-32">
      {/* Top edge glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/15 to-transparent" />

      {/* Ambient background halos */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(20,184,166,0.06),transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(99,102,241,0.04),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_70%,rgba(167,139,250,0.03),transparent_50%)]" />
      </div>

      <div className="relative z-10 max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <ScrollReveal
          variant="blurIn"
          range={[0, 0.3]}
          className="mb-12 text-center lg:mb-16"
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-7">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
            </span>
            Full Compliance Coverage Map
          </div>

          <h2 className="mb-5 text-2xl font-bold sm:text-3xl lg:text-5xl xl:text-6xl tracking-tight">
            Every Control.{' '}
            <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-400 bg-clip-text text-transparent">
              Every Framework.
            </span>
            <br className="hidden sm:block" />
            <span className="text-white/90"> One Living Map.</span>
          </h2>

          <p className="mx-auto mb-10 max-w-3xl text-base leading-relaxed text-gray-400 sm:text-lg lg:text-xl">
            147 controls across 7 enterprise frameworks - all interconnected,
            all continuously monitored, all audit-ready. Hover any node to trace
            its cross-framework compliance chain.
          </p>

          {/* Framework chips with live counts */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {frameworkChips.map((fw) => (
              <div
                key={fw.id}
                className="group flex items-center gap-2 rounded-xl border border-white/[0.06] bg-slate-950/60 px-3 py-2 backdrop-blur-sm transition-all hover:border-white/[0.14] hover:bg-slate-900/60 sm:px-4 sm:py-2.5"
              >
                <div className="relative">
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${fw.color} ${fw.glow} shadow-[0_0_6px]`}
                  />
                  <div
                    className={`absolute inset-0 h-2.5 w-2.5 rounded-full ${fw.color} animate-ping opacity-20`}
                  />
                </div>
                <span className="text-xs font-medium text-white/80 sm:text-sm">
                  {fw.label}
                </span>
                <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-gray-500 sm:text-xs">
                  {fw.count}
                </span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Canvas container - cinematic 16:9-ish ratio */}
        <ScrollReveal variant="fadeUp" range={[0, 0.35]}>
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-br from-gray-950/95 via-[#050a18] to-[#030710] shadow-2xl shadow-black/50 ring-1 ring-white/[0.03]">
            {/* Radial overlays */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(20,184,166,0.10),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.07),transparent_40%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_75%,rgba(99,102,241,0.05),transparent_45%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_90%,rgba(167,139,250,0.04),transparent_50%)]" />

            {/* Dot grid */}
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,rgba(148,163,184,0.25)_0.8px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(circle_at_center,black_20%,transparent_80%)]" />

            {/* Corner accents */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-teal-500/6 to-transparent rounded-br-full" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-indigo-500/5 to-transparent rounded-tl-full" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-sky-500/4 to-transparent rounded-bl-full" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-violet-500/3 to-transparent rounded-tr-full" />

            {/* Edge glow lines */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-indigo-400/15 to-transparent" />
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-teal-400/10 to-transparent" />
            <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-sky-400/8 to-transparent" />

            {/* Top HUD overlay cards (desktop) */}
            <div className="pointer-events-none absolute inset-x-5 top-5 z-20 hidden lg:flex items-start justify-between gap-4">
              <div className="max-w-[35%] rounded-xl border border-teal-400/12 bg-slate-950/75 px-5 py-3.5 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-400" />
                  </span>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-teal-300/80">
                    Full Coverage Map
                  </p>
                </div>
                <p className="text-xs text-slate-300/80 leading-relaxed">
                  All 147 controls mapped across 7 frameworks with cross-linked
                  compliance chains.
                </p>
              </div>
              <div className="max-w-[35%] rounded-xl border border-indigo-400/12 bg-slate-950/75 px-5 py-3.5 backdrop-blur-md text-right">
                <div className="flex items-center justify-end gap-2 mb-1.5">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-300/80">
                    Real-Time Sync
                  </p>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-400" />
                  </span>
                </div>
                <p className="text-xs text-slate-300/80 leading-relaxed">
                  Cross-framework intelligence automatically maps shared
                  obligations.
                </p>
              </div>
            </div>

            {/* Bottom HUD status bar (desktop) */}
            <div className="pointer-events-none absolute inset-x-5 bottom-5 z-20 hidden lg:flex items-center justify-between">
              <div className="flex items-center gap-3.5 rounded-lg bg-slate-950/70 px-4 py-2 backdrop-blur-md border border-white/[0.05]">
                {statBlocks.map((s, i) => (
                  <span key={s.label} className="flex items-center gap-2">
                    {i > 0 && <span className="h-3 w-px bg-slate-700/50" />}
                    <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                      {s.label}
                    </span>
                    <span className={`text-xs font-mono ${s.accent}`}>
                      {s.value}
                    </span>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2.5 rounded-lg bg-slate-950/70 px-4 py-2 backdrop-blur-md border border-white/[0.05]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[10px] uppercase tracking-[0.14em] text-emerald-400/80">
                  All Systems Nominal
                </span>
              </div>
            </div>

            {/* Mobile info cards */}
            <div className="relative z-20 grid gap-2 p-4 sm:hidden">
              <div className="rounded-xl border border-teal-400/12 bg-slate-950/70 px-4 py-3 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-400" />
                  </span>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-teal-300/80">
                    147 Controls Mapped
                  </p>
                </div>
                <p className="mt-1.5 text-xs text-slate-300">
                  Full coverage across all 7 compliance frameworks.
                </p>
              </div>
            </div>

            {/* Canvas - large aspect ratio */}
            <div className="relative aspect-[3/2] min-h-[280px] sm:aspect-[16/10] sm:min-h-[520px] lg:aspect-[16/9] lg:min-h-0 xl:aspect-[2/1]">
              <FullControlMapViz className="absolute inset-0 z-10" />
            </div>
          </div>

          {/* Footer caption */}
          <div className="mt-6 text-center">
            <p className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-slate-950/50 px-5 py-2.5 text-xs text-slate-400 backdrop-blur-sm sm:text-sm">
              <span className="h-px w-6 bg-gradient-to-r from-transparent to-slate-600" />
              Tap or hover any node to trace cross-framework compliance chains
              <span className="h-px w-6 bg-gradient-to-l from-transparent to-slate-600" />
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
