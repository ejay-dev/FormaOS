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
      <div className="rounded-2xl border border-edge-2 bg-surface-1 p-6 animate-pulse">
        <div className="h-5 w-40 rounded bg-surface-2 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-surface-2" />
          ))}
        </div>
      </div>
    );
  }

  if (controls.length === 0) {
    return (
      <div className="rounded-2xl border border-success/20 bg-success/10 p-6 text-center">
        <CheckCircle className="h-10 w-10 text-success mx-auto mb-3" />
        <p className="text-foreground/90 font-medium">No Critical Gaps</p>
        <p className="text-sm text-muted-foreground mt-1">
          All controls are at acceptable compliance levels.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-edge-2 bg-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10">
          <AlertTriangle className="h-4 w-4 text-destructive" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">Critical Control Gaps</h3>
          <p className="text-xs text-muted-foreground">{controls.length} controls require attention</p>
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
    critical: 'bg-destructive/10 border-destructive/30 text-destructive',
    high: 'bg-warning/10 border-warning/30 text-warning',
    medium: 'bg-warning/10 border-warning/30 text-warning',
  };

  const statusLabels = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
  };

  return (
    <div className="group rounded-lg border border-edge-2 bg-surface-1 p-4 hover:bg-surface-2 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">{control.controlCode}</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusColors[control.status]}`}
            >
              {statusLabels[control.status]}
            </span>
          </div>
          <p className="text-sm text-foreground/90 mt-1 line-clamp-1">{control.title}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{control.framework}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Evidence</div>
            <div className="text-sm font-medium text-foreground/90">
              {control.evidenceCount}/{control.requiredEvidence}
            </div>
          </div>

          <Link
            href={`/app/compliance?control=${control.controlCode}`}
            className="p-2 rounded-lg border border-edge-2 hover:bg-surface-2 transition-colors"
          >
            <ExternalLink className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {control.gapDescription && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2 bg-surface-1 p-2 rounded">
          {control.gapDescription}
        </p>
      )}
    </div>
  );
}
