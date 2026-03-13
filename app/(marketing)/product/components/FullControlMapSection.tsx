'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import dynamic from 'next/dynamic';

const FullControlMapViz = dynamic(
  () => import('@/components/motion/FullControlMapViz'),
  { ssr: false, loading: () => null },
);

const frameworkChips = [
  { id: 'iso', label: 'ISO 27001', count: 10 },
  { id: 'soc', label: 'SOC 2', count: 11 },
  { id: 'nist', label: 'NIST CSF', count: 10 },
  { id: 'hipaa', label: 'HIPAA', count: 10 },
  { id: 'gdpr', label: 'GDPR', count: 10 },
  { id: 'pci', label: 'PCI DSS', count: 10 },
  { id: 'cis', label: 'CIS Controls', count: 10 },
];

export function FullControlMapSection() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-12">
        <ScrollReveal variant="fadeUp" className="mb-12 text-center lg:mb-16">
          <span className="mk-badge mk-badge--section mb-7">
            Full Compliance Coverage Map
          </span>

          <h2 className="mb-5 text-2xl font-bold text-white sm:text-3xl lg:text-5xl tracking-tight">
            Every control.{' '}
            <span className="text-teal-400">Every framework.</span>
            <br className="hidden sm:block" />
            One living map.
          </h2>

          <p className="mx-auto mb-10 max-w-3xl text-base leading-relaxed text-slate-400 sm:text-lg">
            70+ controls across 7 enterprise frameworks — all interconnected,
            all continuously monitored, all audit-ready. Hover any node to trace
            its cross-framework compliance chain.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {frameworkChips.map((fw) => (
              <div
                key={fw.id}
                className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-slate-900/50 px-3 py-2 sm:px-4 sm:py-2.5"
              >
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                <span className="text-xs font-medium text-white/80 sm:text-sm">
                  {fw.label}
                </span>
                <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-mono text-slate-500 sm:text-xs">
                  {fw.count}
                </span>
              </div>
            ))}
          </div>
        </ScrollReveal>

        <ScrollReveal variant="fadeUp">
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-slate-950">
            <div className="relative aspect-[3/2] min-h-[280px] sm:aspect-[16/10] sm:min-h-[520px] lg:aspect-[16/9] lg:min-h-0 xl:aspect-[2/1]">
              <FullControlMapViz className="absolute inset-0 z-10" />
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500 sm:text-sm">
            Tap or hover any node to trace cross-framework compliance chains
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
