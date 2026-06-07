import { getAdminFetchConfig } from '@/app/admin/lib';
import Link from 'next/link';
import {
  TrendingUp,
  Users,
  Building2,
  CreditCard,
  Zap,
  Activity,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Layers,
  Heart,
  BarChart3,
  UserPlus,
} from 'lucide-react';
import {
  getEngagementMetrics,
  type EngagementMetrics,
} from '@/lib/admin/engagement-metrics';

type OverviewData = {
  totalOrgs: number;
  activeByPlan: Record<string, number>;
  trialsActive: number;
  trialsExpiring: number;
  mrrCents: number;
  failedPayments: number;
  orgsByDay: Array<{ date: string; count: number }>;
  suspendedOrgs: number;
  activationAtRisk: number;
  pendingApprovals: number;
  openSecurityAlerts: number;
  failedExports: number;
  highRiskAdminActions7d: number;
};

type RiskGrade = 'low' | 'watch' | 'high' | 'critical';

async function fetchOverview() {
  const { base, headers } = await getAdminFetchConfig();
  const res = await fetch(`${base}/api/admin/overview`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) return null;
  return res.json();
}

function KPICard({
  icon: Icon,
  label,
  value,
  detail,
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  detail?: string;
  color: 'blue' | 'green' | 'purple' | 'amber';
}) {
  // KPI accent colour is decorative, not status — flatten the rainbow to a
  // single neutral card surface across all variants.
  void color;

  return (
    <div className="rounded-lg border border-border bg-card p-6 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="text-3xl font-bold text-foreground tabular-nums">
        {value}
      </div>
      {detail && <div className="text-xs text-muted-foreground">{detail}</div>}
    </div>
  );
}

function riskGradeFromRatio(ratio: number): RiskGrade {
  if (ratio >= 0.66) return 'critical';
  if (ratio >= 0.4) return 'high';
  if (ratio >= 0.18) return 'watch';
  return 'low';
}

