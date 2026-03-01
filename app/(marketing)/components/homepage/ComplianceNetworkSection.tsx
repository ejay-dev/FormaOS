'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import dynamic from 'next/dynamic';

const ComplianceNetworkViz = dynamic(
  () => import('@/components/motion/ComplianceNetworkViz'),
  { ssr: false, loading: () => null },
);

const legendItems = [
  { color: 'bg-teal-400', label: 'Frameworks', count: '5 supported' },
  { color: 'bg-indigo-400', label: 'Controls', count: '6 mapped' },
  { color: 'bg-emerald-400', label: 'Evidence', count: '4 types' },
  { color: 'bg-amber-400', label: 'Tasks', count: '3 workflows' },
];

export function ComplianceNetworkSection() {
  return (
    <section className="mk-section home-section home-section--network relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/10 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Centered header */}
        <ScrollReveal variant="blurIn" range={[0, 0.3]} className="text-center mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            Compliance Data Model
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
            See How Everything
            <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-500 bg-clip-text text-transparent">
              {' '}Connects
            </span>
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Frameworks map to controls. Controls generate tasks. Tasks produce evidence.
            Hover over any node to trace its compliance relationships.
          </p>

          {/* Legend row */}
          <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6">
            {legendItems.map((item) => (
              <div
                key={item.label}
                className="home-panel home-panel--soft flex items-center gap-3 px-4 py-2.5 rounded-xl"
              >
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <div className="text-left">
                  <div className="text-sm font-medium text-white">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.count}</div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Full-width canvas */}
        <ScrollReveal variant="fadeUp" range={[0, 0.35]}>
          <div className="home-panel home-panel--strong relative aspect-[5/4] lg:aspect-[16/7] rounded-2xl border border-white/[0.08] bg-gradient-to-br from-gray-950/80 via-[#070d1f] to-[#050812] overflow-hidden shadow-2xl shadow-black/30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(20,184,166,0.16),transparent_58%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(56,189,248,0.14),transparent_45%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_70%,rgba(52,211,153,0.12),transparent_52%)]" />
            <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_center,rgba(148,163,184,0.25)_1px,transparent_1.2px)] [background-size:28px_28px] [mask-image:radial-gradient(circle_at_center,black_35%,transparent_92%)]" />

            {/* Corner glows */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-teal-500/10 to-transparent rounded-br-full" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-emerald-500/8 to-transparent rounded-tl-full" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full" />
            <div className="absolute left-[12%] top-[24%] hidden lg:block h-44 w-44 rounded-full border border-cyan-400/25 bg-cyan-400/[0.03]">
              <div className="absolute inset-6 rounded-full border border-cyan-300/20" />
              <div className="absolute inset-14 rounded-full border border-cyan-200/15" />
              <div className="absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.8)]" />
            </div>
            <div className="absolute right-[10%] bottom-[16%] hidden lg:block h-40 w-40 rounded-full border border-emerald-400/20 bg-emerald-400/[0.03]">
              <div className="absolute inset-7 rounded-full border border-emerald-300/20" />
              <div className="absolute inset-14 rounded-full border border-emerald-200/15" />
              <div className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]" />
            </div>

            <div className="pointer-events-none absolute left-6 top-1/2 hidden -translate-y-1/2 xl:block">
              <div className="home-panel home-panel--soft w-60 rounded-2xl border border-cyan-400/20 bg-slate-950/75 p-4 backdrop-blur-md">
                <div className="text-[11px] uppercase tracking-[0.18em] text-cyan-300/70">Control Plane</div>
                <div className="mt-2 text-sm font-semibold text-white">Mapping Coverage</div>
                <div className="mt-4 h-2 rounded-full bg-white/10">
                  <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-cyan-400 to-teal-300" />
                </div>
                <div className="mt-2 text-xs text-cyan-200/80">82% of controls linked to live evidence</div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-slate-300">24 frameworks</div>
                  <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-2 text-slate-300">176 controls</div>
                </div>
              </div>
            </div>

            <div className="pointer-events-none absolute right-6 top-1/2 hidden -translate-y-1/2 xl:block">
              <div className="home-panel home-panel--soft w-60 rounded-2xl border border-emerald-400/20 bg-slate-950/75 p-4 backdrop-blur-md">
                <div className="text-[11px] uppercase tracking-[0.18em] text-emerald-300/70">Execution Loop</div>
                <div className="mt-2 text-sm font-semibold text-white">Evidence Throughput</div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Collection</span>
                    <span className="text-emerald-300">99.4%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Verification</span>
                    <span className="text-cyan-300">96.8%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span>Delivery</span>
                    <span className="text-teal-300">94 sec</span>
                  </div>
                </div>
                <div className="mt-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <p className="mt-3 text-xs leading-relaxed text-slate-400">
                  Every node in the graph is tied to a governable action, owner, and exportable audit artifact.
                </p>
              </div>
            </div>

            <ComplianceNetworkViz className="absolute inset-0 z-10" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
