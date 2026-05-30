'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { MANUAL_COMPLIANCE_COST_ANCHORS } from '@/lib/marketing/pricing';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';
import { HeroAtmosphere } from '@/components/motion/HeroAtmosphere';
import { duration } from '@/config/motion';

const PLAN_CONFIG_INPUTS = [
  { label: 'Frameworks', value: '2 → ∞' },
  { label: 'Sites', value: '1 → ∞' },
  { label: 'Staff', value: '10 → ∞' },
  { label: 'Audit pressure', value: 'Low → Critical' },
];

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
        topColor="slate"
        bottomColor="slate"
        particleIntensity="normal"
      />

      <div className="relative z-10 mx-auto max-w-7xl w-full grid gap-14 px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-12">
        <motion.div style={shouldAnimateIntro ? { opacity, scale, y } : {}}>
          <motion.h1
            id="pricing-hero-title"
            initial={shouldAnimateIntro ? { opacity: 0, y: 24 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldAnimateIntro
                ? { duration: duration.slower, delay: 0.36 }
                : { duration: 0 }
            }
            className="text-[2.6rem] font-bold leading-[1.04] tracking-tight text-white sm:text-6xl lg:text-[5.2rem]"
          >
            Compliance,
            <br />
            priced like infrastructure.
          </motion.h1>

          <motion.p
            initial={shouldAnimateIntro ? { opacity: 0, y: 16 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldAnimateIntro
                ? { duration: duration.slower, delay: 0.5 }
                : { duration: 0 }
            }
            className="mt-7 max-w-xl text-base leading-relaxed text-slate-400 sm:text-lg"
          >
            FormaOS replaces manual compliance work with enforced workflows and
            real-time audit evidence. Plans are anchored to risk, framework
            scope, and operational complexity — not feature unlocks.
          </motion.p>

          <motion.div
            initial={shouldAnimateIntro ? { opacity: 0, y: 12 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={
              shouldAnimateIntro
                ? { duration: duration.slower, delay: 0.62 }
                : { duration: 0 }
            }
            className="mt-10 flex flex-col gap-3 sm:flex-row"
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
              View pricing
            </Link>
          </motion.div>

          {/* Inline anchor footnotes */}
          <motion.dl
            initial={shouldAnimateIntro ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={
              shouldAnimateIntro
                ? { duration: duration.slower, delay: 0.78 }
                : { duration: 0 }
            }
            className="mt-12 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm sm:max-w-xl"
          >
            {[
              { k: 'Plans', v: '4', sub: 'Foundation → Enterprise' },
              { k: 'Frameworks', v: '8', sub: 'pre-built packs' },
              { k: 'Setup', v: '<14d', sub: 'typical go-live' },
            ].map((stat) => (
              <div
                key={stat.k}
                className="bg-[#070b14] px-4 py-4"
              >
                <dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-slate-500">
                  {stat.k}
                </dt>
                {/*
                  Axe a11y rule "definition-list" requires every direct
                  child of <dl> to be <dt>/<dd>/<script>/<template>, or a
                  <div> grouping ONLY those. The previous <p> sibling
                  inside the wrapper div violated the rule. Folded the
                  sub-text into the <dd> via a nested <span> so the
                  semantic markup stays clean and the dl validates.
                */}
                <dd className="mt-1.5 font-mono text-2xl font-semibold text-white">
                  {stat.v}
                  <span className="mt-0.5 block text-[11px] font-normal text-slate-500">
                    {stat.sub}
                  </span>
                </dd>
              </div>
            ))}
          </motion.dl>
        </motion.div>

        {/* ─── Plan Configurator HUD ─── */}
        <motion.aside
          initial={shouldAnimateIntro ? { opacity: 0, x: 32 } : false}
          animate={{ opacity: 1, x: 0 }}
          transition={
            shouldAnimateIntro
              ? { duration: duration.slower, delay: 0.45 }
              : { duration: 0 }
          }
          className="relative"
        >
          {/* Outer halo */}
          <div className="pointer-events-none absolute -inset-6 -z-10 bg-[radial-gradient(circle_at_50%_30%,rgba(113,113,122,0.18),transparent_60%)]" />

          <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-gradient-to-br from-[#0a1322]/95 via-[#070d1c]/90 to-[#040810]/95 shadow-2xl shadow-black/50 ring-1 ring-white/[0.04] backdrop-blur-xl">
            {/* Corner accents */}
            <CornerAccents />
            {/* Edge glow lines */}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Title bar */}
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-5 py-3">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-300" />
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-300">
                  formaos · plan configurator
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                FY26 · AUD
              </span>
            </div>

            {/* Body */}
            <div className="grid gap-5 p-6">
              {/* Inputs panel */}
              <div className="rounded-xl border border-white/[0.05] bg-black/30 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  scope inputs
                </p>
                <ul className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2.5">
                  {PLAN_CONFIG_INPUTS.map((input) => (
                    <li
                      key={input.label}
                      className="flex items-center justify-between border-b border-dashed border-white/[0.04] pb-1.5 last:border-b-0 last:pb-0"
                    >
                      <span className="text-[11px] text-slate-400">
                        {input.label}
                      </span>
                      <span className="font-mono text-[11px] font-medium text-slate-200">
                        {input.value}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Audit-vs-FormaOS rail */}
              <div className="rounded-xl border border-white/[0.05] bg-black/30 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    cost ledger
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
                    manual ↔ enforced
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {MANUAL_COMPLIANCE_COST_ANCHORS.map((item) => (
                    <li
                      key={item.label}
                      className="grid grid-cols-[5.5rem_1fr_1fr] items-center gap-3 text-[11px]"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
                        {item.label}
                      </span>
                      <span className="flex items-center gap-2 text-slate-400">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-slate-500" />
                        {item.manual}
                      </span>
                      <span className="flex items-center gap-2 text-slate-200">
                        <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                        {item.formaos}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended plan */}
              <div className="rounded-xl border border-white/[0.1] bg-white/[0.04] p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-300">
                  where most regulated teams land
                </p>
                <p className="mt-1.5 text-sm leading-snug text-slate-200">
                  <span className="font-semibold text-white">Growth, $797/mo</span>{' '}
                  — most registered NDIS and healthcare providers (up to 3 sites,
                  10–25 staff) start here with NDIS Practice Standards + WHS
                  pre-mapped.
                </p>
              </div>
            </div>

            {/* Bottom telemetry bar */}
            <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.015] px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">
              <span>secured · stripe / sso / dpa</span>
              <span>aud · gst inclusive</span>
            </div>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}

function CornerAccents() {
  return (
    <>
      <span className="pointer-events-none absolute left-3 top-3 h-3 w-3 border-l border-t border-white/20" />
      <span className="pointer-events-none absolute right-3 top-3 h-3 w-3 border-r border-t border-white/20" />
      <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-white/15" />
      <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-white/15" />
    </>
  );
}

