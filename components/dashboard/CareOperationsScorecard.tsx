'use client';

import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Users,
  FileCheck,
  Calendar,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Heart,
  Shield,
} from 'lucide-react';
import type {
  CareScorecard,
  CareScorecardAlert,
  Credential,
  CarePlanReview,
} from '@/lib/care-scorecard/types';

interface CareScorecardResponse {
  scorecard: CareScorecard;
  alerts: CareScorecardAlert[];
  recommendations: string[];
}

export function CareOperationsScorecard() {
  const [data, setData] = useState<CareScorecardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchScorecard = async () => {
      try {
        const response = await fetch('/api/care-operations/scorecard');

        if (response.status === 403) {
          // Industry not supported - silently hide component
          setData(null);
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to load scorecard');
        }

        const json = await response.json();
        setData(json);
      } catch (_err) {
        setError('Failed to load care operations data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchScorecard();
    const interval = setInterval(fetchScorecard, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Don't render if industry not supported
  if (!isLoading && !data && !error) {
    return null;
  }

  if (isLoading) {
    return <ScorecardSkeleton />;
  }

  if (error || !data) {
    return null;
  }

  const { scorecard, alerts, recommendations } = data;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-surface-2">
            <Heart className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Care Operations</h3>
            <p className="text-xs text-muted-foreground capitalize">
              {scorecard.industry.replace('_', ' ')} Industry Metrics
            </p>
          </div>
        </div>
        <span className="text-xs text-muted-foreground/60">
          Updated {new Date(scorecard.generatedAt).toLocaleTimeString()}
        </span>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.slice(0, 3).map((alert, index) => (
            <AlertBanner key={index} alert={alert} />
          ))}
          {alerts.length > 3 && (
            <p className="text-xs text-muted-foreground/60 text-center">
              +{alerts.length - 3} more alerts
            </p>
          )}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        {/* Staff Compliance */}
        <MetricCard
          title="Staff Compliance"
          value={`${scorecard.staffCompliance.percentage}%`}
          icon={Users}
          trend={scorecard.staffCompliance.trend}
          trendValue={scorecard.staffCompliance.trendPercentage}
          status={
            scorecard.staffCompliance.percentage >= 95
              ? 'success'
              : scorecard.staffCompliance.percentage >= 80
              ? 'warning'
              : 'danger'
          }
          details={`${scorecard.staffCompliance.compliant}/${scorecard.staffCompliance.totalStaff} compliant`}
        />

        {/* Credentials */}
        <MetricCard
          title="Credentials"
          value={scorecard.credentials.total.toString()}
          icon={FileCheck}
          status={
            scorecard.credentials.expired > 0
              ? 'danger'
              : scorecard.credentials.expiring30Days.length > 0
              ? 'warning'
              : 'success'
          }
          details={`${scorecard.credentials.verified} verified, ${scorecard.credentials.expired} expired`}
        />

        {/* Visit Completion */}
        <MetricCard
          title="Visit Completion"
          value={`${scorecard.visits.completionRate}%`}
          icon={Calendar}
          status={
            scorecard.visits.completionRate >= 90
              ? 'success'
              : scorecard.visits.completionRate >= 75
              ? 'warning'
              : 'danger'
          }
          details={`${scorecard.visits.completed}/${scorecard.visits.scheduled + scorecard.visits.completed} this week`}
        />

        {/* Care Plans */}
        <MetricCard
          title="Care Plans"
          value={scorecard.carePlans.active.toString()}
          icon={Shield}
          status={
            scorecard.carePlans.reviewsDue > 5
              ? 'danger'
              : scorecard.carePlans.reviewsDue > 0
              ? 'warning'
              : 'success'
          }
          details={`${scorecard.carePlans.reviewsDue} reviews due`}
        />

        {/* Open Incidents */}
        <MetricCard
          title="Open Incidents"
          value={scorecard.incidents.openCount.toString()}
          icon={AlertTriangle}
          status={
            scorecard.incidents.openCount > 10
              ? 'danger'
              : scorecard.incidents.openCount > 5
              ? 'warning'
              : 'success'
          }
          details={`${scorecard.incidents.resolvedThisWeek} resolved this week`}
        />

        {/* Staff Workload */}
        <MetricCard
          title="Avg Workload"
          value={`${scorecard.workload.averageLoad}%`}
          icon={Activity}
          status={
            scorecard.workload.overloaded > 2
              ? 'danger'
              : scorecard.workload.overloaded > 0
              ? 'warning'
              : 'success'
          }
          details={`${scorecard.workload.overloaded} overloaded`}
        />
      </div>

      {/* Details Sections */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Expiring Credentials */}
        {scorecard.credentials.expiring30Days.length > 0 && (
          <CredentialList
            title="Expiring Soon"
            credentials={scorecard.credentials.expiring30Days.slice(0, 5)}
          />
        )}

        {/* Upcoming Reviews */}
        {scorecard.carePlans.reviewsDue7Days.length > 0 && (
          <ReviewList
            title="Reviews Due This Week"
            reviews={scorecard.carePlans.reviewsDue7Days.slice(0, 5)}
          />
        )}
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">Recommendations</h4>
          <ul className="space-y-2">
            {recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-foreground/70 flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Sub-components
function ScorecardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface-1 p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-surface-2" />
        <div>
          <div className="h-5 w-32 rounded bg-surface-2 mb-1" />
          <div className="h-3 w-24 rounded bg-surface-2" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-surface-2" />
        ))}
      </div>
    </div>
  );
}

