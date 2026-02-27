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
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-r from-teal-500/8 to-emerald-500/8 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.3]} className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            Compliance Engine
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            From Obligation to
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              {' '}Audit-Ready
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Watch the compliance lifecycle in real time — obligations flow to controls,
            controls generate tasks, tasks produce evidence.
          </p>
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
