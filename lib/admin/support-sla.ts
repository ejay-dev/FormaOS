import { createSupabaseAdminClient } from '@/lib/supabase/admin';

type SLATier = {
  responseHours: number;
  resolutionDays: number;
};

const SLA_DEFINITIONS: Record<string, SLATier> = {
  starter: { responseHours: 48, resolutionDays: 5 },
  pro: { responseHours: 24, resolutionDays: 3 },
  enterprise: { responseHours: 4, resolutionDays: 1 },
};

type SLAStatus = 'on_track' | 'at_risk' | 'breached';

/**
 * Calculate the SLA status for a support case.
 */
export async function calculateSLAStatus(caseId: string) {
  const db = createSupabaseAdminClient();

  const { data: supportCase } = await db
    .from('admin_support_cases')
    .select(
      'id, org_id, created_at, first_response_at, resolved_at, status, priority',
    )
    .eq('id', caseId)
    .single();

  if (!supportCase) return null;

  // Determine plan for the org
  const { data: org } = await db
    .from('organizations')
    .select('plan')
    .eq('id', supportCase.org_id)
    .single();

  const plan = (org?.plan ?? 'starter').toLowerCase();
  const sla = SLA_DEFINITIONS[plan] ?? SLA_DEFINITIONS.starter;

  const createdAt = new Date(supportCase.created_at);
  const now = new Date();
  const elapsedHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

  // Response SLA
  const responseDeadline = sla.responseHours;
  const hasResponded = !!supportCase.first_response_at;
  const responseElapsed = hasResponded
    ? (new Date(supportCase.first_response_at).getTime() -
        createdAt.getTime()) /
      (1000 * 60 * 60)
    : elapsedHours;

  let responseStatus: SLAStatus = 'on_track';
  if (responseElapsed > responseDeadline) responseStatus = 'breached';
  else if (responseElapsed > responseDeadline * 0.75)
    responseStatus = 'at_risk';

  // Resolution SLA
  const resolutionDeadlineHours = sla.resolutionDays * 24;
  const isResolved = !!supportCase.resolved_at;
  const resolutionElapsed = isResolved
    ? (new Date(supportCase.resolved_at).getTime() - createdAt.getTime()) /
      (1000 * 60 * 60)
    : elapsedHours;

  let resolutionStatus: SLAStatus = 'on_track';
  if (resolutionElapsed > resolutionDeadlineHours)
    resolutionStatus = 'breached';
  else if (resolutionElapsed > resolutionDeadlineHours * 0.75)
    resolutionStatus = 'at_risk';

  // Overall status is the worst of the two
  const overall: SLAStatus =
    responseStatus === 'breached' || resolutionStatus === 'breached'
      ? 'breached'
      : responseStatus === 'at_risk' || resolutionStatus === 'at_risk'
        ? 'at_risk'
        : 'on_track';

  return {
    caseId,
    plan,
    sla,
    response: {
      status: responseStatus,
      elapsedHours: Math.round(responseElapsed),
      deadlineHours: responseDeadline,
      responded: hasResponded,
    },
    resolution: {
      status: resolutionStatus,
      elapsedHours: Math.round(resolutionElapsed),
      deadlineHours: resolutionDeadlineHours,
      resolved: isResolved,
    },
    overall,
  };
}

/**
 * Get all SLA breaches within a date range.
 */
export async function getSLABreaches(from?: string, to?: string) {
  const db = createSupabaseAdminClient();

  let query = db
    .from('admin_support_cases')
    .select(
      'id, org_id, created_at, first_response_at, resolved_at, status, subject',
    )
    .in('status', ['open', 'in_progress', 'escalated']);

  if (from) query = query.gte('created_at', from);
  if (to) query = query.lte('created_at', to);

  const { data: cases } = await query;
  const breaches: Array<{
    caseId: string;
    subject: string;
    overall: SLAStatus;
  }> = [];

  for (const c of cases ?? []) {
    const slaStatus = await calculateSLAStatus(c.id);
    if (slaStatus?.overall === 'breached') {
      breaches.push({ caseId: c.id, subject: c.subject, overall: 'breached' });
    }
  }

  return breaches;
}

/**
 * Get SLA performance metrics over a date range.
 */
export async function getSLAMetrics(from: string, to: string) {
  const db = createSupabaseAdminClient();

  const { data: cases } = await db
    .from('admin_support_cases')
    .select('id, created_at, first_response_at, resolved_at, status')
    .gte('created_at', from)
    .lte('created_at', to);

  const allCases = cases ?? [];
  if (allCases.length === 0) {
    return {
      totalCases: 0,
      avgResponseHours: 0,
      avgResolutionHours: 0,
      breachRate: 0,
    };
  }

  let totalResponseHours = 0;
  let respondedCount = 0;
  let totalResolutionHours = 0;
  let resolvedCount = 0;
  let breachCount = 0;

  for (const c of allCases) {
    if (c.first_response_at) {
      const hours =
        (new Date(c.first_response_at).getTime() -
          new Date(c.created_at).getTime()) /
        (1000 * 60 * 60);
      totalResponseHours += hours;
      respondedCount++;
    }
    if (c.resolved_at) {
      const hours =
        (new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime()) /
        (1000 * 60 * 60);
      totalResolutionHours += hours;
      resolvedCount++;
    }
    const sla = await calculateSLAStatus(c.id);
    if (sla?.overall === 'breached') breachCount++;
  }

  return {
    totalCases: allCases.length,
    avgResponseHours:
      respondedCount > 0 ? Math.round(totalResponseHours / respondedCount) : 0,
    avgResolutionHours:
      resolvedCount > 0 ? Math.round(totalResolutionHours / resolvedCount) : 0,
    breachRate: Math.round((breachCount / allCases.length) * 100),
  };
}

/**
 * Escalate a case that is at risk or breached.
 */
export async function escalateCase(
  caseId: string,
  adminId: string,
  reason: string,
) {
  const db = createSupabaseAdminClient();

  await db
    .from('admin_support_cases')
    .update({
      status: 'escalated',
      escalated_by: adminId,
      escalated_at: new Date().toISOString(),
      escalation_reason: reason,
    })
    .eq('id', caseId);

  await db.from('admin_audit_log').insert({
    admin_id: adminId,
    action: 'case_escalated',
    resource_type: 'support_case',
    resource_id: caseId,
    metadata: { reason },
  });

  return { caseId, escalated: true };
}
