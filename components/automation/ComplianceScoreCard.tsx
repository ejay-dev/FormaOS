/**
 * Compliance Score Card Component
 * Displays real-time compliance health score
 */

'use client';

import { useEffect, useState } from 'react';
import {
  getComplianceSummary,
  recalculateComplianceScore,
} from '@/app/app/actions/automation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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

export function ComplianceScoreCard() {
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      const data = await getComplianceSummary();
      setSummary(data);
    } catch (error) {
      console.error('Failed to load compliance summary:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await recalculateComplianceScore();
      await loadSummary();
    } catch (error) {
      console.error('Failed to refresh score:', error);
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-gray-500">Failed to load compliance score</p>
        </CardContent>
      </Card>
    );
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Compliance Health Score</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
          />
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center">
          <div
            className={`text-6xl font-bold ${getScoreColor(summary.score)}`}
          >
            {summary.score}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Last updated:{' '}
            {new Date(summary.lastUpdated).toLocaleDateString()}
          </div>
        </div>

        {/* Risk Level Badge */}
        <div className="flex justify-center">
          <div
            className={`px-4 py-2 rounded-full border font-medium ${getRiskColor(summary.riskLevel)}`}
          >
            {summary.riskLevel.toUpperCase()} RISK
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-3 pt-4 border-t">
          <div className="text-sm font-medium text-gray-700">
            Score Breakdown
          </div>

          <div className="space-y-2">
            <ScoreBar
              label="Controls"
              score={summary.breakdown.controls}
            />
            <ScoreBar
              label="Evidence"
              score={summary.breakdown.evidence}
            />
            <ScoreBar label="Tasks" score={summary.breakdown.tasks} />
            <ScoreBar
              label="Policies"
              score={summary.breakdown.policies}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-sm text-gray-600">{label}</div>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(score)} transition-all duration-500`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="w-12 text-sm font-medium text-right">{score}</div>
    </div>
  );
}
