'use client';

import {
  AnimatePresence,
  motion,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from 'framer-motion';
import { useEffect, useState, type RefObject } from 'react';
import { ArrowRight } from 'lucide-react';
import { brand } from '@/config/brand';
import { useDeviceTier } from '@/lib/device-tier';
import { useControlPlaneRuntime } from '@/lib/control-plane/runtime-client';
import { DEFAULT_RUNTIME_MARKETING } from '@/lib/control-plane/defaults';
import {
  deriveHomepageMotionPolicy,
  normalizeHeroCopy,
  resolveHomepageCtas,
  shouldStickyCtaBeVisible,
} from '@/lib/marketing/homepage-experience';
import { useHomepageTelemetry } from '@/lib/marketing/homepage-telemetry';

/**
 * HeroScrollRetentionController
 * ─────────────────────────────
 * Floating sticky CTA that appears when the hero CTAs scroll out of view.
 * Fades in at ~55 % hero scroll, fades out before hero fully exits.
 * Glass morphism + gradient glow — premium, non-aggressive.
 */
export function HeroScrollRetentionController({
  heroRef,
  stickyWindow,
}: {
  heroRef: RefObject<HTMLElement | null>;
  stickyWindow?: {
    enter: number;
    exit: number;
  };
}) {
  const [visible, setVisible] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const tierConfig = useDeviceTier();
  const { snapshot } = useControlPlaneRuntime();
  const runtimeMarketing = snapshot?.marketing ?? DEFAULT_RUNTIME_MARKETING;
  const heroCopy = normalizeHeroCopy(
    runtimeMarketing.hero,
    DEFAULT_RUNTIME_MARKETING.hero,
  );
  const ctas = resolveHomepageCtas(heroCopy, brand.seo.appUrl);
  const motionPolicy = deriveHomepageMotionPolicy({
    reducedMotion: Boolean(shouldReduceMotion),
    expensiveEffectsEnabled: runtimeMarketing.runtime.expensiveEffectsEnabled,
    pageVisible: true,
    heroInView: true,
    deviceTier: tierConfig.tier,
  });
  const effectiveWindow = stickyWindow ?? motionPolicy.stickyCtaWindow;
  const telemetry = useHomepageTelemetry(motionPolicy, { samplingRate: 0.75 });

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    // Keep primary hero CTA present longer. Sticky helper appears late.
    setVisible(
      shouldStickyCtaBeVisible(v, {
        ...motionPolicy,
        stickyCtaWindow: effectiveWindow,
      }),
    );
  });

  useEffect(() => {
    if (!visible) return;
    telemetry.trackStickyImpression({
      stickyWindowEnter: effectiveWindow.enter,
      stickyWindowExit: effectiveWindow.exit,
      ctaLabel: ctas.primary.label,
    });
  }, [ctas.primary.label, effectiveWindow.enter, effectiveWindow.exit, telemetry, visible]);

  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 18 }}
          transition={
            shouldReduceMotion
              ? { duration: 0.01 }
              : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
          }
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 md:bottom-8"
        >
          <motion.a
            href={ctas.primary.href}
            onClick={() =>
              telemetry.trackCtaClick(
                'sticky',
                ctas.primary.label,
                ctas.primary.href,
                {
                  isAppDomain: ctas.primary.isAppDomain,
                  isAuthRoute: ctas.primary.isAuthRoute,
                },
              )
            }
            whileHover={
              shouldReduceMotion
                ? undefined
                : {
                    scale: 1.02,
                    boxShadow: '0 0 32px rgba(6, 182, 212, 0.45)',
                  }
            }
            whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
            className="mk-btn mk-btn-primary flex items-center gap-3 px-5 py-3 md:px-6 md:py-3.5 text-sm md:text-base shadow-2xl shadow-cyan-500/25 backdrop-blur-md"
          >
            <span className="text-sm md:text-base">{ctas.primary.label}</span>
            <ArrowRight className="h-4 w-4" />
          </motion.a>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default HeroScrollRetentionController;
