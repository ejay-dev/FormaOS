'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Shield,
  Zap,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  CalendarClock,
  FileCheck2,
  ListChecks,
} from 'lucide-react';
import { KPICard } from '@/components/dashboard/kpi-card';
import { CompliancePostureRing } from './components/CompliancePostureRing';
import { FrameworkRollupWidget } from './components/FrameworkRollupWidget';
import { CriticalControlsTable } from './components/CriticalControlsTable';
import { AuditReadinessGauge } from './components/AuditReadinessGauge';
import { DeadlineCalendar } from './components/DeadlineCalendar';
import type {
  ExecutivePosture,
  AuditReadinessForecast,
  AutomationMetrics,
  ComplianceDeadline,
} from '@/lib/executive/types';

interface ExecutiveDashboardClientProps {
  organizationName: string;
  industry: string | null;
}

interface DashboardData {
  posture: ExecutivePosture | null;
  auditForecast: AuditReadinessForecast | null;
  automationMetrics: AutomationMetrics | null;
  actionDeadlines: ComplianceDeadline[];
}

type CommandSeverity = 'low' | 'watch' | 'high' | 'critical';

function severityLabel(severity: CommandSeverity) {
  switch (severity) {
    case 'critical':
      return 'Critical';
    case 'high':
      return 'High';
    case 'watch':
      return 'Watch';
    default:
      return 'Low';
  }
}

function _severityStyles(severity: CommandSeverity) {
  switch (severity) {
    case 'critical':
      return 'border-rose-400/30 bg-rose-500/10 text-rose-200';
    case 'high':
      return 'border-amber-400/30 bg-amber-500/10 text-amber-200';
    case 'watch':
      return 'border-sky-400/30 bg-sky-500/10 text-sky-200';
    default:
      return 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200';
  }
}

function commandSeverityFromCount(count: number): CommandSeverity {
  if (count >= 8) return 'critical';
  if (count >= 4) return 'high';
  if (count >= 1) return 'watch';
  return 'low';
}

