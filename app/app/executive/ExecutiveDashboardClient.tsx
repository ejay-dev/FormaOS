'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
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

function severityStyles(severity: CommandSeverity) {
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
  industry,
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
    posture?.frameworkRollup?.reduce((sum, fw) => sum + (fw.controlsMissing ?? 0), 0) ??
    0;
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
      count: automationSuccess < 90 ? Math.round((90 - automationSuccess) / 2) : 0,
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
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-950/95 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/app"
              className="p-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-sky-400" />
                <h1 className="text-xl sm:text-2xl font-bold">Executive Dashboard</h1>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{organizationName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-slate-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Top KPI Row */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
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

        <section className="mb-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 lg:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-cyan-300" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-100">
                    Executive Command Center
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Prioritized operator actions and risk posture at a glance.
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
                <p className="font-semibold text-slate-200">Data Freshness</p>
                <p className="mt-1">
                  Last evaluated:{' '}
                  <span className="text-slate-200">
                    {posture?.lastEvaluated
                      ? new Date(posture.lastEvaluated).toLocaleString()
                      : 'N/A'}
                  </span>
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              {riskHeatmap.map((cell) => {
                const severity = commandSeverityFromCount(cell.count);
                return (
                  <Link
                    key={cell.key}
                    href={cell.href}
                    className="rounded-xl border border-white/10 bg-slate-950/40 p-4 transition-colors hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          {cell.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-100">
                          {cell.metric}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${severityStyles(severity)}`}
                        >
                          {severityLabel(severity)}
                        </span>
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                          <cell.icon className="h-4 w-4 text-slate-200" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="text-sm font-semibold text-slate-100">Action Queue</h3>
            <p className="mt-1 text-xs text-slate-500">
              Ranked by impact and urgency.
            </p>
            <div className="mt-4 space-y-3">
              {actionQueue.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="group flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 transition-colors hover:bg-white/10"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-100">
                      {item.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      {item.detail}
                    </p>
                  </div>
                  <span className="mt-0.5 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-200">
                    {item.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Posture Ring */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))]">
              <CompliancePostureRing
                score={posture?.overallScore ?? 0}
                previousScore={posture?.previousScore ?? 0}
                trend={posture?.trend ?? 'stable'}
                trendPercentage={posture?.trendPercentage ?? 0}
                isLoading={isLoading}
              />
            </div>

            {/* Automation Metrics */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">
                Automation Performance
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Success Rate</span>
                  <span className="text-sm font-semibold text-emerald-400">
                    {data.automationMetrics?.successRate ?? 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Auto-Completed Tasks</span>
                  <span className="text-sm font-semibold text-slate-200">
                    {data.automationMetrics?.taskAutoCompletionRate ?? 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Avg Resolution Time</span>
                  <span className="text-sm font-semibold text-slate-200">
                    {data.automationMetrics?.averageResolutionTime ?? 0} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-300">Monthly Triggers</span>
                  <span className="text-sm font-semibold text-slate-200">
                    {data.automationMetrics?.triggersThisMonth ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Framework & Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Framework Rollup */}
            <FrameworkRollupWidget
              frameworks={posture?.frameworkRollup ?? []}
              isLoading={isLoading}
            />

            {/* Critical Controls */}
            <CriticalControlsTable
              controls={criticalFailures}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2 mt-6">
          {/* Audit Readiness */}
          {data.auditForecast && (
            <AuditReadinessGauge forecast={data.auditForecast} isLoading={isLoading} />
          )}

          {/* Deadlines */}
          <DeadlineCalendar
            deadlines={deadlines}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}
