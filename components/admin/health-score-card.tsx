'use client';

import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface HealthScore {
  overall: number;
  trend: 'up' | 'down' | 'stable';
  factors: {
    login_frequency: number;
    feature_adoption: number;
    compliance_score: number;
    support_tickets: number;
    billing_health: number;
  };
  riskIndicators: string[];
  recommendations: string[];
  lastRecalculated: string;
}

function scoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-destructive';
}

function scoreBg(score: number): string {
  if (score >= 80) return 'bg-success';
  if (score >= 60) return 'bg-warning';
  return 'bg-destructive';
}

const FACTOR_LABELS: Record<string, string> = {
  login_frequency: 'Login Frequency',
  feature_adoption: 'Feature Adoption',
  compliance_score: 'Compliance Score',
  support_tickets: 'Support Health',
  billing_health: 'Billing Health',
};

export function HealthScoreCard({ health }: { health: HealthScore }) {
  const TrendIcon =
    health.trend === 'up'
      ? TrendingUp
      : health.trend === 'down'
        ? TrendingDown
        : Activity;
  const trendColor =
    health.trend === 'up'
      ? 'text-success'
      : health.trend === 'down'
        ? 'text-destructive'
        : 'text-muted-foreground';

  return (
    <div
      className="border border-border rounded-lg p-5 bg-card"
      data-testid="health-score-card"
    >
      {/* Overall Score */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-muted-foreground">Health Score</p>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold ${scoreColor(health.overall)}`}
            >
              {health.overall}
            </span>
            <span className="text-sm text-muted-foreground">/100</span>
            <TrendIcon className={`h-5 w-5 ${trendColor}`} />
          </div>
        </div>
        <div className="h-16 w-16 rounded-full border-4 border-muted flex items-center justify-center relative">
          <svg
            className="absolute inset-0 h-full w-full -rotate-90"
            viewBox="0 0 36 36"
          >
            <circle
              className="text-muted"
              strokeWidth="3"
              stroke="currentColor"
              fill="transparent"
              r="15"
              cx="18"
              cy="18"
            />
            <circle
              className={scoreColor(health.overall)}
              strokeWidth="3"
              stroke="currentColor"
              fill="transparent"
              r="15"
              cx="18"
              cy="18"
              strokeDasharray={`${(health.overall / 100) * 94.2} 94.2`}
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="space-y-2.5 mb-5">
        {Object.entries(health.factors).map(([key, val]) => (
          <div key={key}>
            <div className="flex justify-between text-xs mb-0.5">
              <span className="text-muted-foreground">
                {FACTOR_LABELS[key] ?? key}
              </span>
              <span className={`font-medium ${scoreColor(val)}`}>{val}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${scoreBg(val)}`}
                style={{ width: `${val}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Risk Indicators */}
      {health.riskIndicators.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">
            Risk Indicators
          </p>
          {health.riskIndicators.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-xs text-destructive mb-1"
            >
              <AlertTriangle className="h-3 w-3 shrink-0" /> {r}
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {health.recommendations.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">
            Recommendations
          </p>
          {health.recommendations.map((r, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"
            >
              <ArrowRight className="h-3 w-3 shrink-0" /> {r}
            </div>
          ))}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground mt-4">
        Last calculated: {new Date(health.lastRecalculated).toLocaleString()}
      </p>
    </div>
  );
}
