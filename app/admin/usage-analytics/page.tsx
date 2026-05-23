import { redirect } from 'next/navigation';
import { fetchSystemState } from '@/lib/system-state/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  ChurnRiskPanel,
  TrialFunnel,
} from '@/components/admin/usage-analytics';
import { BarChart3, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  getChurnRiskScore,
  getChurnSignals,
} from '@/lib/analytics/churn-signals';

export default async function UsageAnalyticsPage() {
  const state = await fetchSystemState();
  if (!state) redirect('/auth/signin');
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

  const _trialOrgs = (orgs || []).filter(
    (o) => o.plan === 'trial' || o.plan === 'starter',
  );
  const subscribedOrgs = (orgs || []).filter(
    (o) => o.plan !== 'trial' && o.plan !== 'starter',
  );

  // Derive funnel from real org_usage_events data
  const orgIds = (orgs || []).map((o) => o.id);
  const [
    activatedResult,
    firstControlResult,
    firstEvidenceResult,
    invitedTeamResult,
  ] =
    orgIds.length > 0
      ? await Promise.all([
          db
            .from('org_usage_events')
            .select('org_id', { count: 'exact', head: false })
            .in('org_id', orgIds)
            .eq('event_type', 'onboarding_complete'),
          db
            .from('org_usage_events')
            .select('org_id', { count: 'exact', head: false })
            .in('org_id', orgIds)
            .eq('event_type', 'first_control_added'),
          db
            .from('org_usage_events')
            .select('org_id', { count: 'exact', head: false })
            .in('org_id', orgIds)
            .eq('event_type', 'first_evidence_uploaded'),
          db
            .from('org_usage_events')
            .select('org_id', { count: 'exact', head: false })
            .in('org_id', orgIds)
            .eq('event_type', 'team_member_invited'),
        ])
      : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const uniqueCount = (rows: { org_id: string }[] | null) =>
    new Set((rows ?? []).map((r) => r.org_id)).size;

  const funnelData = {
    signedUp: totalOrgs,
    activated: uniqueCount(
      (activatedResult as { data: { org_id: string }[] | null }).data,
    ),
    firstControl: uniqueCount(
      (firstControlResult as { data: { org_id: string }[] | null }).data,
    ),
    firstEvidence: uniqueCount(
      (firstEvidenceResult as { data: { org_id: string }[] | null }).data,
    ),
    invitedTeam: uniqueCount(
      (invitedTeamResult as { data: { org_id: string }[] | null }).data,
    ),
    subscribed: subscribedOrgs.length,
  };

  // Build churn risk list using real getChurnRiskScore + getChurnSignals
  const topOrgs = (orgs || []).slice(0, 5);
  const churnOrgs = await Promise.all(
    topOrgs.map(async (org) => {
      const [riskScore, signals] = await Promise.all([
        getChurnRiskScore(org.id),
        getChurnSignals(org.id),
      ]);
      return {
        id: org.id,
        name: org.name,
        plan: org.plan || 'starter',
        riskScore,
        signals: signals as {
          signal: string;
          severity: string;
          detail: string;
        }[],
        engagementScore: avgEngagement,
      };
    }),
  );

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
