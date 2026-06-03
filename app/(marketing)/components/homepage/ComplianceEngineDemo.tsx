'use client';

import { ScrollReveal } from '@/components/motion/ScrollReveal';
import dynamic from 'next/dynamic';

const DemoComplianceChain = dynamic(
  () => import('@/components/marketing/demo/DemoComplianceChain'),
  { ssr: false, loading: () => null }
);
const DemoComplianceScore = dynamic(
  () => import('@/components/marketing/demo/DemoComplianceScore'),
  { ssr: false, loading: () => null }
);

export function ComplianceEngineDemo() {
  return (
    <section className="mk-section home-section home-section--process relative overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        {/* Editorial header — left-aligned labelled rule + paired description,
            sized to the rest of the homepage (no oversized hero heading). */}
        <ScrollReveal variant="slideUp" range={[0, 0.3]}>
          <div className="mb-12 grid gap-x-10 gap-y-6 border-b border-white/[0.06] pb-10 lg:mb-14 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-8 bg-white/25" />
                <span className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Compliance engine
                </span>
              </div>
              <h2 className="text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl md:text-[2.75rem]">
                How the compliance engine{' '}
                <span className="text-slate-400">works</span>
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="max-w-md text-sm leading-relaxed text-slate-400 sm:text-base">
                One connected lifecycle — obligations become controls, controls
                generate tasks, tasks produce evidence, and every step stays
                audit-ready.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <ScrollReveal variant="slideUp" range={[0, 0.35]}>
            <div className="home-panel home-panel--strong rounded-2xl p-2">
              <DemoComplianceChain />
            </div>
          </ScrollReveal>
          <ScrollReveal variant="slideUp" range={[0.04, 0.39]}>
            <div className="home-panel home-panel--strong rounded-2xl p-2">
              <DemoComplianceScore />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
