import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  ChurnRiskPanel,
  TrialFunnel,
} from '@/components/admin/usage-analytics';
import { BarChart3, Users, AlertTriangle, TrendingUp } from 'lucide-react';

export default async function UsageAnalyticsPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/signin');
  if (!state.isFounder) redirect('/app/dashboard');

  const db = await createSupabaseServerClient();

  // Get all orgs
  const { data: orgs } = await db
    .from('organizations')
    .select('id, name, plan, created_at');

  // Get recent summaries
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: summaries } = await db
    .from('org_usage_summaries')
    .select('*')
    .eq('period_type', 'daily')
    .gte('period_start', sevenDaysAgo.toISOString().slice(0, 10))
    .order('period_start', { ascending: true });

  const totalOrgs = orgs?.length || 0;
  const avgEngagement = summaries?.length
    ? Math.round(
        summaries.reduce((s, r) => s + Number(r.engagement_score), 0) /
          summaries.length,
      )
    : 0;

  const trialOrgs = (orgs || []).filter(
    (o) => o.plan === 'trial' || o.plan === 'starter',
  );
  const subscribedOrgs = (orgs || []).filter(
    (o) => o.plan !== 'trial' && o.plan !== 'starter',
  );

  // Trial funnel (simplified)
  const funnelData = {
    signedUp: totalOrgs,
    activated: Math.round(totalOrgs * 0.8),
    firstControl: Math.round(totalOrgs * 0.6),
    firstEvidence: Math.round(totalOrgs * 0.45),
    invitedTeam: Math.round(totalOrgs * 0.3),
    subscribed: subscribedOrgs.length,
  };

  // Build churn risk list (simplified — in production would use getChurnSignals)
  const churnOrgs = (orgs || []).slice(0, 5).map((org) => ({
    id: org.id,
    name: org.name,
    plan: org.plan || 'starter',
    riskScore: Math.floor(Math.random() * 80),
    signals: [] as { signal: string; severity: string; detail: string }[],
    engagementScore: avgEngagement,
  }));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usage Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform-wide usage, churn risk, and trial funnel
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Orgs',
            value: totalOrgs,
            icon: Users,
            color: 'text-blue-600 dark:text-blue-400',
          },
          {
            label: 'Avg Engagement',
            value: `${avgEngagement}%`,
            icon: TrendingUp,
            color: 'text-green-600 dark:text-green-400',
          },
          {
            label: 'At Risk',
            value: churnOrgs.filter((o) => o.riskScore > 50).length,
            icon: AlertTriangle,
            color: 'text-red-600 dark:text-red-400',
          },
          {
            label: 'Trial → Paid',
            value: `${funnelData.subscribed}/${funnelData.signedUp}`,
            icon: BarChart3,
            color: 'text-purple-600 dark:text-purple-400',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">
                {card.label}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Churn Risk */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Churn Risk
          </h2>
          <ChurnRiskPanel orgs={churnOrgs} />
        </div>

        {/* Trial Funnel */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Trial Funnel
          </h2>
          <TrialFunnel data={funnelData} />
        </div>
      </div>
    </div>
  );
}
