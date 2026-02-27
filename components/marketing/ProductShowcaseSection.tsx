'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { FileCheck2, ShieldCheck, Sparkles } from 'lucide-react';
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { useDeviceTier } from '@/lib/device-tier';

const ProductLiveDemo = dynamic(
  () => import('./ProductLiveDemo').then((m) => m.ProductLiveDemo),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse bg-gradient-to-br from-white/[0.08] to-white/[0.02]" />
    ),
  },
);

function ProductShowcaseLite({ interactiveCapable }: { interactiveCapable: boolean }) {
  const bullets = [
    'Real-time control posture',
    'Evidence chain integrity',
    'Audit packet assembly in minutes',
  ];

  return (
    <div className="h-full w-full p-5 sm:p-6">
      <div className="grid h-full gap-4 rounded-2xl border border-white/10 bg-slate-950/55 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Platform Snapshot</p>
            <p className="text-sm font-semibold text-white/90">
              {interactiveCapable ? 'Interactive demo loads on scroll' : 'Mobile-optimized preview'}
            </p>
          </div>
          <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
            Live
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Controls', value: '142' },
            { label: 'Evidence', value: '98%' },
            { label: 'Findings', value: '3' },
          ].map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-center"
            >
              <div className="text-sm font-bold text-cyan-300">{metric.value}</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-white/40">{metric.label}</div>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          {bullets.map((item, idx) => {
            const Icon = idx === 0 ? ShieldCheck : idx === 1 ? FileCheck2 : Sparkles;
            return (
              <div key={item} className="flex items-center gap-2 text-xs text-white/75">
                <Icon className="h-3.5 w-3.5 text-emerald-300/80" />
                <span>{item}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ProductShowcaseSection() {
  const containerRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const tierConfig = useDeviceTier();
  const inView = useInView(containerRef, {
    once: true,
    amount: 0.08,
    margin: '0px 0px 220px 0px',
  });

  const interactiveCapable =
    !prefersReducedMotion && tierConfig.tier === 'high' && !tierConfig.isTouch;
  const shouldRenderInteractive = interactiveCapable && inView;

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const sectionOpacity = useTransform(
    scrollYProgress,
    [0, 0.1, 0.85, 1],
    interactiveCapable ? [0.72, 1, 1, 0.75] : [1, 1, 1, 1],
  );

  return (
    <motion.section
      ref={containerRef}
      className="product-section product-section--signal relative overflow-hidden pt-8 pb-12 sm:pb-16 sm:pt-12"
      style={{ opacity: sectionOpacity }}
      aria-label="Product showcase"
    >
      <div className="relative z-10 mx-auto mb-6 max-w-6xl px-4 text-center sm:mb-8 sm:px-6 lg:px-12">
        <h2 className="text-lg font-semibold text-white/75 sm:text-xl">
          Experience the full platform
        </h2>
        <p className="mt-1 text-sm text-white/35">
          {interactiveCapable
            ? 'Interactive demo streams in as you reach this section'
            : 'Optimized preview for smoother mobile performance'}
        </p>
      </div>

      <div
        aria-hidden
        className="absolute left-1/2 top-0 h-[1px] w-[40%] -translate-x-1/2"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(45,212,191,0.15) 50%, transparent 100%)',
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-12">
        <div
          className="product-panel product-panel--strong relative overflow-hidden rounded-2xl"
          style={{
            height: 'clamp(400px, 55vh, 640px)',
            boxShadow:
              '0 0 80px rgba(45,212,191,0.08), 0 0 160px rgba(45,212,191,0.04), 0 32px 64px rgba(0,0,0,0.4)',
          }}
        >
          {shouldRenderInteractive ? (
            <ProductLiveDemo />
          ) : (
            <ProductShowcaseLite interactiveCapable={interactiveCapable} />
          )}
        </div>
      </div>
    </motion.section>
  );
}

export { ProductShowcaseSection as ProductShowcase };
export { ProductShowcaseSection as ProductHeroCopy };

export default ProductShowcaseSection;
