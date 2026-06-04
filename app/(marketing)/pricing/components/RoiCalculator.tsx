'use client';

/**
 * Cost-of-a-finding ROI calculator.
 *
 * Honest, transparent model, every per-unit assumption is shown, and the
 * result is framed as a modelled estimate, not a guarantee. The figures are
 * anchored to MANUAL_COMPLIANCE_COST_ANCHORS (audit prep "2-6 weeks" → hours;
 * ongoing evidence + credential chasing) and the real PLAN_CATALOG prices.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { PLAN_CATALOG } from '@/lib/plans';
import { useMarketingTelemetry } from '@/lib/marketing/marketing-telemetry';

const RATE = 85; // loaded hourly rate, AUD (mid-market compliance analyst)

// Per-unit assumptions (shown to the user).
const MANUAL = { auditPrepPerCycle: 120, opsPerSiteMonth: 60 }; // hours
const FORMA = { auditPrepPerCycle: 4, opsPerSiteMonth: 10 }; // hours

const SITE_OPTIONS = [
  { label: '1 site', sites: 1, planKey: 'basic' as const },
  { label: '2-3 sites', sites: 3, planKey: 'pro' as const },
  { label: '4-8 sites', sites: 8, planKey: 'scale' as const },
] as const;

const CYCLE_OPTIONS = [
  { label: '1 / year', cycles: 1 },
  { label: '2 / year', cycles: 2 },
  { label: '4 / year', cycles: 4 },
] as const;

const fmtUsd = (n: number): string =>
  n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${Math.round(n)}`;
const fmtUsdFull = (n: number): string => `$${Math.round(n).toLocaleString('en-US')}`;
const fmtHrs = (n: number): string => Math.round(n).toLocaleString('en-US');

export function RoiCalculator() {
  const reduce = useReducedMotion();
  const { trackCtaClick } = useMarketingTelemetry();
  const [siteIdx, setSiteIdx] = useState(1); // default 2-3 sites
  const [cycleIdx, setCycleIdx] = useState(1); // default 2/year
  const [showAssumptions, setShowAssumptions] = useState(false);

  const result = useMemo(() => {
    const { sites, planKey } = SITE_OPTIONS[siteIdx];
    const { cycles } = CYCLE_OPTIONS[cycleIdx];

    const manualHrs = cycles * MANUAL.auditPrepPerCycle * sites + MANUAL.opsPerSiteMonth * sites * 12;
    const formaHrs = cycles * FORMA.auditPrepPerCycle * sites + FORMA.opsPerSiteMonth * sites * 12;
    const savedHrs = manualHrs - formaHrs;
    const savedUsd = savedHrs * RATE;

    const planYr = PLAN_CATALOG[planKey].priceMonthly * 12;
    const planName = PLAN_CATALOG[planKey].name;

    const manualCost = manualHrs * RATE;
    const formaCost = formaHrs * RATE + planYr; // residual labour + subscription
    const netSaved = manualCost - formaCost;
    const roi = formaCost > 0 ? manualCost / formaCost : 0;
    const paybackWeeks = savedUsd > 0 ? planYr / (savedUsd / 52) : 0;

    return {
      savedHrs,
      savedUsd,
      planYr,
      planName,
      manualCost,
      formaCost,
      netSaved,
      roi,
      paybackWeeks,
      // bar widths (manual = 100%)
      formaPct: manualCost > 0 ? Math.max(6, (formaCost / manualCost) * 100) : 100,
    };
  }, [siteIdx, cycleIdx]);

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-14 gap-y-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
      {/* Inputs */}
      <div>
        <div className="space-y-6">
          <fieldset className="border-0 p-0">
            <legend className="p-0 text-[13px] font-semibold text-white">
              Sites / locations under compliance
            </legend>
            <div className="mt-3 flex flex-wrap gap-2 max-sm:grid max-sm:grid-cols-3">
              {SITE_OPTIONS.map((opt, i) => (
                <button
                  key={opt.label}
                  type="button"
                  aria-pressed={siteIdx === i}
                  onClick={() => setSiteIdx(i)}
                  className={`rounded-xl border px-4 py-2.5 text-[13px] font-medium transition-colors duration-200 max-sm:flex max-sm:min-h-[44px] max-sm:items-center max-sm:justify-center ${
                    siteIdx === i
                      ? 'border-white/30 bg-white/[0.08] text-white'
                      : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/[0.16] hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="border-0 p-0">
            <legend className="p-0 text-[13px] font-semibold text-white">
              Audit / accreditation cycles per year
            </legend>
            <div className="mt-3 flex flex-wrap gap-2 max-sm:grid max-sm:grid-cols-3">
              {CYCLE_OPTIONS.map((opt, i) => (
                <button
                  key={opt.label}
                  type="button"
                  aria-pressed={cycleIdx === i}
                  onClick={() => setCycleIdx(i)}
                  className={`rounded-xl border px-4 py-2.5 text-[13px] font-medium transition-colors duration-200 max-sm:flex max-sm:min-h-[44px] max-sm:items-center max-sm:justify-center ${
                    cycleIdx === i
                      ? 'border-white/30 bg-white/[0.08] text-white'
                      : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:border-white/[0.16] hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Assumptions disclosure */}
        <button
          type="button"
          onClick={() => setShowAssumptions((v) => !v)}
          className="mt-7 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 transition hover:text-slate-300"
        >
          {showAssumptions ? '− Hide assumptions' : '+ Show assumptions'}
        </button>
        {showAssumptions ? (
          <ul className="mt-3 space-y-1.5 text-[12px] leading-relaxed text-slate-500">
            <li>· Loaded rate ${RATE}/hr (mid-market compliance analyst).</li>
            <li>· Audit prep: {MANUAL.auditPrepPerCycle} h/cycle manual → {FORMA.auditPrepPerCycle} h with FormaOS, per site.</li>
            <li>· Ongoing evidence + credential ops: {MANUAL.opsPerSiteMonth} h/site/month manual → {FORMA.opsPerSiteMonth} h with FormaOS.</li>
            <li>· Plan cost from the real catalog for the matching tier.</li>
          </ul>
        ) : null}
      </div>

      {/* Live readout */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.03] p-7">
        <span className="pointer-events-none absolute inset-y-7 left-0 w-px bg-gradient-to-b from-white/50 via-white/15 to-transparent" />
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Modelled annual impact
        </p>

        <motion.div
          key={`${siteIdx}-${cycleIdx}`}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : 0.28 }}
          className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5"
        >
          <div>
            <div className="font-display text-3xl font-bold tracking-tight text-white">
              {fmtHrs(result.savedHrs)}
            </div>
            <div className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-slate-500">
              hours reclaimed / year
            </div>
          </div>
          <div>
            <div className="font-display text-3xl font-bold tracking-tight text-emerald-400/90">
              {fmtUsd(result.savedUsd)}
            </div>
            <div className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-slate-500">
              manual labour avoided
            </div>
          </div>
        </motion.div>

        {/* Comparison bar */}
        <div className="mt-7 space-y-3 border-t border-white/[0.08] pt-6">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[12px]">
              <span className="text-slate-400">Compliance run manually</span>
              <span className="font-mono tabular-nums text-slate-300">{fmtUsdFull(result.manualCost)}/yr</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full bg-slate-500/70" style={{ width: '100%' }} />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[12px]">
              <span className="text-slate-400">
                With FormaOS{' '}
                <span className="text-slate-600">({result.planName} + residual hours)</span>
              </span>
              <span className="font-mono tabular-nums text-white">{fmtUsdFull(result.formaCost)}/yr</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                className="h-full rounded-full bg-white/70"
                initial={false}
                animate={{ width: `${result.formaPct}%` }}
                transition={{ duration: reduce ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          </div>
        </div>

        {/* Footline */}
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/[0.08] pt-5 text-[13px]">
          <span className="text-slate-300">
            <span className="font-semibold text-white">~{result.roi.toFixed(1)}×</span> cheaper to operate
          </span>
          <span className="text-slate-300">
            Pays for itself in{' '}
            <span className="font-semibold text-white">
              {result.paybackWeeks < 1 ? '<1' : Math.round(result.paybackWeeks)} week
              {Math.round(result.paybackWeeks) === 1 ? '' : 's'}
            </span>
          </span>
        </div>

        <Link
          href="/contact?type=compliance-plan&source=pricing_roi"
          onClick={() =>
            trackCtaClick({
              surface: 'pricing',
              section: 'roi_calculator',
              location: 'readout',
              ctaLabel: 'Get a scoped plan',
              ctaHref: '/contact?type=compliance-plan&source=pricing_roi',
              variant: 'plan',
            })
          }
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
        >
          Get a scoped plan
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
        <p className="mt-3 text-center text-[11px] text-slate-500">
          Illustrative model · adjust the inputs to your operation.
        </p>
      </div>
    </div>
  );
}
