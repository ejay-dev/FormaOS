/**
 * NIST CSF PR-1 — Access control enforced.
 *
 * Signal: MFA coverage across active org_members. Pass ≥95%.
 * Mirrors CIS-06 / SOC2 CC6.1 but framed for NIST.
 */

import type {
  ControlEvaluator,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import {
  EVIDENCE_CAP,
  makeAutomatedEvaluator,
  notEvaluated,
  round2,
} from './_shared';

const CODE = 'PR-1';

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
      CODE,
      evaluatedAt,
      'org_members_unavailable',
      `Could not read org_members: ${membersError.message}`,
    );
  }

  const members = (membersData ?? []) as Member[];
  if (members.length === 0) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'no_active_members',
      'No active members to evaluate.',
    );
  }

  const userIds = members.map((m) => m.user_id);
  const { data: securityData, error: securityError } = await db
    .from('user_security')
    .select('user_id, two_factor_enabled')
    .in('user_id', userIds);

  if (securityError) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'user_security_unavailable',
      `Could not read user_security: ${securityError.message}`,
    );
  }

  const securityRows = (securityData ?? []) as SecurityRow[];
  const securityByUser = new Map(securityRows.map((row) => [row.user_id, row]));

  const total = members.length;
  const withMfa = members.filter(
    (m) => securityByUser.get(m.user_id)?.two_factor_enabled === true,
  );
  const coverage = withMfa.length / total;

  const gaps: ControlGap[] = [];
  if (coverage < 0.95) {
    gaps.push({
      code: 'mfa_under_threshold',
      message: `MFA enabled on ${withMfa.length}/${total} active members (${Math.round(
        coverage * 100,
      )}%) — PR-1 expects ≥95% coverage.`,
      severity: coverage < 0.6 ? 'critical' : 'high',
    });
  }

  const evidenceRefs: EvidenceRef[] = securityRows.slice(0, EVIDENCE_CAP).map((s) => ({
    source: 'user_security',
    ref: s.user_id,
  }));

  let status: ControlResult['status'];
  if (coverage >= 0.95) status = 'pass';
  else if (coverage >= 0.6) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, total / 5)),
    reason: `MFA enabled on ${withMfa.length}/${total} active members (${Math.round(coverage * 100)}%).`,
    evaluatedAt,
  };
};

const { meta } = makeAutomatedEvaluator(CODE, evaluate);

export { meta, evaluate };
