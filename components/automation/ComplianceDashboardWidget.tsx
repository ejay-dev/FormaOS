/**
 * Premium Compliance Health Dashboard Widget
 * Prominent display of compliance score with trend and alerts
 */

'use client';

import { useEffect, useState } from 'react';
import {
  getComplianceSummary,
  getAutomationHistory,
} from '@/app/app/actions/automation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Shield,
  ChevronRight,
  Activity,
} from 'lucide-react';
import Link from 'next/link';

interface ComplianceSummary {
  score: number;
  riskLevel: string;
  lastUpdated: string;
  breakdown: {
    controls: number;
    evidence: number;
    tasks: number;
    policies: number;
  };
}

interface Alert {
  id: string;
  trigger: string;
  executedAt: string;
  actionsExecuted: number;
}

export function ComplianceDashboardWidget() {
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [summaryData, historyData] = await Promise.all([
        getComplianceSummary(),
        getAutomationHistory(3),
      ]);
      if (!('error' in summaryData)) setSummary(summaryData);
      if (Array.isArray(historyData)) setAlerts(historyData);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="relative overflow-hidden border border-border bg-card">
        <div className="p-8 animate-pulse">
          <div className="h-8 bg-muted rounded w-2/3 mb-4"></div>
          <div className="h-24 bg-muted rounded mb-4"></div>
          <div className="h-16 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (!summary) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-success/10 text-success border-success/20';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'high':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'critical':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    if (score >= 40) return 'text-warning';
    return 'text-destructive';
  };

  const _getTrendIcon = (score: number) => {
    if (score >= 75) {
      return <TrendingUp className="w-6 h-6 text-success" />;
    } else if (score >= 50) {
      return <Activity className="w-6 h-6 text-warning" />;
    } else {
      return <TrendingDown className="w-6 h-6 text-destructive" />;
    }
  };

  return (
    <Card className="relative overflow-hidden border border-border bg-card shadow-sm">
      <div className="relative p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Shield className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Compliance Health
              </h3>
              <p className="text-xs text-muted-foreground">
                Real-time automated monitoring
              </p>
            </div>
          </div>
          <Badge
            className={`${getRiskColor(summary.riskLevel)} border font-medium`}
          >
            {summary.riskLevel.toUpperCase()}
          </Badge>
        </div>

        {/* Score Display */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="flex-shrink-0">
            <div className="relative w-32 h-32">
              {/* Circular progress background */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(summary.score / 100) * 352} 352`}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ${getScoreColor(summary.score)}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div
                  className={`text-4xl font-bold ${getScoreColor(summary.score)}`}
                >
                  {summary.score}
                </div>
                <div className="text-xs text-muted-foreground">out of 100</div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {/* Score breakdown bars */}
            <ScoreBar label="Controls" value={summary.breakdown.controls} />
            <ScoreBar label="Evidence" value={summary.breakdown.evidence} />
            <ScoreBar label="Tasks" value={summary.breakdown.tasks} />
            <ScoreBar label="Policies" value={summary.breakdown.policies} />
          </div>
        </div>

        {/* Top Automation Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Activity className="w-4 h-4" />
              Recent Automation Activity
            </div>
            <div className="space-y-1.5">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-2 p-2 bg-surface-1 rounded-lg border border-border"
                >
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {alert.trigger.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(alert.executedAt).toLocaleDateString()} •{' '}
                      {alert.actionsExecuted} actions
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <Link href="/app/compliance" className="block">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            View Full Compliance Report
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const getColor = (val: number) => {
    if (val >= 80) return 'bg-success';
    if (val >= 60) return 'bg-warning';
    if (val >= 40) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 text-xs text-muted-foreground font-medium">{label}</div>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(value)} transition-all duration-1000`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="w-8 text-xs text-muted-foreground font-semibold text-right">
        {value}
      </div>
    </div>
  );
}
