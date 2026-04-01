'use client';

import { Activity, Wifi, WifiOff } from 'lucide-react';
import { useControlPlaneRuntime } from '@/lib/control-plane/runtime-client';

function formatDate(value: string | null) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleTimeString();
}

export function RuntimeDebugIndicator() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const {
    snapshot,
    streamConnected,
    streamStatus,
    lastStreamEventAt,
    lastHeartbeatAt,
  } = useControlPlaneRuntime();

  return (
    <div className="fixed bottom-3 right-3 z-[var(--z-debug)] w-64 rounded-lg border border-slate-700 bg-slate-950/90 p-3 text-[11px] text-foreground/90 shadow-xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-1 font-semibold text-foreground">
          <Activity className="h-3.5 w-3.5" />
          Runtime Debug
        </div>
        <div className="flex items-center gap-1 text-xs">
          {streamConnected ? (
            <Wifi className="h-3 w-3 text-emerald-300" />
          ) : (
            <WifiOff className="h-3 w-3 text-rose-300" />
          )}
          <span>{streamStatus}</span>
        </div>
      </div>

      <div className="space-y-1 text-foreground/70">
        <div className="flex items-center justify-between">
          <span>last_update</span>
          <span>{formatDate(snapshot?.lastUpdateAt ?? null)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>last_stream</span>
          <span>{formatDate(lastStreamEventAt)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>heartbeat</span>
          <span>{formatDate(lastHeartbeatAt)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>evaluated_mode</span>
          <span>{snapshot?.evaluationMode ?? 'global'}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>stream_version</span>
          <span className="truncate pl-2 text-right text-xs text-muted-foreground">
            {snapshot?.streamVersion ?? 'n/a'}
          </span>
        </div>
      </div>
    </div>
  );
}
