'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { duration } from '@/config/motion';

const HERO_STATS = [
  { value: '4', label: 'Plans', sub: 'Foundation → Enterprise' },
  { value: '8', label: 'Frameworks', sub: 'Pre-built packs' },
  { value: '<14d', label: 'Typical go-live', sub: 'Guided onboarding' },
] as const;

export function PricingHero() {
  const { trackCtaClick } = useMarketingTelemetry();
  const shouldReduceMotion = useReducedMotion();
  const animate = !shouldReduceMotion;

  return (
    <section className="relative flex min-h-[78vh] items-center justify-center overflow-hidden px-6 pb-20 pt-28 lg:px-12 lg:pt-32">
      <HeroAtmosphere
        topColor="slate"
        bottomColor="slate"
        particleIntensity="normal"
      />

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        {/* No kicker: it only repeated the page title above the headline. */}
        <motion.h1
          id="pricing-hero-title"
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: animate ? duration.slower : 0, delay: animate ? 0.06 : 0 }}
          className="text-[2.5rem] font-bold leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Compliance, priced like infrastructure.
        </motion.h1>

        <motion.p
          initial={animate ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: animate ? duration.slower : 0, delay: animate ? 0.14 : 0 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400 sm:text-lg"
        >
          FormaOS replaces manual compliance work with enforced workflows and
          real-time audit evidence. Plans are anchored to risk, framework scope,
          and operational complexity, not feature unlocks.
        </motion.p>

        <motion.div
          initial={animate ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: animate ? duration.slower : 0, delay: animate ? 0.22 : 0 }}
          className="mt-10 flex flex-col justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/contact?type=compliance-plan&source=pricing_hero"
            onClick={() =>
              trackCtaClick({
                surface: 'pricing',
                section: 'hero',
                location: 'hero_primary',
                ctaLabel: 'Get Your Compliance Plan',
                ctaHref: '/contact?type=compliance-plan&source=pricing_hero',
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
            View pricing
          </Link>
        </motion.div>

        {/* Clean supporting stats, three facts, plainly set, no terminal HUD.
            Plain div/grid (not a <dl>): the prior <dl> nested <dd> before <dt>
            plus a stray <p>, an invalid definition-list structure that tripped
            a serious axe `definition-list` (WCAG 1.3.1) violation on /pricing. */}
        <motion.div
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: animate ? duration.slower : 0, delay: animate ? 0.32 : 0 }}
          className="mx-auto mt-14 grid max-w-2xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] sm:grid-cols-3"
        >
          {HERO_STATS.map((stat) => (
            <div key={stat.label} className="bg-zinc-950/40 px-6 py-5 text-center">
              <div className="text-3xl font-semibold tracking-tight text-white">
                {stat.value}
              </div>
              <div className="mt-1.5 text-sm font-medium text-zinc-300">
                {stat.label}
              </div>
              <p className="mt-0.5 text-xs text-zinc-500">{stat.sub}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
