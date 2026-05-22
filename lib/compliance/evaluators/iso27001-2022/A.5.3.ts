/**
 * ISO/IEC 27001:2022 A.5.3 — "Segregation of duties"
 *
 * Signal: org_members role distribution. SoD requires that no single
 * individual concentrates conflicting roles. Pass when the org has
 * ≥2 distinct privileged roles assigned to different members. Fail
 * when a single member holds all admin roles or no roles assigned.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, FRAMEWORK, notEvaluated, round2 } from './_shared';

const CODE = 'A.5.3';
const PRIVILEGED_ROLES = new Set(['owner', 'admin', 'security_admin', 'compliance_admin']);

type MemberRow = {
  id: string;
  user_id: string | null;
  role: string | null;
  compliance_status: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_members')
    .select('id, user_id, role, compliance_status')
    .eq('organization_id', orgId);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'org_members_unavailable',
      `Could not read org_members: ${error.message}`,
    );
  }

  const rows = (data ?? []) as MemberRow[];
  const privileged = rows.filter((r) =>
    PRIVILEGED_ROLES.has((r.role || '').toLowerCase()),
  );

  if (privileged.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_privileged_roles',
          message: 'No members hold privileged roles — SoD cannot be evaluated, and admin coverage is absent.',
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: `0 privileged role assignments across ${rows.length} member(s).`,
      evaluatedAt,
    };
  }

  const distinctUsers = new Set(privileged.map((r) => r.user_id).filter(Boolean));
  const distinctRoles = new Set(privileged.map((r) => (r.role || '').toLowerCase()));

  const gaps: ControlGap[] = [];
  if (distinctUsers.size < 2) {
    gaps.push({
      code: 'single_privileged_user',
      message: 'All privileged roles are held by a single user — segregation of duties is not enforced.',
      severity: 'high',
    });
  }
  if (distinctRoles.size < 2) {
    gaps.push({
      code: 'single_privileged_role_class',
      message: 'Only one privileged role class in use — review whether duties are meaningfully separated.',
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = privileged.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_members',
    ref: r.id,
  }));

  let status: ControlResult['status'];
  if (distinctUsers.size >= 2 && distinctRoles.size >= 2) status = 'pass';
  else if (distinctUsers.size >= 2) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, privileged.length / 4)),
    reason: `${privileged.length} privileged assignment(s) across ${distinctUsers.size} user(s) and ${distinctRoles.size} role class(es).`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
