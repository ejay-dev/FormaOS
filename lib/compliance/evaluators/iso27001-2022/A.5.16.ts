/**
 * ISO/IEC 27001:2022 A.5.16 — "Identity management"
 *
 * Signal: org_members lifecycle freshness. Pass requires at least
 * one member, no orphaned `user_id`-less rows, and at least one
 * recent (≤90d) change in org_audit_logs touching membership.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import {
  EVIDENCE_CAP,
  FRAMEWORK,
  daysSince,
  notEvaluated,
  round2,
} from './_shared';

const CODE = 'A.5.16';
const LOOKBACK_DAYS = 90;
const LIFECYCLE_PATTERN = /member|invite|role|provision|deprovision|user\.create|user\.disable|access\.grant|access\.revoke/i;

type MemberRow = {
  id: string;
  user_id: string | null;
  role: string | null;
  compliance_status: string | null;
  created_at: string | null;
};

type AuditRow = {
  id: string;
  action: string | null;
  created_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data: memberData, error: memberError } = await db
    .from('org_members')
    .select('id, user_id, role, compliance_status, created_at')
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
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_members',
          message: 'Organization has no members — identity-management lifecycle cannot be evaluated.',
          severity: 'high',
        },
      ],
      confidence: 0.6,
      reason: 'No org_members rows.',
      evaluatedAt,
    };
  }

  const orphaned = members.filter((m) => !m.user_id);
  const windowStart = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: auditData } = await db
    .from('org_audit_logs')
    .select('id, action, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: false })
    .limit(2000);

  const auditRows = (auditData ?? []) as AuditRow[];
  const lifecycleEvents = auditRows.filter((r) => LIFECYCLE_PATTERN.test(r.action ?? ''));

  const gaps: ControlGap[] = [];
  if (orphaned.length > 0) {
    gaps.push({
      code: 'orphaned_membership_rows',
      message: `${orphaned.length} org_members row(s) have no user_id — identity provisioning is incomplete.`,
      severity: 'high',
    });
  }
  if (lifecycleEvents.length === 0) {
    gaps.push({
      code: 'no_lifecycle_activity',
      message: `No identity lifecycle events (join/leave/role change) in the last ${LOOKBACK_DAYS}d — review whether automation is running.`,
      severity: 'medium',
    });
  }

  const latest = lifecycleEvents[0]?.created_at;
  const sinceLatest = daysSince(latest);

  const evidenceRefs: EvidenceRef[] = lifecycleEvents.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_audit_logs',
    ref: r.id,
    capturedAt: r.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (orphaned.length === 0 && lifecycleEvents.length > 0) status = 'pass';
  else if (orphaned.length === 0) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, members.length / 5)),
    reason: `${members.length} member(s); ${orphaned.length} orphaned; ${lifecycleEvents.length} lifecycle event(s) in ${LOOKBACK_DAYS}d (latest ${sinceLatest ?? '?'}d ago).`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
