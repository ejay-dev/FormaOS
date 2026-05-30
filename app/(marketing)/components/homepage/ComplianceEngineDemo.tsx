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
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-white/[0.04] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
        <ScrollReveal variant="slideUp" range={[0, 0.3]} className="text-center mb-16">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            Compliance Engine
          </p>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 text-white">
            How the compliance engine{' '}
            <span className="text-slate-400">works</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            One connected lifecycle - obligations become controls, controls
            generate tasks, tasks produce evidence, and every step stays
            audit-ready.
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
