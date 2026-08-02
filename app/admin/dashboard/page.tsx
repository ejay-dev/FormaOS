import { getAdminFetchConfig } from '@/app/admin/lib';
import Link from 'next/link';
import {
  Users,
  Building2,
  CreditCard,
  Clock,
  ArrowRight,
  CheckCircle2,
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
}: {
  icon: any;
  label: string;
  value: string | number;
  detail?: string;
}) {
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

  const attentionQueue = [
    {
      label: 'Failed payments',
      count: data.failedPayments,
      detail: 'Cards declined or subscriptions past due',
      href: '/admin/billing',
      urgent: true,
    },
    {
      label: 'Open security alerts',
      count: data.openSecurityAlerts,
      detail: 'Raised or acknowledged, not yet resolved',
      href: '/admin/security-live',
      urgent: true,
    },
    {
      label: 'Trials expiring within 7 days',
      count: data.trialsExpiring,
      detail: `Out of ${data.trialsActive} active trials`,
      href: '/admin/trials',
      urgent: false,
    },
    {
      label: 'Activation at risk',
      count: data.activationAtRisk,
      detail: 'Signed up but never finished setup',
      href: '/admin/orgs',
      urgent: false,
    },
    {
      label: 'Approvals waiting on you',
      count: data.pendingApprovals,
      detail: 'Delegated admin changes needing founder review',
      href: '/admin/settings',
      urgent: false,
    },
    {
      label: 'Suspended organizations',
      count: data.suspendedOrgs,
      detail: 'Access is currently blocked',
      href: '/admin/orgs',
      urgent: false,
    },
    {
      label: 'Failed exports',
      count: data.failedExports,
      detail: 'Compliance and report exports needing a retry',
      href: '/admin/exports',
      urgent: false,
    },
    {
      label: 'High-risk admin actions (7 days)',
      count: data.highRiskAdminActions7d,
      detail: 'Worth reading before they age out of the trail',
      href: '/admin/security',
      urgent: false,
    },
  ]
    .filter((item) => item.count > 0)
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || b.count - a.count);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Platform overview
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Where the platform stands right now, and what is waiting on you.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KPICard
          icon={Building2}
          label="Organizations"
          value={data.totalOrgs}
          detail={`${basicCount + proCount + enterpriseCount} on a paid plan`}
        />
        <KPICard
          icon={Clock}
          label="Active trials"
          value={data.trialsActive}
          detail={
            data.trialsExpiring > 0
              ? `${data.trialsExpiring} expiring within 7 days`
              : 'None expiring this week'
          }
        />
        <KPICard
          icon={CreditCard}
          label="Monthly recurring revenue"
          value={formatCurrency(data.mrrCents)}
          detail="Across all paid subscriptions"
        />
        <KPICard
          icon={Users}
          label="Users"
          value={
            engagement ? engagement.totalUsers.toLocaleString() : data.totalOrgs
          }
          detail={
            engagement
              ? `${engagement.activeUsersLast7d} active in the last 7 days, ${engagement.newUsersLast7d} new`
              : 'User metrics unavailable'
          }
        />
      </div>

      {/* Needs attention */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Needs attention
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Only counts above zero appear here.
        </p>
        <div className="mt-4 space-y-2">
          {attentionQueue.length > 0 ? (
            attentionQueue.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-1 px-4 py-3 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold tabular-nums ${
                      item.urgent
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {item.count}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-1 px-4 py-6 text-sm text-muted-foreground">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Nothing is waiting on you — no failed payments, open alerts or
              pending approvals.
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Organization growth
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
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('en-AU', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Plan distribution
          </h2>
          <div className="space-y-4">
            {[
              { name: 'Starter', count: basicCount },
              { name: 'Pro', count: proCount },
              { name: 'Enterprise', count: enterpriseCount },
            ].map((plan) => (
              <div key={plan.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    {plan.name}
                  </span>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {plan.count}
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${(plan.count / Math.max(data.totalOrgs, 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer health */}
      {engagement && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Customer health
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Average engagement score {engagement.avgEngagementScore} out of
                100 · {engagement.highEngagementOrgs} organizations above 70 ·{' '}
                {engagement.lowEngagementOrgs} below 30
              </p>
            </div>
            <Link
              href="/admin/customer-health"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              View details
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-success/20 bg-success/10 p-5 space-y-1">
              <span className="text-sm font-medium text-success">Healthy</span>
              <div className="text-3xl font-bold text-foreground tabular-nums">
                {engagement.healthDistribution.healthy}
              </div>
            </div>
            <div className="rounded-lg border border-border bg-surface-1 p-5 space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Watch
              </span>
              <div className="text-3xl font-bold text-foreground tabular-nums">
                {engagement.healthDistribution.warning}
              </div>
            </div>
            <div className="rounded-lg border border-warning/20 bg-warning/10 p-5 space-y-1">
              <span className="text-sm font-medium text-warning">At risk</span>
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
      )}
    </div>
  );
}
