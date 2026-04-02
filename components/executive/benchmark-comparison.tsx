'use client';

import { TrendingUp, Award, AlertTriangle } from 'lucide-react';

interface BenchmarkData {
  industry: string;
  framework: string;
  averageScore: number;
  topQuartileScore: number;
  commonGaps: string[];
}

interface BenchmarkComparisonProps {
  orgScore: number;
  benchmark: BenchmarkData;
}

export function BenchmarkComparison({
  orgScore,
  benchmark,
}: BenchmarkComparisonProps) {
  const isAboveAvg = orgScore >= benchmark.averageScore;
  const isTopQuartile = orgScore >= benchmark.topQuartileScore;

  const positionPct = Math.min(100, Math.max(0, (orgScore / 100) * 100));
  const avgPct = (benchmark.averageScore / 100) * 100;
  const topPct = (benchmark.topQuartileScore / 100) * 100;

  return (
    <div
      className="border border-border rounded-lg p-5 bg-card"
      data-testid="benchmark-comparison"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium">
            {benchmark.framework} Benchmark
          </h3>
          <p className="text-xs text-muted-foreground">
            {benchmark.industry} industry
          </p>
        </div>
        {isTopQuartile ? (
          <div className="flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
            <Award className="h-4 w-4" /> Top 25%
          </div>
        ) : isAboveAvg ? (
          <div className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400">
            <TrendingUp className="h-4 w-4" /> Above Average
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-sm text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="h-4 w-4" /> Below Average
          </div>
        )}
      </div>

      {/* Score Gauge */}
      <div className="relative h-6 rounded-full bg-muted mb-2 overflow-hidden">
        {/* Average marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-yellow-500 z-10"
          style={{ left: `${avgPct}%` }}
          title={`Industry avg: ${benchmark.averageScore}%`}
        />
        {/* Top quartile marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-green-500 z-10"
          style={{ left: `${topPct}%` }}
          title={`Top 25%: ${benchmark.topQuartileScore}%`}
        />
        {/* Org score bar */}
        <div
          className={`h-full rounded-full ${
            isTopQuartile
              ? 'bg-green-500'
              : isAboveAvg
                ? 'bg-blue-500'
                : 'bg-yellow-500'
          }`}
          style={{ width: `${positionPct}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground mb-4">
        <span>0%</span>
        <span>Avg: {benchmark.averageScore}%</span>
        <span>Top 25%: {benchmark.topQuartileScore}%</span>
        <span>100%</span>
      </div>

      {/* Position Message */}
      <p className="text-sm mb-4">
        {isTopQuartile ? (
          <span className="text-green-600 dark:text-green-400 font-medium">
            You're in the top 25% of {benchmark.industry} providers! Your score
            of {orgScore}% exceeds the top quartile threshold of{' '}
            {benchmark.topQuartileScore}%.
          </span>
        ) : isAboveAvg ? (
          <span className="text-blue-600 dark:text-blue-400">
            You're above the {benchmark.industry} average (
            {benchmark.averageScore}%). {benchmark.topQuartileScore - orgScore}{' '}
            more points to reach the top 25%.
          </span>
        ) : (
          <span className="text-yellow-600 dark:text-yellow-400">
            You're {benchmark.averageScore - orgScore} points behind the{' '}
            {benchmark.industry} average. Focus on gap remediation to improve.
          </span>
        )}
      </p>

      {/* Common gaps */}
      {!isTopQuartile && benchmark.commonGaps.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Common industry gaps to address:
          </p>
          <ul className="text-xs text-muted-foreground space-y-0.5">
            {benchmark.commonGaps.map((gap) => (
              <li key={gap} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-muted-foreground shrink-0" />{' '}
                {gap}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