function AlertBanner({ alert }: { alert: CareScorecardAlert }) {
  const colors = {
    critical: 'bg-destructive/10 border-destructive/20 text-destructive',
    warning: 'bg-warning/10 border-warning/20 text-warning',
    info: 'bg-info/10 border-info/20 text-info',
  };

  return (
    <a
      href={alert.actionUrl}
      className={`flex items-center gap-3 p-3 rounded-lg border ${colors[alert.type]} hover:bg-surface-1 transition-colors`}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span className="text-sm flex-1">{alert.message}</span>
      {alert.count !== undefined && (
        <span className="text-xs font-bold">{alert.count}</span>
      )}
    </a>
  );
}

function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  status,
  details,
}: {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  status: 'success' | 'warning' | 'danger';
  details: string;
}) {
  const statusColors = {
    success: 'border-success/20 bg-success/10',
    warning: 'border-warning/20 bg-warning/10',
    danger: 'border-destructive/20 bg-destructive/10',
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : '';

  return (
    <div className={`rounded-xl border p-4 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="h-4 w-4" />
          {title}
        </div>
        {TrendIcon && (
          <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
            <TrendIcon className="h-3 w-3" />
            {trendValue}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{details}</div>
    </div>
  );
}

function CredentialList({
  title,
  credentials,
}: {
  title: string;
  credentials: Credential[];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">{title}</h4>
      <div className="space-y-2">
        {credentials.map((cred) => (
          <div
            key={cred.id}
            className="flex items-center justify-between p-2 rounded-lg bg-surface-2"
          >
            <div>
              <div className="text-sm text-foreground/90">{cred.staffName}</div>
              <div className="text-xs text-muted-foreground">{cred.name}</div>
            </div>
            <div className="text-right">
              <div
                className={`text-xs font-bold ${
                  cred.daysUntilExpiry <= 7 ? 'text-destructive' : 'text-warning'
                }`}
              >
                {cred.daysUntilExpiry}d
              </div>
              <div className="text-xs text-muted-foreground/60">
                <Clock className="h-3 w-3 inline mr-1" />
                expires
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewList({
  title,
  reviews,
}: {
  title: string;
  reviews: CarePlanReview[];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <h4 className="text-xs font-bold uppercase text-muted-foreground mb-3">{title}</h4>
      <div className="space-y-2">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="flex items-center justify-between p-2 rounded-lg bg-surface-2"
          >
            <div>
              <div className="text-sm text-foreground/90">{review.clientName}</div>
              <div className="text-xs text-muted-foreground">{review.planTitle}</div>
            </div>
            <div className="text-right">
              <div
                className={`text-xs font-bold ${
                  review.daysUntilReview <= 3 ? 'text-destructive' : 'text-warning'
                }`}
              >
                {review.daysUntilReview}d
              </div>
              <div className="text-xs text-muted-foreground/60">until review</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
