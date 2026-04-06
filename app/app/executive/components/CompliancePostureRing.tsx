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
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 animate-pulse">
        <div className="w-48 h-48 rounded-full bg-glass-strong" />
        <div className="mt-4 h-6 w-32 rounded bg-glass-strong" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Main Ring */}
      <div className="relative">
        <svg className="transform -rotate-90 w-32 h-32">
          <circle cx="64" cy="64" r="52" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-border" />
          <circle cx="64" cy="64" r="52" stroke="currentColor" strokeWidth="8" fill="transparent"
            strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 - (score / 100) * 2 * Math.PI * 52}
            strokeLinecap="round" className={`${colors.ring} transition-all duration-1000 ease-out`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${colors.ring}`}>{Math.round(score)}%</span>
          <span className="text-[10px] text-muted-foreground">Compliance</span>
        </div>
      </div>

      {/* Status + Trend inline */}
      <div className="mt-3 flex items-center gap-2">
        <span className={`status-pill ${score >= 80 ? 'status-pill-green' : score >= 50 ? 'status-pill-amber' : 'status-pill-red'}`}>
          {getStatusLabel(score)}
        </span>
        <div className="flex items-center gap-1">
          <TrendIcon className={`h-3 w-3 ${trendColor}`} />
          <span className={`text-xs ${trendColor}`}>
            {trend === 'stable' ? 'Stable' : `${trendPercentage}%`}
          </span>
        </div>
      </div>
      <div className="mt-1 text-[10px] text-muted-foreground/60 font-mono">
        Previous: {previousScore}%
      </div>
    </div>
  );
}
