'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Shield,
  AlertTriangle,
  Calendar,
  Target,
  Sparkles,
} from 'lucide-react';
import { useFeatureFlag } from '@/lib/feature-flags';

interface IntelligenceData {
  complianceScore: {
    current: number;
    trend: number;
    history: Array<{ date: string; score: number }>;
  };
  automation: {
    totalRuns: number;
    completedRuns: number;
    successRate: number;
    lastRunAt: string | null;
  };
  riskReduction: {
    percentage: number;
    trend: 'improving' | 'worsening' | 'stable';
  };
  tasks: {
    total: number;
    completed: number;
    completionRate: number;
  };
  upcomingDeadlines: Array<{
    title: string;
    dueDate: string;
    status: string;
  }>;
  auditReadiness: {
    score: number;
    trend: 'improving' | 'declining' | 'stable';
  };
}

function MiniSparkline({ data, color = '#10b981' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - ((value - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width="100%" height="32" className="opacity-80">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function TrendIndicator({ value, reverse = false }: { value: number; reverse?: boolean }) {
  if (value === 0) {
    return (
      <div className="flex items-center gap-1 text-gray-400">
        <Minus className="h-4 w-4" />
        <span className="text-sm font-medium">No change</span>
      </div>
    );
  }

  const isPositive = reverse ? value < 0 : value > 0;
  const Icon = isPositive ? TrendingUp : TrendingDown;
  const colorClass = isPositive ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className={`flex items-center gap-1 ${colorClass}`}>
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">
        {Math.abs(value)}% {isPositive ? 'up' : 'down'}
      </span>
    </div>
  );
}

export function ComplianceIntelligenceSummary() {
  const isEnabled = useFeatureFlag('enableIntelligence');
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      setIsLoading(false);
      return;
    }
    fetchIntelligence();
    // Refresh every 2 minutes
    const interval = setInterval(fetchIntelligence, 120000);
    return () => clearInterval(interval);
  }, [isEnabled]);

  const fetchIntelligence = async () => {
    try {
      const response = await fetch('/api/intelligence/summary');

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const code = errorData.code || 'UNKNOWN_ERROR';
        const message = errorData.message || 'Unable to load intelligence data';

        setError({ code, message });
        setData(null);
        setIsLoading(false);
        return;
      }

      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error('Intelligence fetch error:', err);
      setError({ code: 'NETWORK_ERROR', message: 'Unable to connect. Please check your connection.' });
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-cyan-500/5 p-6 backdrop-blur-sm" style={{ minHeight: '400px' }}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 rounded bg-white/10" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="h-24 rounded-xl bg-white/5" />
            <div className="h-24 rounded-xl bg-white/5" />
            <div className="h-24 rounded-xl bg-white/5" />
            <div className="h-24 rounded-xl bg-white/5" />
          </div>
        </div>
      </div>
    );
  }

  if (!isEnabled) {
    return null; // Feature disabled
  }

  // Handle authentication errors with a clean message
  if (error && (error.code === 'AUTH_REQUIRED' || error.code === 'AUTH_ERROR')) {
    return (
      <div
        className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-6 backdrop-blur-sm"
        style={{ minHeight: '120px' }}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Session Expired</h3>
            <p className="mt-1 text-sm text-gray-400">
              Please <a href="/auth/signin" className="text-amber-400 underline hover:text-amber-300">sign in again</a> to view intelligence insights.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle organization errors
  if (error && (error.code === 'NO_ORGANIZATION' || error.code === 'ORG_LOOKUP_ERROR' || error.code === 'ORG_ERROR')) {
    return (
      <div
        className="rounded-2xl border border-red-500/20 bg-gradient-to-br from-red-500/5 to-orange-500/5 p-6 backdrop-blur-sm"
        style={{ minHeight: '120px' }}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <div>
            <h3 className="text-sm font-semibold text-white">Organization Not Found</h3>
            <p className="mt-1 text-sm text-gray-400">
              {error.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Silent fail for other errors - don't block dashboard
  if (error || !data) {
    return null;
  }

  const scoreHistory = data.complianceScore.history.map((h) => h.score);

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-cyan-500/5 p-6 backdrop-blur-sm" style={{ minHeight: '400px' }}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            <Sparkles className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Executive Intelligence Dashboard</h3>
            <p className="text-xs text-gray-400">AI-powered compliance analytics and risk insights</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Compliance Score */}
        <div className="group rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 p-4 transition-all hover:border-emerald-500/30">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Compliance Score
            </span>
            <Shield className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {data.complianceScore.current}%
            </span>
            <TrendIndicator value={data.complianceScore.trend} />
          </div>
          <MiniSparkline data={scoreHistory} color="#10b981" />
        </div>

        {/* Automation Performance */}
        <div className="group rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-4 transition-all hover:border-blue-500/30">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Automation
            </span>
            <Zap className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {data.automation.successRate}%
            </span>
            <span className="text-sm text-gray-400">success rate</span>
          </div>
          <div className="text-xs text-gray-400">
            {data.automation.completedRuns} of {data.automation.totalRuns} runs completed
          </div>
        </div>

        {/* Risk Reduction */}
        <div className="group rounded-xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 transition-all hover:border-amber-500/30">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Risk Reduction
            </span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {data.riskReduction.percentage}%
            </span>
            <span className="text-sm text-gray-400">
              {data.riskReduction.trend === 'improving' ? '↓' : data.riskReduction.trend === 'worsening' ? '↑' : '→'}
            </span>
          </div>
          <div className="text-xs text-gray-400">
            vs. previous period
          </div>
        </div>

        {/* Audit Readiness */}
        <div className="group rounded-xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 transition-all hover:border-purple-500/30">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
              Audit Readiness
            </span>
            <Target className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mb-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white">
              {data.auditReadiness.score}%
            </span>
            <span className="text-sm text-gray-400">
              {data.auditReadiness.trend === 'improving' ? '↑' : data.auditReadiness.trend === 'declining' ? '↓' : '→'}
            </span>
          </div>
          <div className="text-xs text-gray-400">
            {data.tasks.completed} of {data.tasks.total} tasks done
          </div>
        </div>
      </div>

      {/* Upcoming Deadlines */}
      {data.upcomingDeadlines.length > 0 && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-white">Upcoming Deadlines</h4>
          </div>
          <div className="space-y-2">
            {data.upcomingDeadlines.slice(0, 3).map((deadline, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2"
              >
                <span className="text-sm text-gray-300">{deadline.title}</span>
                <span className="text-xs text-gray-400">
                  {new Date(deadline.dueDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Intelligence Narrative */}
      <div className="mt-4 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Sparkles className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h4 className="mb-1 text-sm font-semibold text-white">AI Risk Narrative</h4>
            <p className="text-sm leading-relaxed text-gray-300">
              {(() => {
                const insights: string[] = [];

                // Compliance score insight
                if (data.complianceScore.current === 0 && data.tasks.total === 0) {
                  return 'Not enough data yet. Complete your first compliance task or run automation to see insights.';
                }

                if (data.complianceScore.trend > 0) {
                  insights.push(`Compliance score improved ${data.complianceScore.trend}% to ${data.complianceScore.current}%.`);
                } else if (data.complianceScore.trend < 0) {
                  insights.push(`Compliance score decreased ${Math.abs(data.complianceScore.trend)}% to ${data.complianceScore.current}%.`);
                }

                // Automation insight
                if (data.automation.totalRuns > 0) {
                  insights.push(`${data.automation.completedRuns} of ${data.automation.totalRuns} automation runs completed (${data.automation.successRate}% success).`);
                }

                // Task insight
                if (data.tasks.total > 0) {
                  const pending = data.tasks.total - data.tasks.completed;
                  if (pending > 0) {
                    insights.push(`${pending} task${pending !== 1 ? 's' : ''} pending completion.`);
                  } else {
                    insights.push('All tasks completed.');
                  }
                }

                // Deadlines insight
                if (data.upcomingDeadlines.length > 0) {
                  const nextDeadline = data.upcomingDeadlines[0];
                  const daysUntil = Math.ceil((new Date(nextDeadline.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                  if (daysUntil <= 7) {
                    insights.push(`Next deadline in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}.`);
                  }
                }

                return insights.length > 0 ? insights.join(' ') : 'Monitoring compliance metrics.';
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
