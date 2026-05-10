import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';

const EVIDENCE_CAP = 50;
const PRIVILEGED_ROLES = new Set(['owner', 'admin', 'founder', 'super_admin']);
const WARN_THRESHOLD = 5;
const FAIL_THRESHOLD = 10;

type Member = { id: string; user_id: string; role: string | null };

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data: membersData, error: membersError } = await db
    .from('org_members')
    .select('id, user_id, role')
    .eq('organization_id', orgId)
    .eq('compliance_status', 'active');

  if (membersError) {
    return notEvaluated(
      evaluatedAt,
      'org_members_unavailable',
      `Could not read org_members: ${membersError.message}`,
    );
  }

  const members = (membersData ?? []) as Member[];
  if (members.length === 0) {
    return notEvaluated(
      evaluatedAt,
      'no_active_members',
      'Organization has no active members.',
    );
  }

  const privileged = members.filter((m) =>
    PRIVILEGED_ROLES.has((m.role ?? '').toLowerCase()),
  );

  const gaps: ControlGap[] = [];
  let status: ControlResult['status'];
  let reason: string;

  if (privileged.length === 0) {
    status = 'fail';
    reason = `No active members carry a privileged role (owner/admin/founder).`;
    gaps.push({
      code: 'no_privileged_users',
      message:
        'Every organization needs at least one accountable owner — none was found.',
      severity: 'high',
    });
  } else if (privileged.length <= WARN_THRESHOLD) {
    status = 'pass';
    reason = `${privileged.length} privileged member(s) — within the recommended ≤${WARN_THRESHOLD} threshold.`;
  } else if (privileged.length <= FAIL_THRESHOLD) {
    status = 'partial';
    reason = `${privileged.length} privileged members exceed the recommended threshold of ${WARN_THRESHOLD}.`;
    gaps.push({
      code: 'too_many_privileged_users',
      message: `Reduce privileged role count to ≤${WARN_THRESHOLD} where possible; review necessity for each.`,
      severity: 'medium',
    });
  } else {
    status = 'fail';
    reason = `${privileged.length} privileged members exceed the fail threshold of ${FAIL_THRESHOLD}.`;
    gaps.push({
      code: 'excessive_privileged_users',
      message: `Privileged role count (${privileged.length}) breaches least-privilege expectations; immediate review required.`,
      severity: 'critical',
    });
  }

  const evidenceRefs: EvidenceRef[] = privileged
    .slice(0, EVIDENCE_CAP)
    .map((m) => ({
      source: 'org_members',
      ref: m.id,
    }));

  return {
    controlCode: 'CC6.6',
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
    controlCode: 'CC6.6',
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
  controlCode: 'CC6.6',
  evaluator: evaluate,
};

export { evaluate };
