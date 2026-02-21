'use client';

import { useMemo } from 'react';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { useControlPlaneRuntime } from '@/lib/control-plane/runtime-client';

export function RuntimeOpsGuard({
  surface,
}: {
  surface: 'app' | 'marketing';
}) {
  const { snapshot } = useControlPlaneRuntime();

  const flags = useMemo(() => {
    if (!snapshot) {
      return {
        maintenanceMode: false,
        readOnlyMode: false,
        emergencyLockdown: false,
      };
    }

    return {
      maintenanceMode: snapshot.ops.maintenanceMode,
      readOnlyMode: snapshot.ops.readOnlyMode,
      emergencyLockdown: snapshot.ops.emergencyLockdown,
    };
  }, [snapshot]);

  if (!flags.maintenanceMode && !flags.readOnlyMode && !flags.emergencyLockdown) {
    return null;
  }

  return (
    <>
      <div className="sticky top-0 z-[90] border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-100 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>
            {flags.emergencyLockdown
              ? 'Emergency lock-down is active. Non-admin activity is restricted.'
              : flags.maintenanceMode
                ? 'Maintenance mode is active. Some surfaces may be temporarily limited.'
                : 'Read-only mode is active. Mutating actions are blocked for safety.'}
          </span>
          <span className="ml-auto rounded border border-amber-500/40 px-1.5 py-0.5 uppercase tracking-wider text-[10px]">
            {surface}
          </span>
        </div>
      </div>

      {flags.emergencyLockdown && surface === 'marketing' ? (
        <div className="pointer-events-none fixed inset-0 z-[95] bg-slate-950/60 backdrop-blur-[2px]">
          <div className="pointer-events-auto fixed left-1/2 top-24 w-[min(92vw,640px)] -translate-x-1/2 rounded-xl border border-rose-500/40 bg-slate-950/95 p-5 text-rose-100 shadow-2xl">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="h-4 w-4" />
              Emergency Lock-down Enabled
            </div>
            <p className="text-xs text-rose-100/90">
              Customer-facing writes and sensitive workflows are disabled while incident controls run.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
