'use client';

import { Target, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import type { AuditReadinessForecast, AuditBlocker } from '@/lib/executive/types';

interface AuditReadinessGaugeProps {
  forecast: AuditReadinessForecast;
  isLoading?: boolean;
}

export function AuditReadinessGauge({ forecast, isLoading = false }: AuditReadinessGaugeProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
        <div className="h-5 w-40 rounded bg-white/10 mb-6" />
        <div className="h-32 rounded-xl bg-white/10" />
      </div>
    );
  }

  const progressToTarget = Math.round((forecast.readinessScore / forecast.targetScore) * 100);
  const isReady = forecast.readinessScore >= forecast.targetScore;

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))] p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
          <Target className="h-4 w-4 text-sky-300" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Audit Readiness</h3>
          <p className="text-xs text-slate-400">Target: {forecast.targetScore}% compliance</p>
        </div>
      </div>

      {/* Progress Gauge */}
      <div className="relative h-4 w-full rounded-full bg-white/10 mb-4">
        <div
          className={`h-4 rounded-full transition-all duration-500 ${
            isReady ? 'bg-emerald-500' : forecast.readinessScore >= 60 ? 'bg-sky-500' : 'bg-amber-500'
          }`}
          style={{ width: `${Math.min(100, progressToTarget)}%` }}
        />
        {/* Target marker */}
        <div
          className="absolute top-0 h-4 w-1 bg-white/50"
          style={{ left: '100%', transform: 'translateX(-100%)' }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <TrendingUp className="h-3 w-3" />
            Current Score
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">
            {forecast.readinessScore}%
          </div>
        </div>

        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            Time to Ready
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">
            {isReady ? (
              <span className="text-emerald-400">Ready</span>
            ) : forecast.weeksTillReady !== null ? (
              `${forecast.weeksTillReady} weeks`
            ) : (
              <span className="text-amber-400">TBD</span>
            )}
          </div>
        </div>
      </div>

      {/* Improvement Rate */}
      <div className="text-xs text-slate-400 mb-4">
        Improvement rate:{' '}
        <span className={forecast.improvementRate > 0 ? 'text-emerald-400' : 'text-amber-400'}>
          {forecast.improvementRate > 0 ? '+' : ''}
          {forecast.improvementRate}% per day
        </span>
      </div>

      {/* Blockers */}
      {forecast.blockers.length > 0 && (
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            <span>Blocking Issues ({forecast.blockers.length})</span>
          </div>
          <div className="space-y-2">
            {forecast.blockers.slice(0, 3).map((blocker, index) => (
              <BlockerRow key={index} blocker={blocker} />
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {forecast.recommendations.length > 0 && (
        <div className="border-t border-white/10 pt-4 mt-4">
          <div className="text-xs text-slate-400 mb-2">Recommendations</div>
          <ul className="space-y-1">
            {forecast.recommendations.map((rec, index) => (
              <li key={index} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-sky-400 shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BlockerRow({ blocker }: { blocker: AuditBlocker }) {
  const priorityColors = {
    critical: 'text-red-400 border-red-500/30',
    high: 'text-amber-400 border-amber-500/30',
    medium: 'text-yellow-400 border-yellow-500/30',
  };

  return (
    <div className="flex items-start gap-2 p-2 rounded-lg bg-white/5">
      <span
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${priorityColors[blocker.priority]}`}
      >
        {blocker.priority.toUpperCase()}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-200 line-clamp-1">
          {blocker.controlCode}: {blocker.controlTitle}
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">{blocker.reason}</div>
      </div>
    </div>
  );
}