function riskGradeLabel(grade: RiskGrade): string {
  switch (grade) {
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

function riskGradeStyles(grade: RiskGrade): string {
  switch (grade) {
    case 'critical':
      return 'border-destructive/20 bg-destructive/10 text-destructive';
    case 'high':
      return 'border-warning/20 bg-warning/10 text-warning';
    case 'watch':
      return 'border-info/20 bg-info/10 text-info';
    default:
      return 'border-success/20 bg-success/10 text-success';
  }
}

function RiskHeatmap({
  cells,
}: {
  cells: Array<{
    key: string;
    label: string;
    grade: RiskGrade;
    ratio: number;
    metric: string;
    href: string;
  }>;
}) {
  const intensity = {
    low: 'bg-success/10',
    watch: 'bg-info/10',
    high: 'bg-warning/10',
    critical: 'bg-destructive/10',
  } as const;

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Risk Heatmap
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Cross-tenant pressure indicators (normalized)
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {cells.map((cell) => (
          <Link
            key={cell.key}
            href={cell.href}
            className={`rounded-lg border border-border p-4 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${intensity[cell.grade]}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {cell.label}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {cell.metric}
                </p>
              </div>
              <span
                className={`rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${riskGradeStyles(cell.grade)}`}
              >
                {riskGradeLabel(cell.grade)}
              </span>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className="h-2 rounded-full bg-primary"
                  style={{
                    width: `${Math.min(Math.round(cell.ratio * 100), 100)}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {Math.round(cell.ratio * 100)}% normalized pressure
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default async function AdminDashboard() {
  const [data, engagement]: [OverviewData | null, EngagementMetrics | null] =
    await Promise.all([
      fetchOverview(),
      getEngagementMetrics().catch(() => null),
    ]);

  if (!data) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Unable to load dashboard data</p>
      </div>
    );
  }

  const formatCurrency = (cents: number) =>
    new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(cents / 100);

  const basicCount = data.activeByPlan['basic'] || 0;
  const proCount = data.activeByPlan['pro'] || 0;
  const enterpriseCount = data.activeByPlan['enterprise'] || 0;
  const maxOrgCount = Math.max(
    ...data.orgsByDay.map((d: { count: number }) => d.count),
    1,
  );
  const riskQueue = [
    {
      label: 'Failed payments',
      value: data.failedPayments,
      href: '/admin/billing',
      severity: data.failedPayments > 0 ? 'high' : 'low',
      guidance:
        data.failedPayments > 0
          ? 'Immediate intervention required'
          : 'No active payment incidents',
    },
    {
      label: 'Trials expiring (< 7d)',
      value: data.trialsExpiring,
      href: '/admin/trials',
      severity: data.trialsExpiring > 5 ? 'medium' : 'low',
      guidance:
        data.trialsExpiring > 0
          ? 'Review renewal and outreach queue'
          : 'No urgent trial churn risk',
    },
    {
      label: 'Activation at risk',
      value: data.activationAtRisk,
      href: '/admin/orgs',
      severity:
        data.activationAtRisk > 3
          ? 'high'
          : data.activationAtRisk > 0
            ? 'medium'
            : 'low',
      guidance:
        data.activationAtRisk > 0
          ? 'Customer rescue intervention recommended'
          : 'No urgent activation rescues',
    },
  ] as const;

  const quickOps = [
    { label: 'Triage incidents', href: '/admin/security/triage' },
    { label: 'Review live security', href: '/admin/security-live' },
    { label: 'Review audit stream', href: '/admin/audit' },
    { label: 'Approve admin changes', href: '/admin/settings' },
    { label: 'Publish release notes', href: '/admin/releases' },
    { label: 'Validate system health', href: '/admin/health' },
  ] as const;
  const trialRiskRatio =
    data.trialsActive > 0 ? data.trialsExpiring / data.trialsActive : 0;
  const crossTenantHealth = [
    {
      key: 'revenue',
      area: 'Revenue Stability',
      status:
        data.failedPayments > 3
          ? 'critical'
          : data.failedPayments > 0
            ? 'watch'
            : 'healthy',
      note:
        data.failedPayments > 0
          ? `${data.failedPayments} payment failures require intervention`
          : 'No active payment failures',
      href: '/admin/billing',
    },
    {
      key: 'trials',
      area: 'Trial Conversion Pressure',
      status:
        trialRiskRatio > 0.45
          ? 'critical'
          : trialRiskRatio > 0.2
            ? 'watch'
            : 'healthy',
      note:
        data.trialsExpiring > 0
          ? `${data.trialsExpiring} of ${data.trialsActive} trials nearing expiry`
          : 'No immediate trial churn risk',
      href: '/admin/trials',
    },
    {
      key: 'enterprise',
      area: 'Security Alerts',
      status: data.openSecurityAlerts > 0 ? 'critical' : 'healthy',
      note:
        data.openSecurityAlerts > 0
          ? `${data.openSecurityAlerts} alerts require review`
          : 'No unresolved security alerts',
      href: '/admin/security-live',
    },
    {
      key: 'growth',
      area: 'Governance Throughput',
      status: data.pendingApprovals > 0 ? 'watch' : 'healthy',
      note:
        data.pendingApprovals > 0
          ? `${data.pendingApprovals} approvals waiting for review`
          : 'Approval queue is clear',
      href: '/admin/settings',
    },
  ] as const;
  const statusStyles = {
    healthy: 'border-success/20 bg-success/10 text-success',
    watch: 'border-warning/20 bg-warning/10 text-warning',
    critical: 'border-destructive/20 bg-destructive/10 text-destructive',
  } as const;
  const healthRatio =
    data.totalOrgs > 0 ? Math.min(data.failedPayments / data.totalOrgs, 1) : 0;
  const alertRatio =
    data.totalOrgs > 0
      ? Math.min(data.openSecurityAlerts / data.totalOrgs, 1)
      : 0;
  const approvalRatio =
    data.totalOrgs > 0
      ? Math.min(data.pendingApprovals / data.totalOrgs, 1)
      : 0;
  const riskHeatmapCells = [
    {
      key: 'revenue_pressure',
      label: 'Revenue Pressure',
      ratio: healthRatio,
      grade: riskGradeFromRatio(healthRatio),
      metric: `${data.failedPayments} failed payments`,
      href: '/admin/billing',
    },
    {
      key: 'trial_churn_pressure',
      label: 'Trial Churn Pressure',
      ratio: trialRiskRatio,
      grade: riskGradeFromRatio(trialRiskRatio),
      metric: `${data.trialsExpiring} trials expiring`,
      href: '/admin/trials',
    },
    {
      key: 'enterprise_footprint',
      label: 'Security Alerts',
      ratio: alertRatio,
      grade: riskGradeFromRatio(alertRatio),
      metric: `${data.openSecurityAlerts} open alerts`,
      href: '/admin/security-live',
    },
    {
      key: 'growth_load',
      label: 'Governance Backlog',
      ratio: approvalRatio,
      grade: riskGradeFromRatio(approvalRatio),
      metric: `${data.pendingApprovals} pending approvals`,
      href: '/admin/settings',
    },
  ] as const;

  const orchestrationQueueItems: Array<{
    id: string;
    label: string;
    detail: string;
    count: number;
    href: string;
    grade: RiskGrade;
    ownerLabel: string;
    slaLabel: string;
  }> = [
    {
      id: 'billing_intervention',
      label: 'Resolve billing incidents',
      detail:
        'Failed payments and subscription interventions requiring owner attention.',
      count: data.failedPayments,
      href: '/admin/billing',
      grade:
        data.failedPayments > 3
          ? 'critical'
          : data.failedPayments > 0
            ? 'high'
            : 'low',
      ownerLabel: 'Billing Operations',
      slaLabel: data.failedPayments > 0 ? '4h' : 'Weekly',
    },
    {
      id: 'trial_outreach',
      label: 'Trial renewal outreach',
      detail: 'Expiring trials needing guided conversion and procurement help.',
      count: data.trialsExpiring,
      href: '/admin/trials',
      grade:
        data.trialsExpiring > 5
          ? 'high'
          : data.trialsExpiring > 0
            ? 'watch'
            : 'low',
      ownerLabel: 'Growth Operations',
      slaLabel: data.trialsExpiring > 0 ? '24h' : 'Weekly',
    },
    {
      id: 'security_triage',
      label: 'Security triage routing',
      detail: 'Route incidents to the correct operational owner queues.',
      count: data.openSecurityAlerts,
      href: '/admin/security-live',
      grade:
        data.openSecurityAlerts > 0
          ? riskGradeFromRatio(
              data.openSecurityAlerts / Math.max(data.totalOrgs, 1),
            )
          : 'low',
      ownerLabel: 'Security Operations',
      slaLabel: 'Same day',
    },
    {
      id: 'governance_reviews',
      label: 'Governance approval queue',
      detail: 'High-risk delegated admin actions pending founder approval.',
      count: data.pendingApprovals,
      href: '/admin/settings',
      grade: data.pendingApprovals > 0 ? 'watch' : 'low',
      ownerLabel: 'Founder Operations',
      slaLabel: data.pendingApprovals > 0 ? '4h' : 'Weekly',
    },
  ];
  const orchestrationQueue = orchestrationQueueItems
    .slice()
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Platform Overview
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Real-time operational metrics for FormaOS
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KPICard
          icon={Building2}
          label="Total Organizations"
          value={data.totalOrgs}
          detail="Active tenants on platform"
          color="blue"
        />
        <KPICard
          icon={Users}
          label="Active Trials"
          value={data.trialsActive}
          detail={
            data.trialsExpiring > 0
              ? `${data.trialsExpiring} expiring soon`
              : 'All stable'
          }
          color="amber"
        />
        <KPICard
          icon={CreditCard}
          label="Monthly Recurring"
          value={formatCurrency(data.mrrCents)}
          detail={`${basicCount + proCount + enterpriseCount} paid subscriptions`}
          color="green"
        />
        <KPICard
          icon={Zap}
          label="Starter Plan"
          value={basicCount}
          detail="Organizations on Basic tier"
          color="purple"
        />
        <KPICard
          icon={TrendingUp}
          label="Pro Plan"
          value={proCount}
          detail="Organizations on Pro tier"
          color="green"
        />
        <KPICard
          icon={Activity}
          label="Failed Payments"
          value={data.failedPayments}
          detail={
            data.failedPayments > 0 ? 'Action required' : 'All payments current'
          }
          color={data.failedPayments > 0 ? 'amber' : 'blue'}
        />
        <KPICard
          icon={AlertTriangle}
          label="Activation At Risk"
          value={data.activationAtRisk}
          detail="Customers needing rescue or onboarding help"
          color="amber"
        />
        <KPICard
          icon={ShieldAlert}
          label="Open Security Alerts"
          value={data.openSecurityAlerts}
          detail="Open or acknowledged investigations"
          color={data.openSecurityAlerts > 0 ? 'amber' : 'blue'}
        />
        <KPICard
          icon={Layers}
          label="Pending Approvals"
          value={data.pendingApprovals}
          detail="Delegated admin changes awaiting founder review"
          color={data.pendingApprovals > 0 ? 'amber' : 'green'}
        />
        <KPICard
          icon={Building2}
          label="Suspended Orgs"
          value={data.suspendedOrgs}
          detail="Operationally suspended tenants"
          color={data.suspendedOrgs > 0 ? 'amber' : 'blue'}
        />
        <KPICard
          icon={Activity}
          label="Failed Exports"
          value={data.failedExports}
          detail="Compliance and report exports needing retry"
          color={data.failedExports > 0 ? 'amber' : 'green'}
        />
      </div>

      {/* User Analytics, Engagement & Health sections */}
      {engagement && (
        <>
          {/* Section A: User Analytics */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                User Analytics
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <KPICard
                icon={Users}
                label="Total Users"
                value={engagement.totalUsers.toLocaleString()}
                detail={`${engagement.activeUsersLast7d} active in last 7 days`}
                color="blue"
              />
              <KPICard
                icon={UserPlus}
                label="New Users (7d)"
                value={engagement.newUsersLast7d}
                detail="Joined in the last week"
                color="green"
              />
              <KPICard
                icon={UserPlus}
                label="New Users (30d)"
                value={engagement.newUsersLast30d}
                detail="Joined in the last month"
                color="purple"
              />
            </div>
          </div>

          {/* Section B: Engagement Summary */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">
                Engagement Summary
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border bg-card p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Avg Engagement Score
                  </span>
                  <Activity className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-foreground tabular-nums">
                    {engagement.avgEngagementScore}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{
                          width: `${Math.min(engagement.avgEngagementScore, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      out of 100
                    </p>
                  </div>
                </div>
              </div>
              <KPICard
                icon={TrendingUp}
                label="High Engagement Orgs"
                value={engagement.highEngagementOrgs}
                detail="Score ≥ 70"
                color="green"
              />
              <KPICard
                icon={AlertTriangle}
                label="Low Engagement Orgs"
                value={engagement.lowEngagementOrgs}
                detail="Score < 30 — may need intervention"
                color="amber"
              />
            </div>
          </div>

          {/* Section C: Health Summary */}
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-semibold text-foreground">
                  Health Summary
                </h2>
              </div>
              <Link
                href="/admin/customer-health"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                View Details
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-success/20 bg-success/10 p-5 space-y-1">
                <span className="text-sm font-medium text-success">
                  Healthy
                </span>
                <div className="text-3xl font-bold text-foreground tabular-nums">
                  {engagement.healthDistribution.healthy}
                </div>
              </div>
              <div className="rounded-lg border border-info/20 bg-info/10 p-5 space-y-1">
                <span className="text-sm font-medium text-info">
                  Warning
                </span>
                <div className="text-3xl font-bold text-foreground tabular-nums">
                  {engagement.healthDistribution.warning}
                </div>
              </div>
              <div className="rounded-lg border border-warning/20 bg-warning/10 p-5 space-y-1">
                <span className="text-sm font-medium text-warning">
                  At Risk
                </span>
                <div className="text-3xl font-bold text-foreground tabular-nums">
                  {engagement.healthDistribution.atRisk}
                </div>
              </div>
              <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-5 space-y-1">
                <span className="text-sm font-medium text-destructive">
                  Critical
                </span>
                <div className="text-3xl font-bold text-foreground tabular-nums">
                  {engagement.healthDistribution.critical}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Organization Growth
          </h2>
          <div className="h-48 flex items-end gap-2 overflow-hidden">
            {data.orgsByDay.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-primary/40 hover:bg-primary/60 rounded-t transition-colors"
                  style={{
                    height: `${Math.max(Math.round((day.count / maxOrgCount) * 140), 4)}px`,
                  }}
                />
                <span className="text-[10px] text-muted-foreground mt-2">
                  {new Date(day.date + 'T00:00:00').toLocaleDateString(
                    'en-US',
                    {
                      month: 'short',
                      day: 'numeric',
                    },
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Plan Distribution
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Starter</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {basicCount}
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${
                      (basicCount / Math.max(data.totalOrgs, 1)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Pro</span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {proCount}
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${(proCount / Math.max(data.totalOrgs, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  Enterprise
                </span>
                <span className="text-sm font-semibold text-foreground tabular-nums">
                  {enterpriseCount}
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${
                      (enterpriseCount / Math.max(data.totalOrgs, 1)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <RiskHeatmap cells={[...riskHeatmapCells]} />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              Risk Alert Triage
            </h2>
          </div>
          <div className="space-y-3">
            {riskQueue.map((risk) => (
              <Link
                key={risk.label}
                href={risk.href}
                className="flex items-center justify-between rounded-lg border border-border bg-card/60 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {risk.label}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {risk.guidance}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold tabular-nums ${
                      risk.severity === 'high'
                        ? 'bg-destructive/10 text-destructive'
                        : risk.severity === 'medium'
                          ? 'bg-warning/10 text-warning'
                          : 'bg-success/10 text-success'
                    }`}
                  >
                    {risk.value}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              Operator Shortcuts
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {quickOps.map((shortcut) => (
              <Link
                key={shortcut.href}
                href={shortcut.href}
                className="rounded-lg border border-border bg-card/60 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex items-center justify-between gap-2">
                  <span>{shortcut.label}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Command-center shortcuts prioritize the highest-frequency platform
            operations workflows.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Orchestration Queue
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Highest-impact operator workflows ranked by live counts.
            </p>
          </div>
          <Link
            href="/admin/support"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open Support
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {orchestrationQueue.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="rounded-lg border border-border bg-card/60 p-4 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                      Owner: {item.ownerLabel}
                    </span>
                    <span className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                      SLA: {item.slaLabel}
                    </span>
                  </div>
                </div>
                <span
                  className={`rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${riskGradeStyles(item.grade)}`}
                >
                  {riskGradeLabel(item.grade)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-2xl font-bold text-foreground tabular-nums">
                  {item.count}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                  Open queue
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Cross-Tenant Health View
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Aggregated platform risk posture across revenue, conversion, and
              enterprise operations.
            </p>
          </div>
          <Link
            href="/admin/security/triage"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open Triage
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {crossTenantHealth.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="rounded-lg border border-border bg-card/60 p-4 transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {item.area}
                </p>
                <span
                  className={`rounded border px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${statusStyles[item.status]}`}
                >
                  {item.status}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {item.note}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
