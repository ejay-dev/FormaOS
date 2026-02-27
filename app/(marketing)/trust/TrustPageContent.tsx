'use client';

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion';
import { VisualDivider } from '@/components/motion';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { TrustHero } from './components';
import { FrameworkTrustStrip } from '@/components/marketing/FrameworkTrustStrip';
import { useDeviceTier } from '@/lib/device-tier';

const TrustModules = dynamic(
  () => import('./components/TrustModules').then((m) => m.TrustModules),
  { ssr: false, loading: () => null },
);

const TrustWorkflow = dynamic(
  () => import('./components/TrustWorkflow').then((m) => m.TrustWorkflow),
  { ssr: false, loading: () => null },
);

const QuestionnaireAccelerator = dynamic(
  () =>
    import('./components/QuestionnaireAccelerator').then(
      (m) => m.QuestionnaireAccelerator,
    ),
  { ssr: false, loading: () => null },
);

/** Page-level decorative compliance wire paths that draw on scroll */
function TrustWirePaths() {
  const prefersReducedMotion = useReducedMotion();
  const tierConfig = useDeviceTier();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  const shouldRenderWires =
    !prefersReducedMotion && tierConfig.tier === 'high' && !tierConfig.isTouch;

  const wire1 = useTransform(scrollYProgress, [0, 0.4], [0, 1]);
  const wire2 = useTransform(scrollYProgress, [0.15, 0.6], [0, 1]);
  const wire3 = useTransform(scrollYProgress, [0.3, 0.8], [0, 1]);
  const wire4 = useTransform(scrollYProgress, [0.5, 1], [0, 1]);

  if (!shouldRenderWires) return null;

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[120vh] overflow-hidden"
      style={{ opacity: 0.18 }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="trustWire1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,211,238,0)" />
            <stop offset="50%" stopColor="rgba(34,211,238,0.6)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
          <linearGradient id="trustWire2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59,130,246,0)" />
            <stop offset="50%" stopColor="rgba(59,130,246,0.5)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </linearGradient>
          <linearGradient id="trustWire3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(16,185,129,0)" />
            <stop offset="50%" stopColor="rgba(16,185,129,0.5)" />
            <stop offset="100%" stopColor="rgba(16,185,129,0)" />
          </linearGradient>
          <linearGradient id="trustWire4" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(251,191,36,0)" />
            <stop offset="50%" stopColor="rgba(251,191,36,0.4)" />
            <stop offset="100%" stopColor="rgba(251,191,36,0)" />
          </linearGradient>
        </defs>

        {/* Wire 1: Top path - flows from left to right with gentle curve */}
        <motion.path
          d="M -20 200 C 200 120, 400 280, 720 180 S 1100 250, 1460 160"
          stroke="url(#trustWire1)"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ pathLength: wire1 }}
        />

        {/* Wire 2: Upper-mid path */}
        <motion.path
          d="M -20 380 C 250 320, 500 440, 800 360 S 1150 420, 1460 340"
          stroke="url(#trustWire2)"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ pathLength: wire2 }}
        />

        {/* Wire 3: Lower-mid path */}
        <motion.path
          d="M -20 560 C 300 500, 550 620, 850 540 S 1200 600, 1460 520"
          stroke="url(#trustWire3)"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ pathLength: wire3 }}
        />

        {/* Wire 4: Bottom path */}
        <motion.path
          d="M -20 720 C 350 680, 600 780, 900 700 S 1250 760, 1460 680"
          stroke="url(#trustWire4)"
          strokeWidth="1.5"
          strokeLinecap="round"
          style={{ pathLength: wire4 }}
        />

        {/* Node dots at key intersections */}
        {[
          { cx: 720, cy: 180, fill: 'rgba(34,211,238,0.6)' },
          { cx: 800, cy: 360, fill: 'rgba(59,130,246,0.6)' },
          { cx: 850, cy: 540, fill: 'rgba(16,185,129,0.6)' },
          { cx: 900, cy: 700, fill: 'rgba(251,191,36,0.5)' },
        ].map((node) => (
          <circle
            key={`${node.cx}-${node.cy}`}
            cx={node.cx}
            cy={node.cy}
            r="3"
            fill={node.fill}
          />
        ))}
      </svg>
    </div>
  );
}

export default function TrustPageContent() {
  return (
    <MarketingPageShell>
      <TrustWirePaths />
      <TrustHero />
      <FrameworkTrustStrip className="mt-2 mb-2" />
      <VisualDivider />
      <DeferredSection minHeight={520}>
        <TrustModules />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={400}>
        <TrustWorkflow />
      </DeferredSection>
      <VisualDivider />
      <DeferredSection minHeight={560}>
        <QuestionnaireAccelerator />
      </DeferredSection>
    </MarketingPageShell>
  );
}
