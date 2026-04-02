import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type Period = 'weekly' | 'monthly';

interface DigestMetrics {
  complianceScore: number;
  complianceChange: number;
  overdueTasks: number;
  overdueChange: number;
  incidentCount: number;
  incidentChange: number;
}

interface DigestContent {
  metrics: DigestMetrics;
  topRisks: Array<{ title: string; severity: string }>;
  topWins: string[];
  upcomingDeadlines: Array<{ title: string; dueDate: string }>;
  recommendations: string[];
  orgName: string;
  period: Period;
  periodLabel: string;
}

/** Generate an executive email digest. */
export async function generateExecutiveDigest(
  orgId: string,
  period: Period,
): Promise<DigestContent> {
  const db = createSupabaseAdminClient();

  const { data: org } = await db
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();
  const orgName = org?.name ?? 'Organization';

  // Date ranges
  const now = new Date();
  const periodDays = period === 'weekly' ? 7 : 30;
  const from = new Date(
    now.getTime() - periodDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  const prevFrom = new Date(
    now.getTime() - periodDays * 2 * 24 * 60 * 60 * 1000,
  ).toISOString();

  // Current compliance score
  const { data: controls } = await db
    .from('org_controls')
    .select('status')
    .eq('organization_id', orgId);

  const total = controls?.length ?? 0;
  const satisfied =
    controls?.filter((c) => c.status === 'satisfied').length ?? 0;
  const complianceScore = total > 0 ? Math.round((satisfied / total) * 100) : 0;

  // Overdue tasks
  const { count: overdueTasks } = await db
    .from('org_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .lt('due_date', now.toISOString())
    .in('status', ['todo', 'in_progress']);

  // Incidents this period
  const { count: incidentCount } = await db
    .from('org_incidents')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('created_at', from);

  const { count: prevIncidentCount } = await db
    .from('org_incidents')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .gte('created_at', prevFrom)
    .lt('created_at', from);

  // Top risks
  const { data: riskControls } = await db
    .from('org_controls')
    .select('title, priority')
    .eq('organization_id', orgId)
    .neq('status', 'satisfied')
    .in('priority', ['critical', 'high'])
    .limit(3);

  const topRisks = (riskControls ?? []).map((c) => ({
    title: c.title,
    severity: c.priority,
  }));

  // Upcoming deadlines
  const twoWeeksOut = new Date(
    now.getTime() + 14 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: deadlineTasks } = await db
    .from('org_tasks')
    .select('title, due_date')
    .eq('organization_id', orgId)
    .gte('due_date', now.toISOString())
    .lte('due_date', twoWeeksOut)
    .order('due_date')
    .limit(5);

  const upcomingDeadlines = (deadlineTasks ?? []).map((t) => ({
    title: t.title,
    dueDate: t.due_date,
  }));

  // Top wins — controls satisfied this period
  const { data: recentlySatisfied } = await db
    .from('org_controls')
    .select('title')
    .eq('organization_id', orgId)
    .eq('status', 'satisfied')
    .gte('updated_at', from)
    .limit(3);

  const topWins = (recentlySatisfied ?? []).map(
    (c) => `Control satisfied: ${c.title}`,
  );

  // Recommendations
  const recommendations: string[] = [];
  if ((overdueTasks ?? 0) > 5)
    recommendations.push(
      'Address overdue tasks — consider task triage meeting',
    );
  if (complianceScore < 70)
    recommendations.push(
      'Compliance score below target — focus on gap remediation',
    );
  if (topRisks.length > 0)
    recommendations.push(
      'Review critical/high risk controls for immediate attention',
    );

  const periodLabel =
    period === 'weekly'
      ? `Week of ${new Date(from).toLocaleDateString()}`
      : `Month of ${new Date(from).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

  return {
    metrics: {
      complianceScore,
      complianceChange: 0, // Would compare to previous snapshot
      overdueTasks: overdueTasks ?? 0,
      overdueChange: 0,
      incidentCount: incidentCount ?? 0,
      incidentChange: (incidentCount ?? 0) - (prevIncidentCount ?? 0),
    },
    topRisks,
    topWins,
    upcomingDeadlines,
    recommendations,
    orgName,
    period,
    periodLabel,
  };
}
