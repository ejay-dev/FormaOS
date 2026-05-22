/**
 * SOC2-TSC CC8.1 — "Authorises, designs, develops, configures,
 * documents, tests, approves, and implements changes"
 *
 * Signal: org_audit_logs entries whose `action` describes a change /
 * deploy / release operation, looked at over the last 90 days. Pass
 * requires (a) at least one such entry and (b) ≥90 % of entries with
 * a real actor_email attribution. Fail when there are zero change
 * audit entries at all — change-management evidence cannot be
 * produced.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, notEvaluated, round2 } from './_shared';

const CODE = 'CC8.1';
const LOOKBACK_DAYS = 90;
const ACTION_PATTERN = /change|deploy|release|migration|config\.update|policy\.publish|role\.assign|approve/i;
const SYSTEM_ACTOR_PATTERN = /^(system|bot|automation|null)\b|@formaos\.com$|noreply/i;

type AuditRow = {
  id: string;
  action: string | null;
  target: string | null;
  actor_email: string | null;
  created_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();
  const windowStart = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await db
    .from('org_audit_logs')
    .select('id, action, target, actor_email, created_at')
    .eq('organization_id', orgId)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: false })
    .limit(2000);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'org_audit_logs_unavailable',
      `Could not read org_audit_logs: ${error.message}`,
    );
  }

  const rows = (data ?? []) as AuditRow[];
  const changes = rows.filter((r) => ACTION_PATTERN.test(r.action ?? ''));

  if (changes.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_change_entries',
          message: `No change/deploy/release entries in org_audit_logs over the last ${LOOKBACK_DAYS} days.`,
          severity: 'high',
        },
      ],
      confidence: 0.65,
      reason: `${rows.length} audit row(s) but none matched change-management actions.`,
      evaluatedAt,
    };
  }

  const withRealActor = changes.filter(
    (r) => !!r.actor_email && !SYSTEM_ACTOR_PATTERN.test(r.actor_email),
  );
  const attributionRate = withRealActor.length / changes.length;

  const gaps: ControlGap[] = [];
  if (attributionRate < 0.9) {
    gaps.push({
      code: 'low_change_attribution',
      message: `${changes.length - withRealActor.length} of ${changes.length} change entries lack a human actor — approvals cannot be traced.`,
      severity: 'high',
    });
  }

  const evidenceRefs: EvidenceRef[] = changes.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_audit_logs',
    ref: r.id,
    capturedAt: r.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (attributionRate >= 0.9) status = 'pass';
  else if (attributionRate >= 0.6) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, changes.length / 10)),
    reason: `${changes.length} change entries in ${LOOKBACK_DAYS}d; ${withRealActor.length} attributed to a human actor.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
