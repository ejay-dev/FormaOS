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
  const [data, setData] = useState<IntelligenceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchIntelligence();
    // Refresh every 2 minutes
    const interval = setInterval(fetchIntelligence, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchIntelligence = async () => {
    try {
      const response = await fetch('/api/intelligence/summary');
      if (!response.ok) throw new Error('Failed to fetch');
      const json = await response.json();
      setData(json);
      setError(null);
    } catch (err) {
      console.error('Intelligence fetch error:', err);
      setError('Unable to load intelligence data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-cyan-500/5 p-6 backdrop-blur-sm">
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

  if (error || !data) {
    return null; // Silent fail - don't block dashboard
  }

  const scoreHistory = data.complianceScore.history.map((h) => h.score);

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/5 via-blue-500/5 to-cyan-500/5 p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            <Sparkles className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Compliance Intelligence</h3>
            <p className="text-xs text-gray-400">Real-time insights powered by automation</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-400">
          <div className="h-2 w-2 animate-pulse rounded-full bg-purple-400" />
          Live
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

      {/* AI Insight */}
      <div className="mt-4 rounded-xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10 p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Sparkles className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h4 className="mb-1 text-sm font-semibold text-white">AI Insight</h4>
            <p className="text-sm leading-relaxed text-gray-300">
              {data.complianceScore.trend > 0
                ? `Your compliance score improved by ${data.complianceScore.trend}% this period. `
                : data.complianceScore.trend < 0
                  ? `Compliance score decreased ${Math.abs(data.complianceScore.trend)}%. Review failed controls. `
                  : 'Compliance score is stable. '}
              {data.automation.successRate >= 90
                ? 'Automation is performing excellently.'
                : data.automation.successRate >= 70
                  ? 'Automation performance is good but could be optimized.'
                  : 'Consider reviewing automation configurations.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
