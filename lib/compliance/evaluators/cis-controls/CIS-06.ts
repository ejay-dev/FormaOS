/**
 * CIS-06 — Access control management.
 *
 * Signal: MFA coverage across active org_members + sane privileged-role
 * count. Pass requires ≥95% MFA coverage AND privileged role count
 * within the ≤5 recommended threshold. Mirrors the SOC2 CC6.1 / CC6.6
 * approach but combines both into one finding.
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

const CODE = 'CIS-06';
const PRIVILEGED_ROLES = new Set(['owner', 'admin', 'founder', 'super_admin']);
const PRIVILEGED_WARN = 5;
const PRIVILEGED_FAIL = 10;

type Member = { id: string; user_id: string; role: string | null };
type SecurityRow = { user_id: string; two_factor_enabled: boolean | null };

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data: membersData, error: membersError } = await db
    .from('org_members')
    .select('id, user_id, role')
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
      'No active org_members for this organization; cannot evaluate access control.',
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

  const securityByUser = new Map(
    ((securityData ?? []) as SecurityRow[]).map((row) => [row.user_id, row]),
  );

  const total = members.length;
  const withMfa = members.filter(
    (m) => securityByUser.get(m.user_id)?.two_factor_enabled === true,
  );
  const mfaCoverage = withMfa.length / total;

  const privileged = members.filter((m) =>
    PRIVILEGED_ROLES.has((m.role ?? '').toLowerCase()),
  );

  const gaps: ControlGap[] = [];
  if (mfaCoverage < 0.95) {
    gaps.push({
      code: 'mfa_under_threshold',
      message: `MFA enabled on ${withMfa.length}/${total} active members (${Math.round(
        mfaCoverage * 100,
      )}%) — CIS-06 expects ≥95% coverage.`,
      severity: mfaCoverage < 0.6 ? 'critical' : 'high',
    });
  }
  if (privileged.length === 0) {
    gaps.push({
      code: 'no_privileged_users',
      message: 'No active member carries a privileged role (owner/admin/founder).',
      severity: 'high',
    });
  } else if (privileged.length > PRIVILEGED_FAIL) {
    gaps.push({
      code: 'excessive_privileged_users',
      message: `${privileged.length} privileged members exceed the fail threshold of ${PRIVILEGED_FAIL}.`,
      severity: 'critical',
    });
  } else if (privileged.length > PRIVILEGED_WARN) {
    gaps.push({
      code: 'too_many_privileged_users',
      message: `${privileged.length} privileged members exceed the recommended ≤${PRIVILEGED_WARN} threshold.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = members.slice(0, EVIDENCE_CAP).map((m) => ({
    source: 'org_members',
    ref: m.id,
  }));

  let status: ControlResult['status'];
  if (
    mfaCoverage >= 0.95 &&
    privileged.length > 0 &&
    privileged.length <= PRIVILEGED_WARN
  ) {
    status = 'pass';
  } else if (mfaCoverage >= 0.6 && privileged.length > 0) {
    status = 'partial';
  } else {
    status = 'fail';
  }

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, total / 5)),
    reason: `MFA ${withMfa.length}/${total}; ${privileged.length} privileged member(s).`,
    evaluatedAt,
  };
};

const { meta } = makeAutomatedEvaluator(CODE, evaluate);

export { meta, evaluate };
