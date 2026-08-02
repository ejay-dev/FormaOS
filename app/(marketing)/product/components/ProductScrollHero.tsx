'use client';

import { BarChart3, CheckCircle, FileCheck, ShieldCheck } from 'lucide-react';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { compliancePlanHref, demoHref, PUBLIC_CTA_LABELS } from '@/lib/marketing/cta';
import {
  AUTOMATED_EVALUATOR_COUNT,
  FRAMEWORK_CONTROL_COUNT,
  FRAMEWORK_PACK_COUNT,
  MANUAL_ATTESTATION_COUNT,
} from '@/lib/marketing/claims';

const COVERAGE = [
  {
    label: 'Framework packs',
    value: String(FRAMEWORK_PACK_COUNT),
    detail: 'Installable today, each with its controls already mapped',
  },
  {
    label: 'Mapped controls',
    value: String(FRAMEWORK_CONTROL_COUNT),
    detail: 'Every one carries an owner and an evidence requirement',
  },
  {
    label: 'Checked automatically',
    value: String(AUTOMATED_EVALUATOR_COUNT),
    detail: `Read from your live data; ${MANUAL_ATTESTATION_COUNT} more are tracked as attestations`,
  },
] as const;

const CAPABILITIES = [
  {
    icon: ShieldCheck,
    title: 'System-Enforced Controls',
    detail:
      'Convert obligations into enforceable workflows with named ownership.',
  },
  {
    icon: FileCheck,
    title: 'Defensible Evidence Chain',
    detail:
      'Capture immutable artifacts with actor attribution and approval lineage.',
  },
  {
    icon: BarChart3,
    title: 'Executive Readiness Reporting',
    detail:
      'Give leadership always-current posture, findings, and board-ready packets.',
  },
] as const;

const FRAMEWORKS = ['SOC 2', 'ISO 27001', 'HIPAA', 'GDPR', 'NDIS'] as const;

function ProductHeroExtras() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-3.5">
      <div className="grid gap-2.5 sm:grid-cols-3">
        {COVERAGE.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/[0.1] bg-slate-950/55 px-3.5 py-3 text-left"
          >
            <p className="text-2xl font-semibold leading-none text-white">
              {item.value}
            </p>
            <p className="mt-1.5 text-sm font-semibold text-white">
              {item.label}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {CAPABILITIES.map((capability) => {
          const Icon = capability.icon;
          return (
            <div
              key={capability.title}
              className="rounded-xl border border-white/[0.09] bg-white/[0.03] px-4 py-3.5 text-left"
            >
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.05]">
                <Icon className="h-4 w-4 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-white">
                {capability.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">
                {capability.detail}
              </p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
        <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">
          {FRAMEWORKS.map((framework) => (
            <span key={framework} className="inline-flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-slate-400" />
              {framework}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductScrollHero() {
  return (
    <ImmersiveHero
      theme="product"
      headline={
        <>
          Obligations in.
          <br />
          <span className="text-foreground">
            Enforced work and evidence out.
          </span>
        </>
      }
      subheadline="Frameworks, controls, tasks, and evidence run as one governed workflow, with a named owner on every obligation and an audit trail nobody can quietly edit."
      extras={<ProductHeroExtras />}
      primaryCta={{ href: compliancePlanHref('product_scroll_hero'), label: PUBLIC_CTA_LABELS.compliancePlan }}
      secondaryCta={{ href: demoHref('product_scroll_hero'), label: PUBLIC_CTA_LABELS.bookDemo }}
    />
  );
}

export default ProductScrollHero;
