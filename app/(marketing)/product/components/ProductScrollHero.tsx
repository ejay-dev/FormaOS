'use client';

import {
  BarChart3,
  CheckCircle,
  FileCheck,
  ShieldCheck,
  Sparkles,
  Workflow,
} from 'lucide-react';
import { ImmersiveHero } from '@/components/motion/ImmersiveHero';
import { InteractiveGlobe } from '@/components/marketing/InteractiveGlobe';

const OUTCOME_METRICS = [
  {
    label: 'Live Control Coverage',
    value: '147 controls',
    trend: '+12 this quarter',
  },
  {
    label: 'Evidence Continuity',
    value: '99.98%',
    trend: 'Chain verified',
  },
  {
    label: 'Audit Packet Delivery',
    value: '94 sec',
    trend: 'P95 export time',
  },
] as const;

const CAPABILITIES = [
  {
    icon: ShieldCheck,
    title: 'System-Enforced Controls',
    detail: 'Convert obligations into enforceable workflows with named ownership.',
  },
  {
    icon: FileCheck,
    title: 'Defensible Evidence Chain',
    detail: 'Capture immutable artifacts with actor attribution and approval lineage.',
  },
  {
    icon: BarChart3,
    title: 'Executive Readiness Reporting',
    detail: 'Give leadership always-current posture, findings, and board-ready packets.',
  },
] as const;

const WORKFLOW_STAGES = [
  {
    stage: 'Detect Drift',
    owner: 'Control Ops',
    sla: '9 min',
    status: 'Stable',
  },
  {
    stage: 'Assign & Escalate',
    owner: 'Risk Lead',
    sla: '14 min',
    status: 'Healthy',
  },
  {
    stage: 'Verify Resolution',
    owner: 'Assurance',
    sla: '31 min',
    status: 'Tracked',
  },
  {
    stage: 'Export Audit Packet',
    owner: 'Reporting',
    sla: '94 sec',
    status: 'Ready',
  },
] as const;

const FRAMEWORKS = ['SOC 2', 'ISO 27001', 'HIPAA', 'GDPR', 'NDIS'] as const;

function ProductHeroGlobeVisual() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 hidden lg:block"
    >
      <div className="pointer-events-auto absolute right-[clamp(0.75rem,3.4vw,3.75rem)] top-[58%] -translate-y-1/2">
        <div className="relative h-[360px] w-[360px] xl:h-[460px] xl:w-[460px]">
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.12)_0%,rgba(14,165,233,0.03)_48%,transparent_74%)]" />
          <InteractiveGlobe
            size={460}
            className="h-full w-full opacity-75"
            autoRotateSpeed={0.0018}
            dotColor="rgba(130, 190, 255, ALPHA)"
            arcColor="rgba(82, 227, 255, 0.32)"
            markerColor="rgba(125, 245, 255, 0.92)"
          />
        </div>
      </div>
    </div>
  );
}

function ProductHeroExtras() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-3.5">
      <div className="grid gap-2.5 sm:grid-cols-3">
        {OUTCOME_METRICS.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-white/[0.1] bg-slate-950/55 px-3.5 py-3 text-left"
          >
            <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{metric.label}</p>
            <p className="mt-1 text-sm font-semibold text-white">{metric.value}</p>
            <p className="mt-1 text-[11px] text-emerald-300">{metric.trend}</p>
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
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-400/10">
                <Icon className="h-4 w-4 text-cyan-300" />
              </div>
              <p className="text-sm font-semibold text-white">{capability.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">{capability.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/[0.1] bg-slate-950/55 p-3.5">
        <div className="mb-3 flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <Workflow className="h-4 w-4 text-cyan-300" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
            Governance Workflow Snapshot
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {WORKFLOW_STAGES.map((stage) => (
            <div
              key={stage.stage}
              className="grid grid-cols-[1fr_auto] gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2"
            >
              <div>
                <p className="text-xs font-semibold text-white">{stage.stage}</p>
                <p className="text-[11px] text-slate-400">{stage.owner}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-cyan-300">{stage.sla}</p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-emerald-300">{stage.status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3">
        <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">
          {FRAMEWORKS.map((framework) => (
            <span
              key={framework}
              className="inline-flex items-center gap-1"
            >
              <CheckCircle className="h-3 w-3 text-emerald-300/80" />
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
      visualContent={<ProductHeroGlobeVisual />}
      visualInteractive
      badge={{
        icon: <Sparkles className="h-4 w-4 text-violet-300" />,
        text: 'Compliance Operating System',
        colorClass: 'violet',
      }}
      headline={
        <>
          Run Compliance Like
          <br />
          <span className="bg-gradient-to-r from-violet-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
            Mission-Critical Operations
          </span>
        </>
      }
      subheadline="FormaOS turns obligations into governed execution loops with owned evidence, real-time posture visibility, and audit packets leadership can defend."
      extras={<ProductHeroExtras />}
      primaryCta={{ href: '/auth/signup', label: 'Start Free Trial' }}
      secondaryCta={{ href: '/contact', label: 'Request Demo' }}
    />
  );
}

export default ProductScrollHero;
