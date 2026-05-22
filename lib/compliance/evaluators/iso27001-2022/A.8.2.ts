/**
 * ISO/IEC 27001:2022 A.8.2 — "Privileged access rights"
 *
 * Signal: org_members with privileged roles plus org_audit_logs
 * events showing privileged-access usage in the last 90 days.
 * Pass requires (a) bounded privileged-role count (≤30% of members),
 * and (b) audit-log activity demonstrating monitored privileged use.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, FRAMEWORK, notEvaluated, round2 } from './_shared';

const CODE = 'A.8.2';
const LOOKBACK_DAYS = 90;
const MAX_PRIVILEGED_RATIO = 0.3;
const PRIVILEGED_ROLES = new Set(['owner', 'admin', 'security_admin', 'compliance_admin']);
const ACTION_PATTERN = /admin|privileged|sudo|impersonate|break.?glass|role\.assign/i;

type MemberRow = {
  id: string;
  user_id: string | null;
  role: string | null;
  compliance_status: string | null;
};

type AuditRow = {
  id: string;
  action: string | null;
  actor_email: string | null;
  created_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data: memberData, error: memberError } = await db
    .from('org_members')
    .select('id, user_id, role, compliance_status')
    .eq('organization_id', orgId);

  if (memberError) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'org_members_unavailable',
      `Could not read org_members: ${memberError.message}`,
    );
  }

  const members = (memberData ?? []) as MemberRow[];

  if (members.length === 0) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'no_members',
      'Organization has no members; privileged-access cannot be evaluated.',
    );
  }

  const privileged = members.filter((m) =>
    PRIVILEGED_ROLES.has((m.role || '').toLowerCase()),
  );
  const ratio = privileged.length / members.length;

  const windowStart = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: auditData } = await db
    .from('org_audit_logs')
    .select('id, action, actor_email, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: false })
    .limit(2000);

  const auditRows = (auditData ?? []) as AuditRow[];
  const privilegedEvents = auditRows.filter((r) => ACTION_PATTERN.test(r.action ?? ''));

  const gaps: ControlGap[] = [];
  if (privileged.length === 0) {
    gaps.push({
      code: 'no_privileged_roles',
      message: 'No privileged-role assignments — either privileged access is unmanaged or roles are mislabelled.',
      severity: 'high',
    });
  }
  if (ratio > MAX_PRIVILEGED_RATIO) {
    gaps.push({
      code: 'over_privileged_population',
      message: `${privileged.length} of ${members.length} member(s) hold privileged roles (${Math.round(ratio * 100)}%) — A.8.2 expects restricted privileged access.`,
      severity: 'high',
    });
  }
  if (privilegedEvents.length === 0 && privileged.length > 0) {
    gaps.push({
      code: 'no_privileged_audit_trail',
      message: `No privileged-action audit events in ${LOOKBACK_DAYS}d — usage is not being logged.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = privileged.slice(0, EVIDENCE_CAP).map((m) => ({
    source: 'org_members',
    ref: m.id,
  }));

  let status: ControlResult['status'];
  if (
    privileged.length > 0 &&
    ratio <= MAX_PRIVILEGED_RATIO &&
    privilegedEvents.length > 0
  ) {
    status = 'pass';
  } else if (privileged.length > 0 && ratio <= MAX_PRIVILEGED_RATIO) {
    status = 'partial';
  } else {
    status = 'fail';
  }

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, members.length / 10)),
    reason: `${privileged.length}/${members.length} privileged (${Math.round(ratio * 100)}%); ${privilegedEvents.length} privileged audit event(s) in ${LOOKBACK_DAYS}d.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
