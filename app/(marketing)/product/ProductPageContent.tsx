'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { DeferredSection } from '../components/shared';
import { MarketingPageShell } from '../components/shared/MarketingPageShell';
import { DepthSection } from '@/components/motion/DepthSection';
import { FrameworkTrustStrip } from '@/components/marketing/FrameworkTrustStrip';
import { ProductHeroSection } from '@/components/marketing/ProductHeroSection';
import { compliancePlanHref, PUBLIC_CTA_LABELS } from '@/lib/marketing/cta';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';

const stickyPlanHref = compliancePlanHref('product_sticky');

/** Mobile-only thumb-reachable primary CTA (shown below md, post-hero). */
function MobileStickyPlanCta() {
  const reduce = useReducedMotion();
  const { trackCtaClick } = useMarketingTelemetry();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={reduce ? false : { y: '110%' }}
          animate={{ y: 0 }}
          exit={reduce ? undefined : { y: '110%' }}
          transition={{ duration: reduce ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#0a0f1c]/95 px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-3 backdrop-blur-md md:hidden"
        >
          <Link
            href={stickyPlanHref}
            onClick={() =>
              trackCtaClick({
                surface: 'product',
                section: 'sticky_cta',
                location: 'mobile_sticky',
                ctaLabel: PUBLIC_CTA_LABELS.compliancePlan,
                ctaHref: stickyPlanHref,
                variant: 'primary',
              })
            }
            className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white px-5 text-[15px] font-semibold text-slate-900 transition active:bg-slate-100"
          >
            {PUBLIC_CTA_LABELS.compliancePlan}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ── Hero (headline + CTAs) then Showcase (interactive tabs + panel) ── */
const ProductShowcaseSection = dynamic(
  () =>
    import('@/components/marketing/ProductShowcaseSection').then(
      (m) => m.ProductShowcaseSection,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full min-h-[360px] sm:min-h-[520px] lg:min-h-[600px]" />
    ),
  },
);

const WhatIsFormaOS = dynamic(
  () => import('./components/WhatIsFormaOS').then((m) => m.WhatIsFormaOS),
  {
    ssr: false,
    loading: () => null,
  },
);
const ObligationToExecution = dynamic(
  () =>
    import('./components/ObligationToExecution').then(
      (m) => m.ObligationToExecution,
    ),
  { ssr: false, loading: () => null },
);
const OperatingModel = dynamic(
  () => import('./components/OperatingModel').then((m) => m.OperatingModel),
  {
    ssr: false,
    loading: () => null,
  },
);
const FullControlMapSection = dynamic(
  () =>
    import('./components/FullControlMapSection').then(
      (m) => m.FullControlMapSection,
    ),
  { ssr: false, loading: () => null },
);
const FinalCTA = dynamic(
  () => import('./components/FinalCTA').then((m) => m.FinalCTA),
  {
    ssr: false,
    loading: () => null,
  },
);

export default function ProductPageContent() {
  return (
    <MarketingPageShell className="product-page-flow">
      {/* Hero - headline, gradient text, CTAs */}
      <ProductHeroSection />
      {/* Interactive showcase - tabs left, app panel right */}
      <DeferredSection minHeight={440} rootMargin="120px 0px">
        <ProductShowcaseSection />
      </DeferredSection>

      <FrameworkTrustStrip className="mt-4 mb-2" />

      <DeferredSection minHeight={460}>
        <DepthSection fade>
          <WhatIsFormaOS />
        </DepthSection>
      </DeferredSection>
      <DeferredSection minHeight={440}>
        <DepthSection fade>
          <ObligationToExecution />
        </DepthSection>
      </DeferredSection>
      <DeferredSection minHeight={500}>
        <OperatingModel />
      </DeferredSection>
      <DeferredSection minHeight={560}>
        <FullControlMapSection />
      </DeferredSection>
      <DeferredSection minHeight={380}>
        <FinalCTA />
      </DeferredSection>

      <MobileStickyPlanCta />
    </MarketingPageShell>
  );
}
