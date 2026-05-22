/**
 * SOC2-TSC P6.6 — "Notifies affected individuals of privacy incidents"
 *
 * Signal: `org_incidents` flagged as privacy-impacting cross-joined
 * with `org_regulatory_notifications` rows linked by `incident_id`.
 * The criterion requires every notifiable incident to produce a
 * notification record. Fail when there are notifiable incidents
 * without any matching notification; pass when each is linked.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, notEvaluated, round2 } from './_shared';

const CODE = 'P6.6';
const PRIVACY_PATTERN = /privacy|breach|leak|disclosure|pii|data loss|unauthorized access/i;
const NOTIFIABLE_SEVERITIES = new Set(['high', 'critical']);

type IncidentRow = {
  id: string;
  description: string | null;
  incident_type: string | null;
  severity: string | null;
  status: string | null;
  occurred_at: string | null;
};

type NotificationRow = {
  id: string;
  incident_id: string | null;
  notification_type: string | null;
  submitted_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const [{ data: incidentsData, error: incidentsError }, { data: notificationsData, error: notificationsError }] =
    await Promise.all([
      db
        .from('org_incidents')
        .select('id, description, incident_type, severity, status, occurred_at')
        .eq('organization_id', orgId)
        .limit(1000),
      db
        .from('org_regulatory_notifications')
        .select('id, incident_id, notification_type, submitted_at')
        .eq('organization_id', orgId)
        .limit(1000),
    ]);

  if (incidentsError) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'org_incidents_unavailable',
      `Could not read org_incidents: ${incidentsError.message}`,
    );
  }

  const incidents = (incidentsData ?? []) as IncidentRow[];
  const notifications = ((notificationsData ?? []) as NotificationRow[]) ?? [];
  const notifiedIncidentIds = new Set(
    notifications
      .filter((n) => !!n.submitted_at)
      .map((n) => n.incident_id)
      .filter((v): v is string => !!v),
  );

  const privacyIncidents = incidents.filter(
    (i) =>
      NOTIFIABLE_SEVERITIES.has((i.severity ?? '').toLowerCase()) &&
      (PRIVACY_PATTERN.test(i.description ?? '') ||
        PRIVACY_PATTERN.test(i.incident_type ?? '')),
  );

  if (privacyIncidents.length === 0) {
    return {
      controlCode: CODE,
      status: 'pass',
      evidenceRefs: [],
      gaps: [],
      confidence: 0.7,
      reason: 'No notifiable privacy incidents on record; control vacuously satisfied.',
      evaluatedAt,
    };
  }

  const notified = privacyIncidents.filter((i) => notifiedIncidentIds.has(i.id));
  const unnotified = privacyIncidents.filter((i) => !notifiedIncidentIds.has(i.id));

  const gaps: ControlGap[] = [];
  if (notificationsError) {
    gaps.push({
      code: 'org_regulatory_notifications_unavailable',
      message: `Could not read org_regulatory_notifications: ${notificationsError.message}`,
      severity: 'medium',
    });
  }
  if (unnotified.length > 0) {
    gaps.push({
      code: 'unnotified_privacy_incidents',
      message: `${unnotified.length}/${privacyIncidents.length} privacy incident(s) have no matching notification record.`,
      severity: 'high',
    });
  }

  const evidenceRefs: EvidenceRef[] = [
    ...privacyIncidents.slice(0, EVIDENCE_CAP / 2).map((i) => ({
      source: 'org_incidents',
      ref: i.id,
      capturedAt: i.occurred_at ?? undefined,
    })),
    ...notifications.slice(0, EVIDENCE_CAP / 2).map((n) => ({
      source: 'org_regulatory_notifications',
      ref: n.id,
      capturedAt: n.submitted_at ?? undefined,
    })),
  ];

  let status: ControlResult['status'];
  if (unnotified.length === 0) status = 'pass';
  else if (notified.length / privacyIncidents.length >= 0.6) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, privacyIncidents.length / 3)),
    reason: `${notified.length}/${privacyIncidents.length} notifiable privacy incident(s) have a notification record.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
