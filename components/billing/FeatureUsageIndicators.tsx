'use client';

import {
  useFeatureUsage,
  type FeatureUsageItem,
} from '@/lib/trial/use-feature-usage';
import { useTrialState } from '@/lib/trial/use-trial-state';
import { TrendingUp, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * =========================================================
 * FeatureUsageIndicators – Dashboard usage progress bars
 * =========================================================
 * Shows real-time feature usage vs plan limits.
 * Only visible for trial users (nudges toward upgrade).
 * Non-blocking — loads async after page paint.
 */
export function FeatureUsageIndicators() {
  const { isTrialUser, isExpired } = useTrialState();
  const { usage, isLoading, error, hasHighUsage } = useFeatureUsage();

  // Only show for trial or recently expired
  if (!isTrialUser && !isExpired) return null;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading usage data...
        </div>
      </div>
    );
  }

  if (error) return null; // Silent fail — non-critical

  const limitedItems = usage.filter((u) => u.limit !== -1);
  if (limitedItems.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-sky-400" />
          <h3 className="text-sm font-semibold text-slate-200">
            Feature Usage
          </h3>
        </div>
        {hasHighUsage && (
          <span className="text-[10px] font-medium text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded-full">
            Nearing limits
          </span>
        )}
      </div>

      <div className="space-y-3">
        {limitedItems.map((item) => (
          <UsageBar key={item.key} item={item} />
        ))}
      </div>
    </div>
  );
}

function UsageBar({ item }: { item: FeatureUsageItem }) {
  const statusColors = {
    ok: { bar: 'bg-sky-400', text: 'text-slate-400' },
    nudge: { bar: 'bg-amber-400', text: 'text-amber-300' },
    warning: { bar: 'bg-orange-400', text: 'text-orange-300' },
    exceeded: { bar: 'bg-rose-400', text: 'text-rose-300' },
  };

  const colors = statusColors[item.status];

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-300 font-medium">{item.label}</span>
        <span className={`tabular-nums ${colors.text}`}>
          {item.current}
          {item.limit !== -1 && ` / ${item.limit}`}
          {item.status === 'exceeded' && (
            <AlertCircle className="inline ml-1 h-3 w-3" />
          )}
          {item.status === 'ok' && item.limit !== -1 && (
            <CheckCircle2 className="inline ml-1 h-3 w-3 text-emerald-400" />
          )}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
          style={{ width: `${item.percentage}%` }}
        />
      </div>
    </div>
  );
}
