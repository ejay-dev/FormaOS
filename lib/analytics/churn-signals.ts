import { createSupabaseAdminClient } from '@/lib/supabase/admin';

interface ChurnSignal {
  signal: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  detail: string;
}

export async function getChurnRiskScore(orgId: string): Promise<number> {
  const signals = await getChurnSignals(orgId);
  const weights: Record<string, number> = {
    critical: 30,
    high: 20,
    medium: 10,
    low: 5,
  };
  let score = 0;
  for (const s of signals) {
    score += weights[s.severity] || 0;
  }
  return Math.min(100, score);
}

export async function getChurnSignals(orgId: string): Promise<ChurnSignal[]> {
  const db = createSupabaseAdminClient();
  const signals: ChurnSignal[] = [];

  // Login decline check
  const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
  const twentyEightDaysAgo = new Date(Date.now() - 28 * 86400000).toISOString();

  const { count: recentLogins } = await db
    .from('org_usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('event_type', 'page_view')
    .gte('created_at', fourteenDaysAgo);

  const { count: priorLogins } = await db
    .from('org_usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('event_type', 'page_view')
    .gte('created_at', twentyEightDaysAgo)
    .lt('created_at', fourteenDaysAgo);

  if (priorLogins && recentLogins !== null && priorLogins > 0) {
    const change = ((recentLogins - priorLogins) / priorLogins) * 100;
    if (change < -50) {
      signals.push({
        signal: 'login_decline',
        severity: 'critical',
        detail: `${Math.round(change)}% logins last 14d`,
      });
    } else if (change < -25) {
      signals.push({
        signal: 'login_decline',
        severity: 'high',
        detail: `${Math.round(change)}% logins last 14d`,
      });
    }
  }

  // No activity in 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { count: weekActivity } = await db
    .from('org_usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .gte('created_at', sevenDaysAgo);

  if ((weekActivity || 0) === 0) {
    signals.push({
      signal: 'no_recent_activity',
      severity: 'critical',
      detail: 'No activity in 7 days',
    });
  }

  // Check for support ticket spike
  const { count: recentTickets } = await db
    .from('org_usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .eq('event_type', 'support_ticket')
    .gte('created_at', fourteenDaysAgo);

  if ((recentTickets || 0) > 5) {
    signals.push({
      signal: 'support_spike',
      severity: 'high',
      detail: `${recentTickets} support tickets in 14d`,
    });
  }

  // Stalled onboarding
  const { data: org } = await db
    .from('organizations')
    .select('created_at')
    .eq('id', orgId)
    .single();

  if (org) {
    const daysSinceCreation = Math.floor(
      (Date.now() - new Date(org.created_at).getTime()) / 86400000,
    );
    if (daysSinceCreation > 14 && daysSinceCreation < 60) {
      const { count: totalEvents } = await db
        .from('org_usage_events')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId);

      if ((totalEvents || 0) < 20) {
        signals.push({
          signal: 'stalled_onboarding',
          severity: 'medium',
          detail: `Only ${totalEvents} events after ${daysSinceCreation} days`,
        });
      }
    }
  }

  return signals;
}

export async function getTrialHealthScore(orgId: string) {
  const db = createSupabaseAdminClient();

  const { data: org } = await db
    .from('organizations')
    .select('created_at, plan')
    .eq('id', orgId)
    .single();

  if (!org || org.plan !== 'trial') return null;

  const daysSinceCreation = Math.floor(
    (Date.now() - new Date(org.created_at).getTime()) / 86400000,
  );

  // Check milestones
  const { count: controls } = await db
    .from('org_controls')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  const { count: evidence } = await db
    .from('org_evidence')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  const { count: members } = await db
    .from('org_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  const milestones = {
    created_control: (controls || 0) > 0,
    uploaded_evidence: (evidence || 0) > 0,
    invited_team: (members || 0) > 1,
  };

  const activationPct =
    Object.values(milestones).filter(Boolean).length /
    Object.keys(milestones).length;

  return {
    orgId,
    daysInTrial: daysSinceCreation,
    daysRemaining: Math.max(0, 14 - daysSinceCreation),
    activationPercent: Math.round(activationPct * 100),
    milestones,
    velocity: (controls || 0) + (evidence || 0),
  };
}
