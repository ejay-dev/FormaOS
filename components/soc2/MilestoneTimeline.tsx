'use client';

import { Check, Clock, Circle, XCircle } from 'lucide-react';
import type { Soc2Milestone } from '@/lib/soc2/types';

interface MilestoneTimelineProps {
  milestones: Soc2Milestone[];
}

const STATUS_ICON = {
  completed: { icon: Check, ringColor: 'border-emerald-400 bg-emerald-400/20', iconColor: 'text-emerald-400' },
  in_progress: { icon: Clock, ringColor: 'border-amber-400 bg-amber-400/20', iconColor: 'text-amber-400' },
  pending: { icon: Circle, ringColor: 'border-slate-600 bg-slate-600/20', iconColor: 'text-slate-500' },
  blocked: { icon: XCircle, ringColor: 'border-rose-400 bg-rose-400/20', iconColor: 'text-rose-400' },
} as const;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  const sorted = [...milestones].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-lg font-semibold text-slate-100">Certification Milestones</h3>
      <p className="mt-1 text-xs text-slate-500">Track your progress toward SOC 2 certification.</p>

      <div className="mt-6 space-y-0">
        {sorted.map((milestone, idx) => {
          const cfg = STATUS_ICON[milestone.status];
          const Icon = cfg.icon;
          const isLast = idx === sorted.length - 1;

          return (
            <div key={milestone.id} className="relative flex gap-4">
              {/* Vertical line + dot */}
              <div className="flex flex-col items-center">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${cfg.ringColor}`}>
                  <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
                </div>
                {!isLast && (
                  <div className="w-px flex-1 bg-white/10" />
                )}
              </div>

              {/* Content */}
              <div className={`pb-6 ${isLast ? 'pb-0' : ''}`}>
                <div className="text-sm font-semibold text-slate-200">{milestone.title}</div>
                {milestone.description && (
                  <div className="mt-0.5 text-xs text-slate-500">{milestone.description}</div>
                )}
                <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                  {milestone.completedAt && (
                    <span className="text-emerald-400">Completed {formatDate(milestone.completedAt)}</span>
                  )}
                  {milestone.targetDate && !milestone.completedAt && (
                    <span>Target: {formatDate(milestone.targetDate)}</span>
                  )}
                  <span className="capitalize">{milestone.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
