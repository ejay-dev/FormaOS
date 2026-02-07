'use client';

import { AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react';
import type { CriticalControl } from '@/lib/executive/types';
import Link from 'next/link';

interface CriticalControlsTableProps {
  controls: CriticalControl[];
  isLoading?: boolean;
}

export function CriticalControlsTable({
  controls,
  isLoading = false,
}: CriticalControlsTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
        <div className="h-5 w-40 rounded bg-white/10 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  if (controls.length === 0) {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
        <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
        <p className="text-slate-200 font-medium">No Critical Gaps</p>
        <p className="text-sm text-slate-400 mt-1">
          All controls are at acceptable compliance levels.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Critical Control Gaps</h3>
          <p className="text-xs text-slate-400">{controls.length} controls require attention</p>
        </div>
      </div>

      <div className="space-y-3">
        {controls.map((control) => (
          <ControlRow key={control.id} control={control} />
        ))}
      </div>
    </div>
  );
}

function ControlRow({ control }: { control: CriticalControl }) {
  const statusColors = {
    critical: 'bg-red-500/10 border-red-500/30 text-red-400',
    high: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  };

  const statusLabels = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
  };

  return (
    <div className="group rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">{control.controlCode}</span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[control.status]}`}
            >
              {statusLabels[control.status]}
            </span>
          </div>
          <p className="text-sm text-slate-200 mt-1 line-clamp-1">{control.title}</p>
          <p className="text-xs text-slate-500 mt-1">{control.framework}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-slate-400">Evidence</div>
            <div className="text-sm font-medium text-slate-200">
              {control.evidenceCount}/{control.requiredEvidence}
            </div>
          </div>

          <Link
            href={`/app/compliance?control=${control.controlCode}`}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
          >
            <ExternalLink className="h-4 w-4 text-slate-400" />
          </Link>
        </div>
      </div>

      {control.gapDescription && (
        <p className="text-xs text-slate-400 mt-2 line-clamp-2 bg-white/5 p-2 rounded">
          {control.gapDescription}
        </p>
      )}
    </div>
  );
}
