'use client';

import { FileText, CheckSquare, Shield, Lock, BarChart3 } from 'lucide-react';

/**
 * DemoComplianceChain — the FormaOS compliance lifecycle:
 * Obligation → Control → Task → Evidence → Audit.
 *
 * Rendered as a calm, static, monochrome process list. This replaced an
 * auto-cycling "live demo" HUD (teal/emerald/amber chips, fake personas
 * like "Owner: Min Park", fabricated due-dates, SHA-256 / "100% evidenced"
 * meta, and a green "Complete" badge) that read as vibe-coded and clashed
 * with the enterprise sections around it. Used on the homepage, /pricing,
 * and /our-story; the /product page renders its own inline variant.
 */

interface ChainStep {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  detail: string;
}

const defaultSteps: ChainStep[] = [
  {
    id: 'obligation',
    label: 'Obligation',
    icon: FileText,
    detail: 'Framework requirements mapped to controls',
  },
  {
    id: 'control',
    label: 'Control',
    icon: Shield,
    detail: 'Ownership and review cadence assigned',
  },
  {
    id: 'task',
    label: 'Task',
    icon: CheckSquare,
    detail: 'Work routed to the accountable owner',
  },
  {
    id: 'evidence',
    label: 'Evidence',
    icon: Lock,
    detail: 'Artifacts linked and sealed to the control',
  },
  {
    id: 'audit',
    label: 'Audit',
    icon: BarChart3,
    detail: 'Complete, exportable compliance trail',
  },
];

interface DemoComplianceChainProps {
  steps?: ChainStep[];
  /** Subtle monochrome edge glow; varies per surface. */
  glowColor?: string;
  /** Retained for call-site compatibility; the list no longer animates. */
  stepDuration?: number;
}

export default function DemoComplianceChain({
  steps = defaultSteps,
  glowColor = 'from-white/[0.05] to-white/[0.02]',
}: DemoComplianceChainProps) {
  return (
    <div className="relative">
      <div
        className={`absolute -inset-px rounded-2xl bg-gradient-to-b ${glowColor} blur-sm`}
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Compliance lifecycle
        </p>

        <ol>
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;
            return (
              <li key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
                {!isLast && (
                  <span
                    aria-hidden
                    className="absolute left-[21px] top-11 bottom-0 w-px bg-white/[0.08]"
                  />
                )}
                <div className="relative z-10 inline-flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.05]">
                  <Icon className="h-5 w-5 text-slate-300" />
                </div>
                <div className="pt-1">
                  <p className="text-sm font-semibold text-white">
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-snug text-slate-400">
                    {step.detail}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
