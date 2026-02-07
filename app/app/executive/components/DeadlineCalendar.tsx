'use client';

import { Calendar, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import type { ComplianceDeadline } from '@/lib/executive/types';

interface DeadlineCalendarProps {
  deadlines: ComplianceDeadline[];
  isLoading?: boolean;
}

export function DeadlineCalendar({ deadlines, isLoading = false }: DeadlineCalendarProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
        <div className="h-5 w-40 rounded bg-white/10 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-lg bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
        <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
        <p className="text-slate-200 font-medium">No Upcoming Deadlines</p>
        <p className="text-sm text-slate-400 mt-1">
          All compliance deadlines are clear for the next 90 days.
        </p>
      </div>
    );
  }

  // Group deadlines by status
  const overdue = deadlines.filter((d) => d.status === 'overdue');
  const dueSoon = deadlines.filter((d) => d.status === 'due_soon');
  const upcoming = deadlines.filter((d) => d.status === 'upcoming');

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <Calendar className="h-4 w-4 text-sky-300" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Compliance Deadlines</h3>
          <p className="text-xs text-slate-400">{deadlines.length} upcoming</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className={`rounded-lg p-2 text-center ${overdue.length > 0 ? 'bg-red-500/10' : 'bg-white/5'}`}>
          <div className={`text-lg font-bold ${overdue.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            {overdue.length}
          </div>
          <div className="text-[10px] text-slate-400 uppercase">Overdue</div>
        </div>
        <div className={`rounded-lg p-2 text-center ${dueSoon.length > 0 ? 'bg-amber-500/10' : 'bg-white/5'}`}>
          <div className={`text-lg font-bold ${dueSoon.length > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {dueSoon.length}
          </div>
          <div className="text-[10px] text-slate-400 uppercase">Due Soon</div>
        </div>
        <div className="rounded-lg bg-white/5 p-2 text-center">
          <div className="text-lg font-bold text-slate-300">{upcoming.length}</div>
          <div className="text-[10px] text-slate-400 uppercase">Upcoming</div>
        </div>
      </div>

      {/* Deadline List */}
      <div className="space-y-2">
        {/* Overdue first */}
        {overdue.map((deadline) => (
          <DeadlineRow key={deadline.id} deadline={deadline} />
        ))}
        {/* Then due soon */}
        {dueSoon.map((deadline) => (
          <DeadlineRow key={deadline.id} deadline={deadline} />
        ))}
        {/* Then upcoming (limited) */}
        {upcoming.slice(0, 3).map((deadline) => (
          <DeadlineRow key={deadline.id} deadline={deadline} />
        ))}
      </div>

      {upcoming.length > 3 && (
        <p className="text-xs text-slate-500 text-center mt-3">
          +{upcoming.length - 3} more upcoming deadlines
        </p>
      )}
    </div>
  );
}

function DeadlineRow({ deadline }: { deadline: ComplianceDeadline }) {
  const statusConfig = {
    overdue: {
      icon: AlertCircle,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/30',
      label: 'OVERDUE',
    },
    due_soon: {
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/30',
      label: `${deadline.daysRemaining}d`,
    },
    upcoming: {
      icon: Calendar,
      color: 'text-slate-400',
      bg: 'bg-white/5 border-white/10',
      label: `${deadline.daysRemaining}d`,
    },
    completed: {
      icon: CheckCircle,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
      label: 'DONE',
    },
    cancelled: {
      icon: Calendar,
      color: 'text-slate-500',
      bg: 'bg-white/5 border-white/10',
      label: 'CANCELLED',
    },
  };

  const config = statusConfig[deadline.status];
  const Icon = config.icon;

  const typeLabels: Record<string, string> = {
    audit: 'Audit',
    renewal: 'Renewal',
    review: 'Review',
    submission: 'Submission',
    certification: 'Certification',
    other: 'Other',
  };

  return (
    <div className={`rounded-lg border p-3 ${config.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-200 font-medium line-clamp-1">
              {deadline.title}
            </span>
            <span className="text-[10px] text-slate-500 uppercase shrink-0">
              {typeLabels[deadline.type] || deadline.type}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <span>Due: {new Date(deadline.dueDate).toLocaleDateString()}</span>
            {deadline.framework && (
              <>
                <span>·</span>
                <span>{deadline.framework}</span>
              </>
            )}
          </div>
        </div>
        <span className={`text-xs font-bold ${config.color}`}>{config.label}</span>
      </div>
    </div>
  );
}
