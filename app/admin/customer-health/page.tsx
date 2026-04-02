import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { fetchSystemState } from '@/lib/auth/system-state';
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

interface OrgHealth {
  id: string;
  name: string;
  plan: string;
  health_score: number;
  trend: 'up' | 'down' | 'stable';
  last_login_count_30d: number;
  compliance_score: number;
  mrr_cents: number;
  risk_level: 'healthy' | 'at_risk' | 'critical';
}

export default async function CustomerHealthPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');

  const db = createSupabaseServerClient();

  // Fetch org health data (joined from multiple sources)
  const { data: orgs } = await db
    .from('organizations')
    .select('id, name, plan_id')
    .eq('lifecycle_status', 'active')
    .order('name');

  // Simulate health scoring - in production, org_health_scores table
  const healthData: OrgHealth[] = (orgs ?? []).map((org) => {
    const score = Math.floor(Math.random() * 60 + 40); // placeholder
    return {
      id: org.id,
      name: org.name,
      plan: org.plan_id ?? 'starter',
      health_score: score,
      trend: score > 70 ? 'up' : score > 50 ? 'stable' : 'down',
      last_login_count_30d: Math.floor(Math.random() * 100),
      compliance_score: Math.floor(Math.random() * 40 + 60),
      mrr_cents: Math.floor(Math.random() * 50000),
      risk_level:
        score >= 70 ? 'healthy' : score >= 50 ? 'at_risk' : 'critical',
    };
  });

  const totalOrgs = healthData.length;
  const healthyCount = healthData.filter(
    (o) => o.risk_level === 'healthy',
  ).length;
  const atRiskCount = healthData.filter(
    (o) => o.risk_level === 'at_risk',
  ).length;
  const criticalCount = healthData.filter(
    (o) => o.risk_level === 'critical',
  ).length;
  const avgScore = totalOrgs
    ? Math.round(healthData.reduce((s, o) => s + o.health_score, 0) / totalOrgs)
    : 0;

  function TrendIcon({ trend }: { trend: string }) {
    if (trend === 'up')
      return <ArrowUpRight className="h-4 w-4 text-green-500" />;
    if (trend === 'down')
      return <ArrowDownRight className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  }

  function riskBadge(level: string) {
    switch (level) {
      case 'healthy':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Healthy
          </span>
        );
      case 'at_risk':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
            At Risk
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
            Critical
          </span>
        );
      default:
        return null;
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Customer Health Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor organization health scores and identify at-risk accounts.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <BarChart3 className="h-4 w-4" /> Average Score
          </div>
          <p className="text-2xl font-bold">{avgScore}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-green-600 text-sm mb-1">
            <Users className="h-4 w-4" /> Healthy
          </div>
          <p className="text-2xl font-bold">{healthyCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-yellow-600 text-sm mb-1">
            <AlertTriangle className="h-4 w-4" /> At Risk
          </div>
          <p className="text-2xl font-bold">{atRiskCount}</p>
        </div>
        <div className="border border-border rounded-lg p-4 bg-card">
          <div className="flex items-center gap-2 text-red-600 text-sm mb-1">
            <TrendingDown className="h-4 w-4" /> Critical
          </div>
          <p className="text-2xl font-bold">{criticalCount}</p>
        </div>
      </div>

      {/* Health Distribution Bar */}
      <div className="border border-border rounded-lg p-4 bg-card">
        <h3 className="text-sm font-medium mb-3">Health Distribution</h3>
        <div className="flex h-4 rounded-full overflow-hidden bg-muted">
          {totalOrgs > 0 && (
            <>
              <div
                className="bg-green-500"
                style={{ width: `${(healthyCount / totalOrgs) * 100}%` }}
              />
              <div
                className="bg-yellow-500"
                style={{ width: `${(atRiskCount / totalOrgs) * 100}%` }}
              />
              <div
                className="bg-red-500"
                style={{ width: `${(criticalCount / totalOrgs) * 100}%` }}
              />
            </>
          )}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Healthy {healthyCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            At Risk {atRiskCount}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Critical {criticalCount}
          </span>
        </div>
      </div>

      {/* Org Table */}
      <div className="border border-border rounded-lg bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Organization</th>
              <th className="text-left px-4 py-3 font-medium">Plan</th>
              <th className="text-left px-4 py-3 font-medium">Health</th>
              <th className="text-left px-4 py-3 font-medium">Trend</th>
              <th className="text-left px-4 py-3 font-medium">Logins (30d)</th>
              <th className="text-left px-4 py-3 font-medium">Compliance</th>
              <th className="text-left px-4 py-3 font-medium">MRR</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {healthData
              .sort((a, b) => a.health_score - b.health_score)
              .map((org) => (
                <tr key={org.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/orgs/${org.id}`}
                      className="font-medium hover:underline"
                    >
                      {org.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 capitalize">{org.plan}</td>
                  <td className="px-4 py-3 font-semibold">
                    <span
                      className={
                        org.health_score >= 70
                          ? 'text-green-600'
                          : org.health_score >= 50
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }
                    >
                      {org.health_score}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <TrendIcon trend={org.trend} />
                  </td>
                  <td className="px-4 py-3">{org.last_login_count_30d}</td>
                  <td className="px-4 py-3">{org.compliance_score}%</td>
                  <td className="px-4 py-3">
                    ${(org.mrr_cents / 100).toFixed(0)}
                  </td>
                  <td className="px-4 py-3">{riskBadge(org.risk_level)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
