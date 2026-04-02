import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function trackUsageEvent(
  orgId: string,
  userId: string | null,
  eventType: string,
  eventName: string,
  metadata?: Record<string, unknown>,
) {
  const db = createSupabaseAdminClient();
  await db.from('org_usage_events').insert({
    org_id: orgId,
    user_id: userId,
    event_type: eventType,
    event_name: eventName,
    metadata: metadata || {},
  });
}

export async function getUsageSummary(
  orgId: string,
  periodType: 'daily' | 'weekly' | 'monthly',
  startDate: string,
  endDate: string,
) {
  const db = createSupabaseAdminClient();
  const { data } = await db
    .from('org_usage_summaries')
    .select('*')
    .eq('org_id', orgId)
    .eq('period_type', periodType)
    .gte('period_start', startDate)
    .lte('period_end', endDate)
    .order('period_start', { ascending: true });

  return data || [];
}

export async function computeEngagementScore(orgId: string): Promise<number> {
  const db = createSupabaseAdminClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // DAU/MAU ratio (30%)
  const { data: dailyUsers } = await db
    .from('org_usage_events')
    .select('user_id')
    .eq('org_id', orgId)
    .gte('created_at', new Date(Date.now() - 86400000).toISOString());
  const dailyActive = new Set((dailyUsers || []).map((e) => e.user_id)).size;

  const { data: monthlyUsers } = await db
    .from('org_usage_events')
    .select('user_id')
    .eq('org_id', orgId)
    .gte('created_at', thirtyDaysAgo.toISOString());
  const monthlyActive = new Set((monthlyUsers || []).map((e) => e.user_id))
    .size;

  const dauMauRatio =
    monthlyActive > 0 ? (dailyActive / monthlyActive) * 100 : 0;

  // Feature breadth (25%)
  const { data: features } = await db
    .from('org_usage_events')
    .select('event_type')
    .eq('org_id', orgId)
    .gte('created_at', thirtyDaysAgo.toISOString());
  const uniqueFeatures = new Set((features || []).map((e) => e.event_type))
    .size;
  const featureBreadth = Math.min(100, (uniqueFeatures / 10) * 100); // 10 features = 100%

  // Session frequency (25%)
  const { data: sessions } = await db
    .from('org_usage_events')
    .select('created_at')
    .eq('org_id', orgId)
    .gte('created_at', thirtyDaysAgo.toISOString());
  const sessionDays = new Set(
    (sessions || []).map((e) => new Date(e.created_at).toDateString()),
  ).size;
  const sessionFrequency = Math.min(100, (sessionDays / 30) * 100);

  // Data creation rate (20%)
  const { count } = await db
    .from('org_usage_events')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', orgId)
    .in('event_type', ['feature_use'])
    .gte('created_at', thirtyDaysAgo.toISOString());
  const creationRate = Math.min(100, ((count || 0) / 100) * 100);

  return Math.round(
    dauMauRatio * 0.3 +
      featureBreadth * 0.25 +
      sessionFrequency * 0.25 +
      creationRate * 0.2,
  );
}

export async function getFeatureAdoption(orgId: string) {
  const db = createSupabaseAdminClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const ALL_FEATURES = [
    'tasks',
    'evidence',
    'compliance',
    'incidents',
    'reports',
    'forms',
    'care_plans',
    'policies',
    'search',
    'integrations',
  ];

  const { data: events } = await db
    .from('org_usage_events')
    .select('event_type')
    .eq('org_id', orgId)
    .gte('created_at', thirtyDaysAgo.toISOString());

  const used = new Set((events || []).map((e) => e.event_type));

  return ALL_FEATURES.map((f) => ({
    feature: f,
    adopted: used.has(f),
    usageCount: (events || []).filter((e) => e.event_type === f).length,
  }));
}
