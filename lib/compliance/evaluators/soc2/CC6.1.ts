import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';

const EVIDENCE_CAP = 50;

type Member = { id: string; user_id: string };
type SecurityRow = { user_id: string; two_factor_enabled: boolean | null };

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data: membersData, error: membersError } = await db
    .from('org_members')
    .select('id, user_id')
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
      'Organization has no active members; nothing to evaluate.',
    );
  }

  const userIds = members.map((m) => m.user_id);
  const { data: securityData, error: securityError } = await db
    .from('user_security')
    .select('user_id, two_factor_enabled')
    .in('user_id', userIds);

  if (securityError) {
    return notEvaluated(
      evaluatedAt,
      'user_security_unavailable',
      `Could not read user_security: ${securityError.message}`,
    );
  }

  const securityRows = (securityData ?? []) as SecurityRow[];
  const securityByUser = new Map(securityRows.map((row) => [row.user_id, row]));

  const total = members.length;
  const withRow = members.filter((m) => securityByUser.has(m.user_id));
  const withMfa = withRow.filter(
    (m) => securityByUser.get(m.user_id)?.two_factor_enabled === true,
  );

  const coverage = withMfa.length / total;
  const dataCompleteness = withRow.length / total;

  const gaps: ControlGap[] = [];
  const missingRow = total - withRow.length;
  if (missingRow > 0) {
    gaps.push({
      code: 'missing_user_security',
      message: `${missingRow} active member(s) have no user_security record — security onboarding is incomplete.`,
      severity: 'high',
    });
  }
  const disabled = withRow.length - withMfa.length;
  if (disabled > 0) {
    gaps.push({
      code: 'mfa_disabled',
      message: `${disabled} active member(s) have a user_security record but two_factor_enabled=false.`,
      severity: 'high',
    });
  }

  const evidenceRefs: EvidenceRef[] = securityRows
    .slice(0, EVIDENCE_CAP)
    .map((row) => ({
      source: 'user_security',
      ref: row.user_id,
    }));

  let status: ControlResult['status'];
  if (coverage >= 0.95) status = 'pass';
  else if (coverage >= 0.6) status = 'partial';
  else status = 'fail';

  if (dataCompleteness < 0.4) {
    return {
      controlCode: 'CC6.1',
      status: 'not_evaluated',
      evidenceRefs,
      gaps: [
        ...gaps,
        {
          code: 'insufficient_data',
          message:
            'Less than 40% of active members have a user_security row; cannot evaluate MFA coverage confidently.',
          severity: 'medium',
        },
      ],
      confidence: 0.3,
      reason:
        'Primary data source (user_security) is too sparse to evaluate this control.',
      evaluatedAt,
    };
  }

  return {
    controlCode: 'CC6.1',
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.5 + 0.5 * dataCompleteness),
    reason: `MFA enabled on ${withMfa.length}/${total} active members (${Math.round(coverage * 100)}%).`,
    evaluatedAt,
  };
};

function notEvaluated(
  evaluatedAt: string,
  code: string,
  message: string,
): ControlResult {
  return {
    controlCode: 'CC6.1',
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
  controlCode: 'CC6.1',
  evaluator: evaluate,
};

export { evaluate };
