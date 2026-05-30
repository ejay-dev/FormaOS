'use client';

import {
  Shield,
  FileCheck,
  Users,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';

/**
 * DemoComplianceScore — an illustrative compliance-posture panel
 * (overall score + category breakdown).
 *
 * Rendered calm and static. This replaced a vibe-coded version with
 * traffic-light colors (emerald/amber/red), a count-up animation, animated
 * progress bars, and a pulsing "Audit-Ready" badge. Now monochrome and
 * still, to match DemoComplianceChain and the enterprise sections around it.
 * The figures are illustrative sample data, not a product claim.
 */

interface ScoreCategory {
  label: string;
  score: number;
  icon: React.ComponentType<{ className?: string }>;
  items: number;
}

const defaultCategories: ScoreCategory[] = [
  { label: 'Policies', score: 94, icon: BookOpen, items: 32 },
  { label: 'Evidence', score: 87, icon: FileCheck, items: 128 },
  { label: 'Training', score: 91, icon: Users, items: 47 },
  { label: 'Risk Register', score: 78, icon: AlertTriangle, items: 15 },
  { label: 'Controls', score: 96, icon: Shield, items: 64 },
];

interface DemoComplianceScoreProps {
  categories?: ScoreCategory[];
  overallScore?: number;
  /** Subtle monochrome edge glow; varies per surface. */
  glowColor?: string;
  /** Retained for call-site compatibility; the panel is now monochrome. */
  accentColor?: string;
}

export default function DemoComplianceScore({
  categories = defaultCategories,
  overallScore,
  glowColor = 'from-white/[0.04] to-white/[0.02]',
}: DemoComplianceScoreProps) {
  const computedOverall =
    overallScore ??
    Math.round(
      categories.reduce((sum, c) => sum + c.score, 0) / categories.length,
    );
  const totalItems = categories.reduce((sum, c) => sum + c.items, 0);

  return (
    <div className="relative">
      <div
        className={`absolute -inset-px rounded-2xl bg-gradient-to-b ${glowColor} blur-sm`}
      />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 sm:p-6">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
          Compliance score
        </p>

        {/* Overall */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.03] sm:h-20 sm:w-20">
            <span className="text-2xl font-bold text-white sm:text-3xl">
              {computedOverall}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Overall posture</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {totalItems} items across {categories.length} categories
            </p>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="space-y-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.label}>
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-slate-500" />
                    <span className="text-xs text-slate-300">{cat.label}</span>
                    <span className="text-[10px] text-slate-600">
                      ({cat.items})
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-300">
                    {cat.score}%
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-slate-400/70"
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
