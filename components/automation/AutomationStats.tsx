/**
 * Automation Statistics Component
 * Displays automation workflow execution statistics
 */

'use client';

import { useEffect, useState } from 'react';
import {
  getAutomationStats,
  getAutomationHistory,
} from '@/app/app/actions/automation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

interface Stats {
  totalWorkflows: number;
  activeWorkflows: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastExecutionDate?: string;
}

interface Execution {
  id: string;
  trigger: string;
  status: string;
  actionsExecuted: number;
  executedAt: string;
  errorMessage?: string | null;
}

export function AutomationStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [statsData, historyData] = await Promise.all([
        getAutomationStats(),
        getAutomationHistory(5),
      ]);
      if (!('error' in statsData)) setStats(statsData);
      if (Array.isArray(historyData)) setHistory(historyData);
    } catch (error) {
      console.error('Failed to load automation stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return null;
  }

  const successRate =
    stats.totalExecutions > 0
      ? Math.round((stats.successfulExecutions / stats.totalExecutions) * 100)
      : 0;

  return (
    <div className="space-y-4">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Zap className="h-5 w-5 text-muted-foreground" />}
          label="Active Workflows"
          value={stats.activeWorkflows}
        />
        <StatCard
          icon={<Activity className="h-5 w-5 text-muted-foreground" />}
          label="Total Executions"
          value={stats.totalExecutions}
        />
        <StatCard
          icon={<CheckCircle className="h-5 w-5 text-muted-foreground" />}
          label="Success Rate"
          value={`${successRate}%`}
        />
        <StatCard
          icon={<Clock className="h-5 w-5 text-muted-foreground" />}
          label="Last Run"
          value={
            stats.lastExecutionDate
              ? new Date(stats.lastExecutionDate).toLocaleDateString()
              : 'Never'
          }
        />
      </div>

      {/* Recent Executions */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Executions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.map((execution) => (
                <div
                  key={execution.id}
                  className="flex items-center gap-3 p-3 border rounded-lg"
                >
                  {execution.status === 'success' ? (
                    <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {execution.trigger}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(execution.executedAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {execution.actionsExecuted} actions
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-muted rounded-lg">{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground truncate">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
