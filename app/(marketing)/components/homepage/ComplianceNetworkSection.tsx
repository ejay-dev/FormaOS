'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import dynamic from 'next/dynamic';

const ComplianceNetworkViz = dynamic(
  () => import('@/components/motion/ComplianceNetworkViz'),
  { ssr: false, loading: () => null },
);

const legendItems = [
  { label: 'Frameworks', count: '5 supported' },
  { label: 'Controls', count: '6 mapped' },
  { label: 'Evidence', count: '4 types' },
  { label: 'Tasks', count: '3 workflows' },
];

export function ComplianceNetworkSection() {
  return (
    <section className="mk-section relative">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal variant="fadeUp" className="mb-12 text-center">
          <span className="mk-badge mk-badge--section mb-6">
            Compliance Data Model
          </span>

          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            See How Everything <span className="text-teal-400">Connects</span>
          </h2>

          <p className="mx-auto max-w-2xl text-base md:text-lg leading-relaxed text-slate-400">
            Frameworks map to controls. Controls generate tasks. Tasks produce
            evidence. Tap or hover any node to trace its compliance
            relationships.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
            {legendItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 text-sm text-slate-400"
              >
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                <span className="font-medium text-white">{item.label}</span>
                <span className="text-slate-500">{item.count}</span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp">
          <div className="relative rounded-2xl border border-white/[0.06] bg-slate-900/50 overflow-hidden aspect-[3/2] sm:aspect-[16/11] lg:aspect-[16/7]">
            <ComplianceNetworkViz className="absolute inset-0" />
          </div>

          <p className="mt-4 text-center text-sm text-slate-500">
            Trace dependencies from Frameworks to Controls to Evidence to Tasks
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
