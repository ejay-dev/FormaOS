import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';

const EVIDENCE_CAP = 50;

type Member = { id: string; user_id: string; created_at: string };
type Invitation = {
  id: string;
  accepted_by: string | null;
  accepted_at: string | null;
  status: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data: membersData, error: membersError } = await db
    .from('org_members')
    .select('id, user_id, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true });

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
      'no_members',
      'Organization has no members.',
    );
  }

  // The first member is the founder/creator and won't have an invitation —
  // exempt them from the registration-evidence check.
  const founder = members[0];
  const subsequent = members.slice(1);

  if (subsequent.length === 0) {
    return {
      controlCode: 'CC6.2',
      status: 'pass',
      evidenceRefs: [{ source: 'org_members', ref: founder.id }],
      gaps: [],
      confidence: 0.7,
      reason:
        'Single-member organization (founder only); no subsequent registrations to evaluate.',
      evaluatedAt,
    };
  }

  const userIds = subsequent.map((m) => m.user_id);
  const { data: invitationsData, error: invitationsError } = await db
    .from('team_invitations')
    .select('id, accepted_by, accepted_at, status')
    .eq('organization_id', orgId)
    .in('accepted_by', userIds);

  if (invitationsError) {
    return notEvaluated(
      evaluatedAt,
      'team_invitations_unavailable',
      `Could not read team_invitations: ${invitationsError.message}`,
    );
  }

  const invitations = (invitationsData ?? []) as Invitation[];
  const acceptedByUser = new Map<string, Invitation>();
  for (const inv of invitations) {
    if (inv.accepted_by && inv.accepted_at) {
      acceptedByUser.set(inv.accepted_by, inv);
    }
  }

  const matched = subsequent.filter((m) => acceptedByUser.has(m.user_id));
  const matchRate = matched.length / subsequent.length;

  const gaps: ControlGap[] = [];
  const unmatched = subsequent.length - matched.length;
  if (unmatched > 0) {
    gaps.push({
      code: 'no_invitation_record',
      message: `${unmatched} member(s) joined without a matching team_invitations row — registration provenance is missing.`,
      severity: 'high',
    });
  }

  const evidenceRefs: EvidenceRef[] = invitations
    .slice(0, EVIDENCE_CAP)
    .map((inv) => ({
      source: 'team_invitations',
      ref: inv.id,
      capturedAt: inv.accepted_at ?? undefined,
    }));

  let status: ControlResult['status'];
  if (matchRate >= 0.95) status = 'pass';
  else if (matchRate >= 0.6) status = 'partial';
  else status = 'fail';

  return {
    controlCode: 'CC6.2',
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * matchRate),
    reason: `${matched.length}/${subsequent.length} non-founder members have a matching invitation record (${Math.round(matchRate * 100)}%).`,
    evaluatedAt,
  };
};

function notEvaluated(
  evaluatedAt: string,
  code: string,
  message: string,
): ControlResult {
  return {
    controlCode: 'CC6.2',
    status: 'not_evaluated',
    evidenceRefs: [],
    gaps: [{ code, message, severity: 'medium' }],
    confidence: 0,
    reason: message,
    evaluatedAt,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2',
  controlCode: 'CC6.2',
  evaluator: evaluate,
};

export { evaluate };
