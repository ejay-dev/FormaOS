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
          <div className="home-panel home-panel--strong relative aspect-[4/3] lg:aspect-[16/7] rounded-2xl border border-white/[0.08] bg-gradient-to-br from-gray-950/80 via-[#070d1f] to-[#050812] overflow-hidden shadow-2xl shadow-black/30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(20,184,166,0.16),transparent_58%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(56,189,248,0.14),transparent_45%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_70%,rgba(52,211,153,0.12),transparent_52%)]" />
            <div className="absolute inset-0 opacity-35 [background-image:radial-gradient(circle_at_center,rgba(148,163,184,0.25)_1px,transparent_1.2px)] [background-size:28px_28px] [mask-image:radial-gradient(circle_at_center,black_35%,transparent_92%)]" />

            {/* Corner glows */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-teal-500/10 to-transparent rounded-br-full" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-emerald-500/8 to-transparent rounded-tl-full" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full" />

            <div className="pointer-events-none absolute inset-x-4 top-4 z-20 hidden md:flex items-start justify-between gap-3">
              <div className="home-panel home-panel--soft max-w-[48%] rounded-xl border border-teal-400/15 bg-slate-950/60 px-4 py-2.5 backdrop-blur-md">
                <p className="text-[10px] uppercase tracking-[0.18em] text-teal-300/70">Live Mapping</p>
                <p className="mt-1 text-xs text-slate-300">Framework obligations connected to active controls.</p>
              </div>
              <div className="home-panel home-panel--soft max-w-[48%] rounded-xl border border-indigo-400/20 bg-slate-950/60 px-4 py-2.5 backdrop-blur-md text-right">
                <p className="text-[10px] uppercase tracking-[0.18em] text-indigo-300/70">Audit Readiness</p>
                <p className="mt-1 text-xs text-slate-300">Task and evidence chains remain continuously verifiable.</p>
              </div>
            </div>

            <ComplianceNetworkViz className="absolute inset-0 z-10" />
          </div>

          <div className="mt-5 text-center">
            <p className="text-sm text-slate-400">
              Trace dependencies from <span className="text-teal-300">Frameworks</span> to <span className="text-indigo-300">Controls</span> to <span className="text-emerald-300">Evidence</span> to <span className="text-amber-300">Tasks</span>.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
