import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';

const EVIDENCE_CAP = 50;
const ACK_THRESHOLD = 0.8;
const ACTIVE_POLICY_STATUSES = ['active', 'published'];

type Policy = { id: string; status: string | null; title: string | null };
type Member = { user_id: string };
type Acknowledgement = { policy_id: string; user_id: string };

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
      'Organization has no active/published policies; cannot evaluate information-source coverage.',
    );
  }

  const { data: membersData, error: membersError } = await db
    .from('org_members')
    .select('user_id')
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
      'Organization has no active members to acknowledge policies.',
    );
  }

  const policyIds = policies.map((p) => p.id);
  const { data: acksData, error: acksError } = await db
    .from('policy_acknowledgments')
    .select('policy_id, user_id')
    .eq('org_id', orgId)
    .in('policy_id', policyIds);

  if (acksError) {
    return notEvaluated(
      evaluatedAt,
      'policy_acknowledgments_unavailable',
      `Could not read policy_acknowledgments: ${acksError.message}`,
    );
  }
  const acks = (acksData ?? []) as Acknowledgement[];

  const memberIdSet = new Set(members.map((m) => m.user_id));
  const ackUsersByPolicy = new Map<string, Set<string>>();
  for (const ack of acks) {
    if (!memberIdSet.has(ack.user_id)) continue;
    if (!ackUsersByPolicy.has(ack.policy_id)) {
      ackUsersByPolicy.set(ack.policy_id, new Set());
    }
    ackUsersByPolicy.get(ack.policy_id)!.add(ack.user_id);
  }

  const totalMembers = members.length;
  const policiesAtThreshold: Policy[] = [];
  const policiesBelowThreshold: Array<{ policy: Policy; rate: number }> = [];

  for (const policy of policies) {
    const ackCount = ackUsersByPolicy.get(policy.id)?.size ?? 0;
    const rate = ackCount / totalMembers;
    if (rate >= ACK_THRESHOLD) {
      policiesAtThreshold.push(policy);
    } else {
      policiesBelowThreshold.push({ policy, rate });
    }
  }

  const compliantRate = policiesAtThreshold.length / policies.length;

  const gaps: ControlGap[] = [];
  if (policiesBelowThreshold.length > 0) {
    gaps.push({
      code: 'low_acknowledgement_coverage',
      message: `${policiesBelowThreshold.length} active policy/policies fall below ${Math.round(ACK_THRESHOLD * 100)}% member acknowledgement.`,
      severity: 'medium',
    });
  }

  let status: ControlResult['status'];
  let reason: string;
  if (compliantRate >= 0.95) {
    status = 'pass';
    reason = `All ${policies.length} active policies have ≥${Math.round(ACK_THRESHOLD * 100)}% member acknowledgement.`;
  } else if (compliantRate >= 0.6) {
    status = 'partial';
    reason = `${policiesAtThreshold.length}/${policies.length} active policies meet the ${Math.round(ACK_THRESHOLD * 100)}% acknowledgement threshold.`;
  } else {
    status = 'fail';
    reason = `Only ${policiesAtThreshold.length}/${policies.length} active policies meet the ${Math.round(ACK_THRESHOLD * 100)}% acknowledgement threshold.`;
  }

  const evidenceRefs: EvidenceRef[] = policies
    .slice(0, EVIDENCE_CAP)
    .map((p) => ({
      source: 'org_policies',
      ref: p.id,
    }));

  return {
    controlCode: 'CC2.1',
    status,
    evidenceRefs,
    gaps,
    confidence: 0.9,
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
    controlCode: 'CC2.1',
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
  controlCode: 'CC2.1',
  evaluator: evaluate,
};

export { evaluate };