export function ExecutiveDashboardClient({
  organizationName,
}: ExecutiveDashboardClientProps) {
  const [data, setData] = useState<DashboardData>({
    posture: null,
    auditForecast: null,
    automationMetrics: null,
    actionDeadlines: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [postureRes, forecastRes] = await Promise.all([
        fetch('/api/executive/posture'),
        fetch('/api/executive/audit-forecast'),
      ]);

      if (postureRes.ok && forecastRes.ok) {
        const postureData = await postureRes.json();
        const forecastData = await forecastRes.json();

        setData({
          posture: postureData.posture,
          auditForecast: forecastData.auditForecast,
          automationMetrics: forecastData.automationMetrics,
          actionDeadlines: forecastData.actionDeadlines || [],
        });
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('[Executive Dashboard] Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const posture = data.posture;
  const criticalFailures = posture?.criticalFailures ?? [];
  const deadlines = posture?.upcomingDeadlines ?? [];
  const deadlineCounts = deadlines.reduce(
    (acc, item) => {
      acc[item.status] = (acc[item.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const overdueCount = deadlineCounts.overdue ?? 0;
  const dueSoonCount = deadlineCounts.due_soon ?? 0;
  const missingControls =
    posture?.frameworkRollup?.reduce(
      (sum, fw) => sum + (fw.controlsMissing ?? 0),
      0,
    ) ?? 0;
  const automationSuccess = data.automationMetrics?.successRate ?? 0;

  const riskHeatmap = [
    {
      key: 'critical_failures',
      label: 'Critical Control Gaps',
      metric: `${criticalFailures.length} flagged`,
      count: criticalFailures.length,
      href: '/app/compliance',
      icon: AlertTriangle,
    },
    {
      key: 'deadline_pressure',
      label: 'Deadline Pressure',
      metric: `${overdueCount} overdue, ${dueSoonCount} due soon`,
      count: overdueCount + dueSoonCount,
      href: '/app/reports',
      icon: CalendarClock,
    },
    {
      key: 'framework_missing',
      label: 'Missing Controls',
      metric: `${missingControls} missing across frameworks`,
      count: missingControls,
      href: '/app/compliance/frameworks',
      icon: FileCheck2,
    },
    {
      key: 'automation_reliability',
      label: 'Automation Reliability',
      metric: `${automationSuccess}% workflow success`,
      count:
        automationSuccess < 90 ? Math.round((90 - automationSuccess) / 2) : 0,
      href: '/app/workflows',
      icon: Zap,
    },
  ] as const;

  const actionQueue = [
    {
      id: 'close_critical',
      label: 'Close critical control gaps',
      detail:
        criticalFailures.length > 0
          ? 'Assign owners and complete evidence for at-risk controls first.'
          : 'No critical gaps detected. Validate evidence freshness and cadence.',
      count: criticalFailures.length,
      href: '/app/compliance',
    },
    {
      id: 'resolve_deadlines',
      label: 'Resolve due-soon and overdue deadlines',
      detail:
        overdueCount + dueSoonCount > 0
          ? 'Clear overdue items and pre-empt due-soon submissions.'
          : 'Deadlines are stable. Maintain weekly readiness review.',
      count: overdueCount + dueSoonCount,
      href: '/app/reports',
    },
    {
      id: 'tighten_frameworks',
      label: 'Tighten framework execution coverage',
      detail:
        missingControls > 0
          ? 'Reduce missing controls to improve audit readiness probability.'
          : 'Framework execution coverage looks complete. Monitor drift.',
      count: missingControls,
      href: '/app/compliance/frameworks',
    },
  ]
    .slice()
    .sort((a, b) => b.count - a.count);

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link
            href="/app"
            className="p-1.5 rounded-md border border-border hover:bg-accent/30 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>
          <div>
            <h1 className="page-title">Executive Dashboard</h1>
            <p className="page-description">{organizationName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground font-mono">
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-border hover:bg-accent/30 transition-colors disabled:opacity-50 text-sm"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="page-content max-w-7xl mx-auto w-full">
        {/* Top KPI Row */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4 mb-4">
          <KPICard
            title="Overall Score"
            value={`${posture?.overallScore ?? 0}%`}
            description="compliance"
            icon={Shield}
            trend={
              posture?.trend !== 'stable'
                ? {
                    value: posture?.trendPercentage ?? 0,
                    isPositive: posture?.trend === 'up',
                    label: '30d',
                  }
                : undefined
            }
            status={
              (posture?.overallScore ?? 0) >= 80
                ? 'SUCCESS'
                : (posture?.overallScore ?? 0) >= 50
                  ? 'WARNING'
                  : 'DANGER'
            }
            isLoading={isLoading}
          />
          <KPICard
            title="Framework Coverage"
            value={`${posture?.frameworkCoverage ?? 0}%`}
            description="frameworks active"
            icon={TrendingUp}
            isLoading={isLoading}
          />
          <KPICard
            title="Automation"
            value={`${data.automationMetrics?.activeWorkflows ?? 0}`}
            description="active workflows"
            icon={Zap}
            trend={
              data.automationMetrics?.triggersThisWeek
                ? {
                    value: data.automationMetrics.triggersThisWeek,
                    isPositive: true,
                    label: 'triggers/wk',
                  }
                : undefined
            }
            isLoading={isLoading}
          />
          <KPICard
            title="Critical Gaps"
            value={criticalFailures.length}
            description="controls at risk"
            icon={Shield}
            status={
              criticalFailures.length === 0
                ? 'SUCCESS'
                : criticalFailures.length <= 3
                  ? 'WARNING'
                  : 'DANGER'
            }
            isLoading={isLoading}
          />
        </div>

        <section className="mb-4 grid gap-3 lg:grid-cols-12">
          <div className="rounded-lg border border-border bg-card p-4 lg:col-span-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Command Center</h2>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground">
                {posture?.lastEvaluated
                  ? new Date(posture.lastEvaluated).toLocaleString()
                  : 'N/A'}
              </span>
            </div>

            <div className="grid gap-2 grid-cols-2 lg:grid-cols-4">
              {riskHeatmap.map((cell) => {
                const severity = commandSeverityFromCount(cell.count);
                return (
                  <Link
                    key={cell.key}
                    href={cell.href}
                    className="rounded-lg border border-border bg-background p-3 transition-colors hover:bg-accent/30"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <cell.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground truncate">
                        {cell.label}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {cell.metric}
                    </p>
                    <span
                      className={`status-pill mt-1.5 ${severity === 'critical' ? 'status-pill-red' : severity === 'high' ? 'status-pill-amber' : severity === 'watch' ? 'status-pill-blue' : 'status-pill-green'}`}
                    >
                      {severityLabel(severity)}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 lg:col-span-4">
            <h3 className="text-sm font-semibold mb-2">Action Queue</h3>
            <div className="space-y-2">
              {actionQueue.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex items-center gap-2.5 rounded-md border border-border bg-background px-3 py-2 transition-colors hover:bg-accent/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.label}
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold text-muted-foreground">
                    {item.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid gap-3 lg:grid-cols-12">
          {/* Left Column - Posture Ring */}
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-lg border border-border bg-card">
              <CompliancePostureRing
                score={posture?.overallScore ?? 0}
                previousScore={posture?.previousScore ?? 0}
                trend={posture?.trend ?? 'stable'}
                trendPercentage={posture?.trendPercentage ?? 0}
                isLoading={isLoading}
              />
            </div>

            {/* Automation Metrics */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                Automation Performance
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Success Rate
                  </span>
                  <span className="text-sm font-semibold text-emerald-500">
                    {data.automationMetrics?.successRate ?? 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Auto-Completed
                  </span>
                  <span className="text-sm font-semibold">
                    {data.automationMetrics?.taskAutoCompletionRate ?? 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Avg Resolution
                  </span>
                  <span className="text-sm font-mono font-semibold">
                    {data.automationMetrics?.averageResolutionTime ?? 0}d
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Monthly Triggers
                  </span>
                  <span className="text-sm font-mono font-semibold">
                    {data.automationMetrics?.triggersThisMonth ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Framework & Controls */}
          <div className="lg:col-span-8 space-y-3">
            <FrameworkRollupWidget
              frameworks={posture?.frameworkRollup ?? []}
              isLoading={isLoading}
            />
            <CriticalControlsTable
              controls={criticalFailures}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-3 lg:grid-cols-2 mt-3">
          {/* Audit Readiness */}
          {data.auditForecast && (
            <AuditReadinessGauge
              forecast={data.auditForecast}
              isLoading={isLoading}
            />
          )}

          {/* Deadlines */}
          <DeadlineCalendar deadlines={deadlines} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
