import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { computeHealthRankings } from '@/lib/customer-health/compute-rankings';
import { requireFounderAccess } from '@/app/app/admin/access';
import {
  BarChart3,
  AlertTriangle,
  TrendingDown,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import Link from 'next/link';

export const metadata = { title: 'Customer Health – Admin' };
export const dynamic = 'force-dynamic';

function TrendIcon({ trend }: { trend?: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <ArrowUpRight className="h-4 w-4 text-success" />;
  if (trend === 'down') return <ArrowDownRight className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function statusBadge(status: string) {
  const styles: Record<string, string> = {
    Healthy:
      'bg-success/10 text-success',
    Warning: 'bg-warning/10 text-warning',
    'At Risk': 'bg-warning/20 text-warning',
    Critical:
      'bg-destructive/10 text-destructive',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        styles[status] ?? 'bg-muted text-foreground'
      }`}
    >
      {status}
    </span>
  );
}

export default async function CustomerHealthPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');

  // Throws if not a founder; admin layout error boundary handles it.
  await requireFounderAccess();

  const adminClient = createSupabaseAdminClient();
  const rankings = await computeHealthRankings(adminClient);

  const { summary, organizations } = rankings;
  const total = summary.total;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customer health</h1>
        <p className="text-muted-foreground">
          Real-time health scoring across all active organizations. Calculated{' '}
          {new Date(rankings.calculatedAt).toLocaleString()}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <BarChart3 className="h-4 w-4" /> Average Score
          </div>
          <p className="text-2xl font-bold">{summary.averageScore}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-success text-sm mb-1">
            <Users className="h-4 w-4" /> Healthy
          </div>
          <p className="text-2xl font-bold">{summary.healthy}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-warning text-sm mb-1">
            <AlertTriangle className="h-4 w-4" /> Warning / At Risk
          </div>
          <p className="text-2xl font-bold">
            {summary.warning + summary.atRisk}
          </p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-destructive text-sm mb-1">
            <TrendingDown className="h-4 w-4" /> Critical
          </div>
          <p className="text-2xl font-bold">{summary.critical}</p>
        </div>
      </div>

      <div className="border border-border rounded-lg p-4 bg-card">
        <h3 className="text-sm font-medium mb-3">Health Distribution</h3>
        <div className="flex h-4 rounded-full overflow-hidden bg-muted">
          {total > 0 && (
            <>
              <div
                className="bg-success"
                style={{ width: `${(summary.healthy / total) * 100}%` }}
              />
              <div
                className="bg-warning/50"
                style={{ width: `${(summary.warning / total) * 100}%` }}
              />
              <div
                className="bg-warning"
                style={{ width: `${(summary.atRisk / total) * 100}%` }}
              />
              <div
                className="bg-destructive"
                style={{ width: `${(summary.critical / total) * 100}%` }}
              />
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-success" />
            Healthy {summary.healthy}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-warning/50" />
            Warning {summary.warning}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-warning" />
            At Risk {summary.atRisk}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-destructive" />
            Critical {summary.critical}
          </span>
          <span className="flex items-center gap-1">
            Trialing {summary.trialing} · Active{' '}
            {summary.activeSubscriptions}
          </span>
        </div>
      </div>

      {organizations.length === 0 ? (
        <div className="border border-border rounded-lg p-8 bg-card text-center text-muted-foreground">
          No organizations to score yet.
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left px-4 py-3 font-medium">
                  Organization
                </th>
                <th className="text-left px-4 py-3 font-medium">Plan</th>
                <th className="text-left px-4 py-3 font-medium">Score</th>
                <th className="text-left px-4 py-3 font-medium">Compliance</th>
                <th className="text-left px-4 py-3 font-medium">Logins</th>
                <th className="text-left px-4 py-3 font-medium">
                  Last activity
                </th>
                <th className="text-left px-4 py-3 font-medium">Alerts</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {organizations.map((org) => (
                <tr key={org.orgId} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orgs/${org.orgId}`}
                      className="font-medium hover:underline"
                    >
                      {org.orgName}
                    </Link>
                    {org.isTrialing &&
                      typeof org.trialDaysRemaining === 'number' && (
                        <div className="text-[11px] text-muted-foreground">
                          Trial — {org.trialDaysRemaining}d left
                        </div>
                      )}
                  </td>
                  <td className="px-4 py-3 capitalize">{org.plan}</td>
                  <td className="px-4 py-3 font-semibold">
                    <span
                      className={
                        org.score >= 75
                          ? 'text-success'
                          : org.score >= 50
                            ? 'text-warning'
                            : org.score >= 25
                              ? 'text-warning'
                              : 'text-destructive'
                      }
                    >
                      {org.score}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1">
                      {org.factors.complianceTrend.percentage}%
                      <TrendIcon trend={org.factors.complianceTrend.trend} />
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {org.factors.loginFrequency.percentage}%
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {org.lastLoginAt
                      ? new Date(org.lastLoginAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {org.alerts.length > 0 ? (
                      <span className="text-destructive">
                        {org.alerts.length}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{statusBadge(org.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
