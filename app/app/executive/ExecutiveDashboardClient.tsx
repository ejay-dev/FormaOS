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
            value={`${data.posture?.overallScore ?? 0}%`}
            description="compliance"
            icon={Shield}
            trend={
              data.posture?.trend !== 'stable'
                ? {
                    value: data.posture?.trendPercentage ?? 0,
                    isPositive: data.posture?.trend === 'up',
                    label: '30d',
                  }
                : undefined
            }
            status={
              (data.posture?.overallScore ?? 0) >= 80
                ? 'SUCCESS'
                : (data.posture?.overallScore ?? 0) >= 50
                ? 'WARNING'
                : 'DANGER'
            }
            isLoading={isLoading}
          />
          <KPICard
            title="Framework Coverage"
            value={`${data.posture?.frameworkCoverage ?? 0}%`}
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
            value={data.posture?.criticalFailures.length ?? 0}
            description="controls at risk"
            icon={Shield}
            status={
              (data.posture?.criticalFailures.length ?? 0) === 0
                ? 'SUCCESS'
                : (data.posture?.criticalFailures.length ?? 0) <= 3
                ? 'WARNING'
                : 'DANGER'
            }
            isLoading={isLoading}
          />
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Posture Ring */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[hsl(var(--card))] via-[hsl(var(--panel-2))] to-[hsl(var(--panel-2))]">
              <CompliancePostureRing
                score={data.posture?.overallScore ?? 0}
                previousScore={data.posture?.previousScore ?? 0}
                trend={data.posture?.trend ?? 'stable'}
                trendPercentage={data.posture?.trendPercentage ?? 0}
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
              frameworks={data.posture?.frameworkRollup ?? []}
              isLoading={isLoading}
            />

            {/* Critical Controls */}
            <CriticalControlsTable
              controls={data.posture?.criticalFailures ?? []}
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
            deadlines={data.posture?.upcomingDeadlines ?? []}
            isLoading={isLoading}
          />
        </div>
      </main>
    </div>
  );
}
