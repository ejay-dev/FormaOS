'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import dynamic from 'next/dynamic';

const ComplianceNetworkViz = dynamic(
  () => import('@/components/motion/ComplianceNetworkViz'),
  { ssr: false, loading: () => null },
);

export function ComplianceNetworkSection() {
  return (
    <section className="mk-section relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Text content */}
          <ScrollReveal variant="fadeLeft" range={[0, 0.35]}>
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                Compliance Data Model
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                See How Everything
                <span className="bg-gradient-to-r from-cyan-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
                  {' '}Connects
                </span>
              </h2>

              <p className="text-lg text-gray-400 mb-6 leading-relaxed">
                Frameworks map to controls. Controls generate tasks. Tasks produce evidence.
                Hover over any node to trace its compliance relationships.
              </p>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { color: 'bg-cyan-400', label: 'Frameworks', count: '5 supported' },
                  { color: 'bg-indigo-400', label: 'Controls', count: '6 mapped' },
                  { color: 'bg-emerald-400', label: 'Evidence', count: '4 types' },
                  { color: 'bg-amber-400', label: 'Tasks', count: '3 workflows' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <div>
                      <div className="text-sm font-medium text-white">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.count}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Right: Interactive network viz */}
          <ScrollReveal variant="fadeRight" range={[0, 0.35]}>
            <div className="relative aspect-[4/3] rounded-2xl border border-white/[0.08] bg-gradient-to-br from-gray-950/80 to-[#0a0e1a] overflow-hidden shadow-2xl shadow-black/30">
              {/* Subtle corner glow */}
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-br-full" />
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-purple-500/10 to-transparent rounded-tl-full" />

              <ComplianceNetworkViz className="absolute inset-0" />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
