import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';

const EVIDENCE_CAP = 50;
const REMEDIATION_SLA_DAYS = 30;

type SecurityEvent = {
  id: string;
  severity: string;
  created_at: string;
};

type SecurityAlert = {
  id: string;
  event_id: string;
  status: string;
  resolved_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();
  const slaCutoff = new Date(
    Date.now() - REMEDIATION_SLA_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: eventsData, error: eventsError } = await db
    .from('security_events')
    .select('id, severity, created_at')
    .eq('org_id', orgId)
    .in('severity', ['high', 'critical'])
    .order('created_at', { ascending: false })
    .limit(2000);

  if (eventsError) {
    return notEvaluated(
      evaluatedAt,
      'security_events_unavailable',
      `Could not read security_events: ${eventsError.message}`,
    );
  }

  const events = (eventsData ?? []) as SecurityEvent[];

  if (events.length === 0) {
    return {
      controlCode: 'CC7.3',
      status: 'pass',
      evidenceRefs: [],
      gaps: [],
      confidence: 0.7,
      reason:
        'No high or critical security_events on record; nothing to remediate.',
      evaluatedAt,
    };
  }

  const eventIds = events.map((e) => e.id);
  const { data: alertsData, error: alertsError } = await db
    .from('security_alerts')
    .select('id, event_id, status, resolved_at')
    .in('event_id', eventIds);

  if (alertsError) {
    return notEvaluated(
      evaluatedAt,
      'security_alerts_unavailable',
      `Could not read security_alerts: ${alertsError.message}`,
    );
  }

  const alerts = (alertsData ?? []) as SecurityAlert[];
  const resolvedByEvent = new Map<string, SecurityAlert>();
  for (const alert of alerts) {
    if (alert.resolved_at) {
      const existing = resolvedByEvent.get(alert.event_id);
      if (
        !existing ||
        new Date(alert.resolved_at) < new Date(existing.resolved_at!)
      ) {
        resolvedByEvent.set(alert.event_id, alert);
      }
    }
  }

  // SLA-eligible events = events older than SLA window. Younger events
  // can't have breached the SLA yet so they're excluded from the rate.
  const slaEligible = events.filter((e) => e.created_at < slaCutoff);
  const overdueUnresolved = slaEligible.filter((e) => {
    const alert = resolvedByEvent.get(e.id);
    if (!alert) return true;
    const resolvedDelta =
      new Date(alert.resolved_at!).getTime() - new Date(e.created_at).getTime();
    return resolvedDelta > REMEDIATION_SLA_DAYS * 24 * 60 * 60 * 1000;
  });

  const gaps: ControlGap[] = [];
  let status: ControlResult['status'];
  let reason: string;

  if (slaEligible.length === 0) {
    status = 'partial';
    reason = `${events.length} high/critical events found but none are older than the ${REMEDIATION_SLA_DAYS}-day SLA window yet.`;
    gaps.push({
      code: 'sla_window_not_elapsed',
      message:
        'All high/critical events are within the remediation SLA window; re-evaluate after they age out.',
      severity: 'low',
    });
  } else {
    const onTime = slaEligible.length - overdueUnresolved.length;
    const onTimeRate = onTime / slaEligible.length;
    if (onTimeRate >= 0.95) {
      status = 'pass';
      reason = `${onTime}/${slaEligible.length} eligible high/critical events resolved within ${REMEDIATION_SLA_DAYS} days.`;
    } else if (onTimeRate >= 0.6) {
      status = 'partial';
      reason = `${onTime}/${slaEligible.length} eligible high/critical events resolved on-time (${Math.round(onTimeRate * 100)}%).`;
      gaps.push({
        code: 'sla_breach',
        message: `${overdueUnresolved.length} high/critical event(s) breach the ${REMEDIATION_SLA_DAYS}-day remediation SLA.`,
        severity: 'high',
      });
    } else {
      status = 'fail';
      reason = `Only ${onTime}/${slaEligible.length} eligible high/critical events resolved on-time.`;
      gaps.push({
        code: 'sla_majority_breach',
        message: `${overdueUnresolved.length} high/critical event(s) exceed the ${REMEDIATION_SLA_DAYS}-day SLA — incident response is not keeping pace.`,
        severity: 'critical',
      });
    }
  }

  const evidenceRefs: EvidenceRef[] = events
    .slice(0, EVIDENCE_CAP)
    .map((e) => ({
      source: 'security_events',
      ref: e.id,
      capturedAt: e.created_at,
    }));

  return {
    controlCode: 'CC7.3',
    status,
    evidenceRefs,
    gaps,
    confidence: 0.9,
    reason,
    evaluatedAt,
  };
};

function notEvaluated(
  evaluatedAt: string,
  code: string,
  message: string,
): ControlResult {
  return {
    controlCode: 'CC7.3',
    status: 'not_evaluated',
    evidenceRefs: [],
    gaps: [{ code, message, severity: 'medium' }],
    confidence: 0,
    reason: message,
    evaluatedAt,
  };
}

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2',
  controlCode: 'CC7.3',
  evaluator: evaluate,
};

export { evaluate };
