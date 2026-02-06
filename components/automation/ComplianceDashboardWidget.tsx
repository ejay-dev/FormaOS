/**
 * Premium Compliance Health Dashboard Widget
 * Prominent display of compliance score with trend and alerts
 */

'use client';

import { useEffect, useState } from 'react';
import { getComplianceSummary, getAutomationHistory } from '@/app/app/actions/automation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
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
      setSummary(summaryData);
      setAlerts(historyData);
    } catch (error) {
      console.error('Failed to load compliance data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="relative overflow-hidden border-2 border-purple-100 bg-gradient-to-br from-purple-50 via-white to-blue-50">
        <div className="p-8 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-4"></div>
          <div className="h-24 bg-gray-200 rounded mb-4"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!summary) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    if (score >= 40) return 'from-orange-500 to-red-500';
    return 'from-red-500 to-rose-600';
  };

  const getTrendIcon = (score: number) => {
    if (score >= 75) {
      return <TrendingUp className="w-6 h-6 text-green-600" />;
    } else if (score >= 50) {
      return <Activity className="w-6 h-6 text-yellow-600" />;
    } else {
      return <TrendingDown className="w-6 h-6 text-red-600" />;
    }
  };

  return (
    <Card className="relative overflow-hidden border-2 border-purple-100 bg-gradient-to-br from-purple-50 via-white to-blue-50 shadow-lg">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
      </div>

      <div className="relative p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Compliance Health
              </h3>
              <p className="text-xs text-gray-500">
                Real-time automated monitoring
              </p>
            </div>
          </div>
          <Badge className={`${getRiskColor(summary.riskLevel)} border font-medium`}>
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
                  className="text-gray-200"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(summary.score / 100) * 352} 352`}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" className={`stop-color-${summary.score >= 80 ? 'green' : summary.score >= 60 ? 'yellow' : 'red'}-500`} />
                    <stop offset="100%" className={`stop-color-${summary.score >= 80 ? 'emerald' : summary.score >= 60 ? 'orange' : 'rose'}-600`} />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-4xl font-bold bg-gradient-to-br ${getScoreGradient(summary.score)} bg-clip-text text-transparent`}>
                  {summary.score}
                </div>
                <div className="text-xs text-gray-500">out of 100</div>
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
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Activity className="w-4 h-4" />
              Recent Automation Activity
            </div>
            <div className="space-y-1.5">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-2 p-2 bg-white/80 rounded-lg border border-gray-100"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {alert.trigger.replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs text-gray-500">
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
          <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
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
    if (val >= 80) return 'bg-green-500';
    if (val >= 60) return 'bg-yellow-500';
    if (val >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 text-xs text-gray-600 font-medium">{label}</div>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(value)} transition-all duration-1000`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="w-8 text-xs text-gray-600 font-semibold text-right">
        {value}
      </div>
    </div>
  );
}
