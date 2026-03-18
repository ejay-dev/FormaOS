'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CompliancePostureRingProps {
  score: number;
  previousScore: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
  isLoading?: boolean;
}

export function CompliancePostureRing({
  score,
  previousScore,
  trend,
  trendPercentage,
  isLoading = false,
}: CompliancePostureRingProps) {
  // Color logic based on score
  const getColor = (s: number) => {
    if (s >= 80) return { ring: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    if (s >= 60) return { ring: 'text-sky-500', bg: 'bg-sky-500/10' };
    if (s >= 40) return { ring: 'text-amber-500', bg: 'bg-amber-500/10' };
    return { ring: 'text-red-500', bg: 'bg-red-500/10' };
  };

  const getStatusLabel = (s: number) => {
    if (s >= 80) return 'Audit Ready';
    if (s >= 60) return 'Good Progress';
    if (s >= 40) return 'Needs Attention';
    return 'Critical';
  };

  const colors = getColor(score);
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (score / 100) * circumference;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 animate-pulse">
        <div className="w-48 h-48 rounded-full bg-white/10" />
        <div className="mt-4 h-6 w-32 rounded bg-white/10" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8">
      {/* Main Ring */}
      <div className="relative">
        <svg className="transform -rotate-90 w-48 h-48">
          {/* Background Circle */}
          <circle
            cx="96"
            cy="96"
            r="70"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            className="text-white/10"
          />
          {/* Progress Circle */}
          <circle
            cx="96"
            cy="96"
            r="70"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${colors.ring} transition-all duration-1000 ease-out`}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-black ${colors.ring}`}>{Math.round(score)}%</span>
          <span className="text-sm font-semibold text-slate-400 mt-1">Compliance</span>
        </div>
      </div>

      {/* Status Label */}
      <div className={`mt-6 px-4 py-2 rounded-full ${colors.bg}`}>
        <span className={`text-sm font-bold ${colors.ring}`}>{getStatusLabel(score)}</span>
      </div>

      {/* Trend Indicator */}
      <div className="mt-4 flex items-center gap-2">
        <TrendIcon className={`h-4 w-4 ${trendColor}`} />
        <span className={`text-sm font-medium ${trendColor}`}>
          {trend === 'stable' ? 'Stable' : `${trendPercentage}% ${trend === 'up' ? 'increase' : 'decrease'}`}
        </span>
        <span className="text-xs text-slate-500">vs 30 days ago</span>
      </div>

      {/* Previous Score */}
      <div className="mt-2 text-xs text-slate-500">
        Previous: {previousScore}%
      </div>
    </div>
  );
}
