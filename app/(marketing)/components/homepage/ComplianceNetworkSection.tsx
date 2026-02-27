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
          <div className="home-panel home-panel--strong relative aspect-[4/3] lg:aspect-[16/7] rounded-2xl border border-white/[0.08] bg-gradient-to-br from-gray-950/80 to-[#0a0e1a] overflow-hidden shadow-2xl shadow-black/30">
            {/* Corner glows */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-teal-500/10 to-transparent rounded-br-full" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-emerald-500/8 to-transparent rounded-tl-full" />
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/5 to-transparent rounded-bl-full" />

            <ComplianceNetworkViz className="absolute inset-0" />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
