'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Calculator, ShieldCheck } from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { MANUAL_COMPLIANCE_COST_ANCHORS } from '@/lib/marketing/pricing';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { CursorTilt } from '@/components/motion/CursorTilt';
import { duration } from '@/config/motion';

export function PricingHero() {
  const { trackCtaClick } = useMarketingTelemetry();
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [allowHeavyVisuals, setAllowHeavyVisuals] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end -15%'],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.26, 0.82, 0.96],
    [1, 1, 0.34, 0],
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 0.26, 0.82, 0.96],
    [1, 1, 0.97, 0.94],
  );
  const y = useTransform(scrollYProgress, [0, 0.82, 1], [0, 48, 110]);
  const shouldAnimateIntro = !shouldReduceMotion && allowHeavyVisuals;

  useEffect(() => {
    const update = () => setAllowHeavyVisuals(window.innerWidth >= 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16"
    >
      <HeroAtmosphere
        topColor="cyan"
        bottomColor="emerald"
        particleIntensity="normal"
      />

      <div className="relative z-10 mx-auto max-w-7xl w-full grid gap-12 px-6 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:px-12">
        <CursorTilt
          intensity={3}
          glowFollow
          glowColor="6,182,212"
          className="w-full"
        >
          <motion.div style={shouldAnimateIntro ? { opacity, scale, y } : {}}>
            <motion.div
              initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldAnimateIntro
                  ? { duration: duration.slow, delay: 0.2 }
                  : { duration: 0 }
              }
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-8 backdrop-blur-sm"
            >
              <ShieldCheck
                className="w-4 h-4 text-cyan-400"
                aria-hidden="true"
              />
              <span className="text-sm text-cyan-400 font-medium tracking-wide">
                Pricing and procurement
              </span>
            </motion.div>

            <motion.h1
              id="pricing-hero-title"
              initial={shouldAnimateIntro ? { opacity: 0, y: 30 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldAnimateIntro
                  ? { duration: duration.slower, delay: 0.3 }
                  : { duration: 0 }
              }
              className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-[1.1] text-white"
            >
              Compliance that{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
                enforces itself
              </span>
              <br />
              <span className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-300">
                not something your team forgets
              </span>
            </motion.h1>

            <motion.p
              initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldAnimateIntro
                  ? { duration: duration.slower, delay: 0.5 }
                  : { duration: 0 }
              }
              className="text-lg sm:text-xl text-slate-400 mb-4 max-w-2xl leading-relaxed"
            >
              FormaOS replaces manual compliance work with enforced workflows
              and real-time audit evidence. Pricing is anchored to risk,
              compliance scope, and organisational complexity — not feature
              unlocks.
            </motion.p>

            <motion.div
              initial={shouldAnimateIntro ? { opacity: 0, y: 10 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldAnimateIntro
                  ? { duration: duration.slower, delay: 0.6 }
                  : { duration: 0 }
              }
              className="flex flex-wrap items-center gap-3 mb-8 text-xs text-slate-500"
            >
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Risk-anchored pricing
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                No feature gates
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.1]">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                Scope-based plans
              </span>
            </motion.div>

            <motion.div
              initial={shouldAnimateIntro ? { opacity: 0, y: 20 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={
                shouldAnimateIntro
                  ? { duration: duration.slower, delay: 0.7 }
                  : { duration: 0 }
              }
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/contact?type=compliance-plan&source=pricing_hero"
                onClick={() =>
                  trackCtaClick({
                    surface: 'pricing',
                    section: 'hero',
                    location: 'hero_primary',
                    ctaLabel: 'Get Your Compliance Plan',
                    ctaHref:
                      '/contact?type=compliance-plan&source=pricing_hero',
                    variant: 'primary',
                  })
                }
                className="mk-btn mk-btn-primary min-h-[52px] justify-center px-8 py-4 text-base"
              >
                Get Your Compliance Plan
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href="#pricing-table"
                onClick={() =>
                  trackCtaClick({
                    surface: 'pricing',
                    section: 'hero',
                    location: 'hero_secondary',
                    ctaLabel: 'View Pricing',
                    ctaHref: '#pricing-table',
                    variant: 'secondary',
                  })
                }
                className="mk-btn mk-btn-secondary min-h-[52px] justify-center px-8 py-4 text-base"
              >
                View Pricing
              </Link>
            </motion.div>
          </motion.div>
        </CursorTilt>

        <motion.aside
          initial={shouldAnimateIntro ? { opacity: 0, x: 32 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={
            shouldAnimateIntro
              ? { duration: duration.slower, delay: 0.45 }
              : { duration: 0 }
          }
          className="rounded-[2rem] border border-white/[0.1] backdrop-blur-xl bg-gradient-to-br from-white/[0.1] to-white/[0.04] p-5 shadow-2xl shadow-cyan-950/40"
        >
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.08] p-3">
              <Calculator
                className="h-5 w-5 text-emerald-200"
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                The cost of doing this manually
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white">
                Price against audit exposure first
              </h2>
            </div>
          </div>
          <div className="mt-6 divide-y divide-white/[0.08] overflow-hidden rounded-3xl border border-white/[0.08]">
            {MANUAL_COMPLIANCE_COST_ANCHORS.map((item) => (
              <div
                key={item.label}
                className="grid grid-cols-[7rem_1fr_1fr] gap-3 px-4 py-4 text-sm"
              >
                <span className="font-semibold text-slate-400">
                  {item.label}
                </span>
                <span className="text-red-100">{item.manual}</span>
                <span className="text-emerald-100">{item.formaos}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-400">
            One failed audit, emergency remediation cycle, or avoidable
            compliance gap can cost more than a year of the system that prevents
            it.
          </p>
        </motion.aside>
      </div>
    </section>
  );
}
