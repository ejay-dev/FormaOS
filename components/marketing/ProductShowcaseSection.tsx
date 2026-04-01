'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { FileCheck2, ShieldCheck, Sparkles } from 'lucide-react';
import { useInView, useReducedMotion } from 'framer-motion';
import { useDeviceTier } from '@/lib/device-tier';

const ProductLiveDemo = dynamic(
  () => import('./ProductLiveDemo').then((m) => m.ProductLiveDemo),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full animate-pulse bg-slate-900/60" />
    ),
  },
);

function ProductShowcaseLite({
  interactiveCapable,
}: {
  interactiveCapable: boolean;
}) {
  const bullets = [
    'Real-time control posture',
    'Evidence chain integrity',
    'Audit packet assembly in minutes',
  ];

  return (
    <div className="h-full w-full p-5 sm:p-6">
      <div className="grid h-full gap-4 rounded-2xl border border-white/[0.08] bg-slate-900/60 p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Platform Snapshot
            </p>
            <p className="text-sm font-semibold text-white/90">
              {interactiveCapable
                ? 'Interactive demo loads on scroll'
                : 'Mobile-optimized preview'}
            </p>
          </div>
          <span className="rounded-full border border-teal-500/20 bg-teal-500/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-400">
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
              className="rounded-lg border border-white/[0.06] bg-slate-900/50 px-3 py-2 text-center"
            >
              <div className="text-sm font-bold text-teal-400">
                {metric.value}
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/60">
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-xl border border-white/[0.06] bg-slate-900/40 p-3">
          {bullets.map((item, idx) => {
            const Icon =
              idx === 0 ? ShieldCheck : idx === 1 ? FileCheck2 : Sparkles;
            return (
              <div
                key={item}
                className="flex items-center gap-2 text-xs text-white/75"
              >
                <Icon className="h-3.5 w-3.5 text-teal-400" />
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

  return (
    <section
      ref={containerRef}
      className="relative pt-8 pb-12 sm:pb-16 sm:pt-12"
      aria-label="Product showcase"
    >
      <div className="mx-auto mb-6 max-w-6xl px-4 text-center sm:mb-8 sm:px-6 lg:px-12">
        <h2 className="text-lg font-semibold text-white/75 sm:text-xl">
          Experience the full platform
        </h2>
        <p className="mt-1 text-sm text-muted-foreground/60">
          {interactiveCapable
            ? 'Interactive demo streams in as you reach this section'
            : 'Optimized preview for smoother mobile performance'}
        </p>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-12">
        <div
          className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-slate-900/60"
          style={{ height: 'clamp(480px, 65vh, 820px)' }}
        >
          {shouldRenderInteractive ? (
            <ProductLiveDemo />
          ) : (
            <ProductShowcaseLite interactiveCapable={interactiveCapable} />
          )}
        </div>
      </div>
    </section>
  );
}

export { ProductShowcaseSection as ProductShowcase };
export { ProductShowcaseSection as ProductHeroCopy };

export default ProductShowcaseSection;
