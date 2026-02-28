'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, useTransform, useReducedMotion } from 'framer-motion';
import { useGlobalMotion } from '../components/motion/MotionContext';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { PricingHero } from './components';

const PricingTiers = dynamic(() => import('./components/PricingTiers').then((m) => m.PricingTiers), {
  ssr: false,
  loading: () => null,
});
const AllPlansInclude = dynamic(
  () => import('./components/AllPlansInclude').then((m) => m.AllPlansInclude),
  { ssr: false, loading: () => null },
);
const ProcurementReadiness = dynamic(
  () => import('./components/ProcurementReadiness').then((m) => m.ProcurementReadiness),
  { ssr: false, loading: () => null },
);
const FreeTrial = dynamic(() => import('./components/FreeTrial').then((m) => m.FreeTrial), {
  ssr: false,
  loading: () => null,
});
const FAQSection = dynamic(() => import('./components/FAQSection').then((m) => m.FAQSection), {
  ssr: false,
  loading: () => null,
});
const FinalCTA = dynamic(() => import('./components/FinalCTA').then((m) => m.FinalCTA), {
  ssr: false,
  loading: () => null,
});

function PricingGradientMesh() {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useGlobalMotion();
  const hueRotate = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const filterValue = useTransform(hueRotate, (v) => `hue-rotate(${v}deg)`);

  if (prefersReducedMotion) return null;

  return (
    <motion.div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        filter: filterValue,
        opacity: 0.15,
      }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 80% 60% at 20% 30%, rgba(34,211,238,0.5), transparent 60%)',
            'radial-gradient(ellipse 60% 80% at 80% 70%, rgba(59,130,246,0.4), transparent 55%)',
            'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(16,185,129,0.3), transparent 65%)',
          ].join(', '),
        }}
      />
    </motion.div>
  );
}

export default function PricingPageContent() {
  return (
    <MarketingPageShell className="text-white">
      <PricingGradientMesh />
      <PricingHero />
      <VisualDivider gradient />
      <DeferredSection minHeight={920}>
        <PricingTiers />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={560}>
        <AllPlansInclude />
      </DeferredSection>
      <VisualDivider gradient />
      <DeferredSection minHeight={620}>
        <ProcurementReadiness />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={560}>
        <FreeTrial />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={760}>
        <FAQSection />
      </DeferredSection>
      <VisualDivider gradient />
      <DeferredSection minHeight={460}>
        <FinalCTA />
      </DeferredSection>
    </MarketingPageShell>
  );
}
