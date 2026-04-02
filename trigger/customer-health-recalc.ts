import { schedules } from '@trigger.dev/sdk/v3';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/**
 * Daily customer health score recalculation.
 * Runs at 4:00 AM UTC — after analytics snapshots (midnight) and evidence freshness (2 AM).
 */
export const customerHealthRecalcTask = schedules.task({
  id: 'customer-health-recalc',
  cron: '0 4 * * *',
  run: async () => {
    const db = createSupabaseAdminClient();

    const { data: orgs } = await db
      .from('organizations')
      .select('id')
      .eq('lifecycle_status', 'active');

    if (!orgs?.length) return { processed: 0 };

    let processed = 0;

    for (const org of orgs) {
      try {
        // Login frequency (30 day)
        const thirtyDaysAgo = new Date(
          Date.now() - 30 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const { count: loginCount } = await db
          .from('admin_audit_log')
          .select('id', { count: 'exact', head: true })
          .eq('resource_type', 'session')
          .gte('created_at', thirtyDaysAgo);

        // Compliance score
        const { data: controls } = await db
          .from('org_controls')
          .select('status')
          .eq('organization_id', org.id);
        const totalControls = controls?.length ?? 0;
        const satisfiedControls =
          controls?.filter((c) => c.status === 'satisfied').length ?? 0;
        const complianceScore =
          totalControls > 0
            ? Math.round((satisfiedControls / totalControls) * 100)
            : 0;

        // Open support tickets
        const { count: openTickets } = await db
          .from('support_tickets')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .in('status', ['open', 'in_progress']);

        // Billing health
        const { data: sub } = await db
          .from('org_subscriptions')
          .select('status')
          .eq('organization_id', org.id)
          .eq('status', 'active')
          .maybeSingle();

        const loginScore = Math.min(100, (loginCount ?? 0) * 2);
        const featureAdoption = 50; // placeholder — requires feature tracking tables
        const supportScore = Math.max(0, 100 - (openTickets ?? 0) * 15);
        const billingScore = sub ? 100 : 30;

        const overall = Math.round(
          loginScore * 0.2 +
            featureAdoption * 0.15 +
            complianceScore * 0.3 +
            supportScore * 0.15 +
            billingScore * 0.2,
        );

        const prevScore = await db
          .from('org_health_scores')
          .select('overall')
          .eq('organization_id', org.id)
          .maybeSingle();

        const prev = prevScore.data?.overall ?? overall;
        const trend =
          overall > prev + 3 ? 'up' : overall < prev - 3 ? 'down' : 'stable';

        const riskIndicators: string[] = [];
        if (loginScore < 30) riskIndicators.push('Low login activity');
        if (complianceScore < 50) riskIndicators.push('Low compliance score');
        if ((openTickets ?? 0) > 5)
          riskIndicators.push('High open ticket count');
        if (!sub) riskIndicators.push('No active subscription');

        await db.from('org_health_scores').upsert(
          {
            organization_id: org.id,
            overall,
            trend,
            login_frequency: loginScore,
            feature_adoption: featureAdoption,
            compliance_score: complianceScore,
            support_tickets: supportScore,
            billing_health: billingScore,
            risk_indicators: riskIndicators,
            risk_level:
              overall >= 70
                ? 'healthy'
                : overall >= 50
                  ? 'at_risk'
                  : 'critical',
            needs_recalc: false,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id' },
        );

        processed++;
      } catch {
        // Continue processing other orgs
      }
    }

    return { processed, total: orgs.length };
  },
});
