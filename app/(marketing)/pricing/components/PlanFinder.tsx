'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  PUBLIC_PRICING_TIERS,
  nameFor,
  priceLabelFor,
  type PublicPricingTier,
} from '@/lib/marketing/pricing';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';

/**
 * Scope → plan recommender. Replaces the old three-identical-card
 * "How pricing works" grid. Inputs map to real PLAN_CATALOG limits
 * (sites, seats, frameworks, identity) so the readout is grounded , 
 * the recommended tier is the highest tier any answer requires.
 */

type TierId = PublicPricingTier['id'];

const RANK: Record<TierId, number> = {
  foundation: 0,
  growth: 1,
  scale: 2,
  enterprise: 3,
};

type Dimension = {
  key: string;
  label: string;
  hint: string;
  options: { label: string; requires: TierId; note: string }[];
  /** index of the default-selected option */
  initial: number;
};

const DIMENSIONS: Dimension[] = [
  {
    key: 'sites',
    label: 'Sites / locations',
    hint: 'Physical or operational boundaries you run compliance across.',
    initial: 1,
    options: [
      { label: '1 site', requires: 'foundation', note: 'single location' },
      { label: '2-3 sites', requires: 'growth', note: 'up to 3 sites' },
      { label: '4+ sites', requires: 'scale', note: 'unlimited sites' },
    ],
  },
  {
    key: 'team',
    label: 'People who need access',
    hint: 'Staff, coordinators, and reviewers working inside the system.',
    initial: 1,
    options: [
      { label: 'Up to 10', requires: 'foundation', note: '10 seats' },
      { label: 'Up to 25', requires: 'growth', note: '25 seats' },
      { label: 'Up to 75', requires: 'scale', note: '75 seats' },
      { label: '75+', requires: 'enterprise', note: 'unlimited seats' },
    ],
  },
  {
    key: 'frameworks',
    label: 'Compliance frameworks',
    hint: 'NDIS Practice Standards, SOC 2, ISO 27001, HIPAA, and more.',
    initial: 1,
    options: [
      { label: '2 frameworks', requires: 'foundation', note: '2 framework packs' },
      { label: '4 frameworks', requires: 'growth', note: '4 framework packs' },
      { label: 'Unlimited', requires: 'scale', note: 'full framework library' },
    ],
  },
  {
    key: 'identity',
    label: 'Identity & contract needs',
    hint: 'Enterprise identity and procurement requirements.',
    initial: 0,
    options: [
      { label: 'Standard login', requires: 'foundation', note: 'email + role-based access' },
      {
        label: 'SSO / SAML · DPA · custom frameworks',
        requires: 'enterprise',
        note: 'SSO, directory sync, custom contract',
      },
    ],
  },
];

export function PlanFinder() {
  const { trackCtaClick } = useMarketingTelemetry();
  const shouldReduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<number[]>(
    DIMENSIONS.map((d) => d.initial),
  );

  const { tier, drivers } = useMemo(() => {
    let topRank = 0;
    const chosen = DIMENSIONS.map((d, i) => d.options[selected[i]]);
    for (const opt of chosen) topRank = Math.max(topRank, RANK[opt.requires]);
    const recommended =
      PUBLIC_PRICING_TIERS.find((t) => RANK[t.id] === topRank) ??
      PUBLIC_PRICING_TIERS[0];
    // Drivers: the answers your scope actually needs at this tier.
    const reasons = chosen
      .filter((opt) => RANK[opt.requires] === topRank)
      .map((opt) => opt.note);
    return { tier: recommended, drivers: reasons };
  }, [selected]);

  return (
    <div className="mx-auto mt-12 grid max-w-6xl grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-8">
      {/* Inputs */}
      <div className="lg:col-span-7">
        <div className="space-y-6">
          {DIMENSIONS.map((dim, di) => (
            <fieldset key={dim.key} className="border-0 p-0">
              <legend className="flex flex-wrap items-baseline gap-x-3 gap-y-1 p-0">
                <span className="text-[13px] font-semibold text-white">
                  {dim.label}
                </span>
                <span className="text-xs text-slate-500">{dim.hint}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {dim.options.map((opt, oi) => {
                  const isActive = selected[di] === oi;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() =>
                        setSelected((prev) => {
                          const next = [...prev];
                          next[di] = oi;
                          return next;
                        })
                      }
                      className={`rounded-xl border px-4 py-2.5 text-[13px] font-medium transition-colors duration-200 ${
                        isActive
                          ? 'border-white/30 bg-white/[0.08] text-white'
                          : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/[0.16] hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      {/* Recommendation readout */}
      <div className="lg:col-span-5">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.03] p-7 lg:sticky lg:top-28">
          <span className="pointer-events-none absolute inset-y-7 left-0 w-px bg-gradient-to-b from-white/50 via-white/15 to-transparent" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Recommended for your scope
          </p>

          <motion.div
            key={tier.id}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.28 }}
          >
            <div className="mt-4 flex items-end justify-between gap-3">
              <h3 className="font-display text-2xl font-bold tracking-tight text-white">
                {nameFor(tier)}
              </h3>
              <div className="text-right">
                <div className="text-3xl font-semibold tracking-tight text-white">
                  {priceLabelFor(tier)}
                </div>
                <div className="text-[11px] text-slate-500">
                  {tier.priceSubtext}
                </div>
              </div>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
              {tier.audience}
            </p>

            <ul className="mt-5 space-y-2 border-t border-white/[0.08] pt-5">
              {drivers.map((d) => (
                <li
                  key={d}
                  className="flex items-start gap-2.5 text-[13px] leading-snug text-slate-300"
                >
                  <Check
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />
                  <span className="capitalize">{d}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <Link
            href={tier.ctaHref}
            onClick={() =>
              trackCtaClick({
                surface: 'pricing',
                section: 'plan_finder',
                location: 'recommendation',
                ctaLabel: tier.ctaLabel,
                ctaHref: tier.ctaHref,
                variant: 'plan',
                plan: tier.id,
              })
            }
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            {tier.ctaLabel}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <p className="mt-3 text-center text-[11px] text-slate-500">
            Estimate only · final scope is confirmed in a short assessment.
          </p>
        </div>
      </div>
    </div>
  );
}
