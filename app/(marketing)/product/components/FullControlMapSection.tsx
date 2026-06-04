'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import { brand } from '@/config/brand';
import dynamic from 'next/dynamic';

const FullControlMapViz = dynamic(
  () => import('@/components/motion/FullControlMapViz'),
  { ssr: false, loading: () => null },
);

const CONTROL_MAP_STATS = {
  frameworks: brand.frameworks.count,
  controls: brand.frameworks.controlCount,
  crossEdges: 42,
};

const frameworkChips = [
  { id: 'iso', label: 'ISO 27001', count: 10 },
  { id: 'soc', label: 'SOC 2', count: 11 },
  { id: 'nist', label: 'NIST CSF', count: 10 },
  { id: 'hipaa', label: 'HIPAA', count: 10 },
  { id: 'gdpr', label: 'GDPR', count: 10 },
  { id: 'pci', label: 'PCI DSS', count: 10 },
  { id: 'cis', label: 'CIS Controls', count: 10 },
];

const statBlocks = [
  { label: 'Frameworks', value: String(brand.frameworks.count) },
  { label: 'Controls', value: `${brand.frameworks.controlCount}+` },
  { label: 'Cross-Links', value: '42' },
  { label: 'Coverage', value: '100%' },
];

export function FullControlMapSection() {
  return (
    <section className="mk-section relative overflow-hidden py-24 lg:py-32">
      {/* Single hairline top seam */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="relative z-10 max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Header */}
        <ScrollReveal
          variant="blurIn"
          range={[0, 0.3]}
          className="mb-12 text-center lg:mb-16"
        >
          <div className="mb-5 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-white/25" />
            <span className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Full Compliance Coverage Map
            </span>
            <span className="h-px w-8 bg-white/25" />
          </div>

          <h2 className="mb-5 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Every control. Every framework.{' '}
            <br className="hidden sm:block" />
            <span className="text-white/80">One living map.</span>
          </h2>

          <p className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-slate-400">
            70+ controls across 7 enterprise frameworks, all interconnected,
            continuously monitored, and audit-ready. Hover any node to trace its
            cross-framework compliance chain.
          </p>

          {/* Framework chips with live counts */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {frameworkChips.map((fw) => (
              <div
                key={fw.id}
                className="group flex items-center gap-2 rounded-xl border border-white/[0.06] bg-slate-950/60 px-3 py-2 transition-colors hover:border-white/[0.14] hover:bg-slate-900/60 sm:px-4 sm:py-2.5"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span className="text-xs font-medium text-white/80 sm:text-sm">
                  {fw.label}
                </span>
                <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] tabular-nums text-slate-500 sm:text-xs">
                  {fw.count}
                </span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Canvas container - cinematic 16:9-ish ratio */}
        <ScrollReveal variant="fadeUp" range={[0, 0.35]}>
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-slate-950">
            {/* Subtle graph substrate, masked dot grid */}
            <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_center,rgba(148,163,184,0.25)_0.8px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(circle_at_center,black_20%,transparent_80%)]" />

            {/* Coverage summary cards (desktop), static, no telemetry chrome */}
            <div className="pointer-events-none absolute inset-x-5 top-5 z-20 hidden lg:flex items-start justify-between gap-4">
              <div className="max-w-[35%] rounded-xl border border-white/[0.08] bg-slate-950/70 px-5 py-3.5">
                <p className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Full Coverage Map
                </p>
                <p className="text-xs text-slate-300/80 leading-relaxed">
                  All {brand.frameworks.controlCount}+ controls mapped across {brand.frameworks.count} frameworks with cross-linked
                  compliance chains.
                </p>
              </div>
              <div className="max-w-[35%] rounded-xl border border-white/[0.08] bg-slate-950/70 px-5 py-3.5 text-right">
                <p className="mb-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  Cross-Framework Mapping
                </p>
                <p className="text-xs text-slate-300/80 leading-relaxed">
                  Cross-framework intelligence automatically maps shared
                  obligations.
                </p>
              </div>
            </div>

            {/* Coverage stat row (desktop) */}
            <div className="pointer-events-none absolute inset-x-5 bottom-5 z-20 hidden lg:flex items-center">
              <div className="flex items-center gap-3.5 rounded-lg border border-white/[0.08] bg-slate-950/70 px-4 py-2">
                {statBlocks.map((s, i) => (
                  <span key={s.label} className="flex items-center gap-2">
                    {i > 0 && <span className="h-3 w-px bg-slate-700/50" />}
                    <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
                      {s.label}
                    </span>
                    <span className="text-xs tabular-nums text-slate-300">
                      {s.value}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* Mobile info card */}
            <div className="relative z-20 grid gap-2 p-4 sm:hidden">
              <div className="rounded-xl border border-white/[0.08] bg-slate-950/70 px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                  70+ Controls Mapped
                </p>
                <p className="mt-1.5 text-xs text-slate-300">
                  Full coverage across all 8 compliance framework packs.
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
