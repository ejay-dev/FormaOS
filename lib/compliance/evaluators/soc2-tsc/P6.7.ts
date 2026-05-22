/**
 * SOC2-TSC P6.7 — "Notifies authorities of privacy incidents"
 *
 * Signal: `org_regulatory_notifications` rows whose `due_date` is in
 * the past must have a `submitted_at` value. A submission after the
 * due date is a partial; no submission for a past-due notification
 * is a fail.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, notEvaluated, round2 } from './_shared';

const CODE = 'P6.7';

type NotificationRow = {
  id: string;
  regulation: string | null;
  body_name: string | null;
  due_date: string | null;
  submitted_at: string | null;
  status: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const { data, error } = await db
    .from('org_regulatory_notifications')
    .select('id, regulation, body_name, due_date, submitted_at, status')
    .eq('organization_id', orgId)
    .limit(1000);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'org_regulatory_notifications_unavailable',
      `Could not read org_regulatory_notifications: ${error.message}`,
    );
  }

  const rows = (data ?? []) as NotificationRow[];

  if (rows.length === 0) {
    return {
      controlCode: CODE,
      status: 'pass',
      evidenceRefs: [],
      gaps: [],
      confidence: 0.65,
      reason:
        'No regulator notifications on record; control vacuously satisfied (no notifiable events).',
      evaluatedAt,
    };
  }

  const now = Date.now();
  const pastDue = rows.filter((r) => {
    if (!r.due_date) return false;
    return Date.parse(r.due_date) <= now;
  });

  const missingSubmission = pastDue.filter((r) => !r.submitted_at);
  const late = pastDue.filter(
    (r) =>
      !!r.submitted_at &&
      !!r.due_date &&
      Date.parse(r.submitted_at) > Date.parse(r.due_date),
  );

  const gaps: ControlGap[] = [];
  if (missingSubmission.length > 0) {
    gaps.push({
      code: 'unsubmitted_past_due',
      message: `${missingSubmission.length} past-due regulator notification(s) have no submitted_at value.`,
      severity: 'high',
    });
  }
  if (late.length > 0) {
    gaps.push({
      code: 'late_submission',
      message: `${late.length} regulator notification(s) were submitted after their due date.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = rows.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_regulatory_notifications',
    ref: r.id,
    capturedAt: r.submitted_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (missingSubmission.length > 0) status = 'fail';
  else if (late.length > 0) status = 'partial';
  else status = 'pass';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, rows.length / 3)),
    reason: `${rows.length} notification(s); ${missingSubmission.length} past-due unsubmitted; ${late.length} late.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
