import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';

const EVIDENCE_CAP = 50;
const REVIEW_WINDOW_DAYS = 365;

const ACTIVE_POLICY_STATUSES = ['active', 'published'];

type Policy = { id: string; status: string | null; title: string | null };
type ReviewSchedule = {
  id: string;
  policy_id: string;
  last_reviewed_at: string | null;
  next_review_date: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data: policiesData, error: policiesError } = await db
    .from('org_policies')
    .select('id, status, title')
    .eq('organization_id', orgId)
    .in('status', ACTIVE_POLICY_STATUSES);

  if (policiesError) {
    return notEvaluated(
      evaluatedAt,
      'org_policies_unavailable',
      `Could not read org_policies: ${policiesError.message}`,
    );
  }

  const policies = (policiesData ?? []) as Policy[];

  if (policies.length === 0) {
    return notEvaluated(
      evaluatedAt,
      'no_active_policies',
      'Organization has no active/published policies; nothing to evaluate.',
    );
  }

  const policyIds = policies.map((p) => p.id);
  const { data: schedulesData, error: schedulesError } = await db
    .from('policy_review_schedules')
    .select('id, policy_id, last_reviewed_at, next_review_date')
    .eq('org_id', orgId)
    .in('policy_id', policyIds);

  if (schedulesError) {
    return notEvaluated(
      evaluatedAt,
      'policy_review_schedules_unavailable',
      `Could not read policy_review_schedules: ${schedulesError.message}`,
    );
  }

  const schedules = (schedulesData ?? []) as ReviewSchedule[];
  const scheduleByPolicy = new Map(schedules.map((s) => [s.policy_id, s]));

  const cutoff = Date.now() - REVIEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const overdue: Policy[] = [];
  const missingSchedule: Policy[] = [];

  for (const policy of policies) {
    const sched = scheduleByPolicy.get(policy.id);
    if (!sched) {
      missingSchedule.push(policy);
      continue;
    }
    if (
      !sched.last_reviewed_at ||
      new Date(sched.last_reviewed_at).getTime() < cutoff
    ) {
      overdue.push(policy);
    }
  }

  const total = policies.length;
  const compliant = total - missingSchedule.length - overdue.length;
  const compliantRate = compliant / total;

  const gaps: ControlGap[] = [];
  if (missingSchedule.length > 0) {
    gaps.push({
      code: 'no_review_schedule',
      message: `${missingSchedule.length} active policy/policies have no review schedule entry.`,
      severity: 'medium',
    });
  }
  if (overdue.length > 0) {
    gaps.push({
      code: 'overdue_review',
      message: `${overdue.length} active policy/policies have not been reviewed in the last ${REVIEW_WINDOW_DAYS} days.`,
      severity: 'high',
    });
  }

  let status: ControlResult['status'];
  let reason: string;
  if (compliantRate >= 0.95) {
    status = 'pass';
    reason = `All ${total} active policies reviewed within the last ${REVIEW_WINDOW_DAYS} days.`;
  } else if (compliantRate >= 0.6) {
    status = 'partial';
    reason = `${compliant}/${total} active policies meet the ${REVIEW_WINDOW_DAYS}-day review window.`;
  } else {
    status = 'fail';
    reason = `Only ${compliant}/${total} active policies meet the ${REVIEW_WINDOW_DAYS}-day review window.`;
  }

  const evidenceRefs: EvidenceRef[] = schedules
    .slice(0, EVIDENCE_CAP)
    .map((s) => ({
      source: 'policy_review_schedules',
      ref: s.id,
      capturedAt: s.last_reviewed_at ?? undefined,
    }));

  return {
    controlCode: 'CC8.1',
    status,
    evidenceRefs,
    gaps,
    confidence: 1,
    reason,
    evaluatedAt,
  };
};

function notEvaluated(
  evaluatedAt: string,
  code: string,
  message: string,
): ControlResult {
  return {
    controlCode: 'CC8.1',
    status: 'not_evaluated',
    evidenceRefs: [],
    gaps: [{ code, message, severity: 'medium' }],
    confidence: 0,
    reason: message,
    evaluatedAt,
  };
}

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2',
  controlCode: 'CC8.1',
  evaluator: evaluate,
};

export { evaluate };
