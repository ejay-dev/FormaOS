/**
 * ISO/IEC 27001:2022 A.5.27 — "Learning from information security incidents"
 *
 * Signal: org_capa_items linked to incidents and verified within
 * the 180-day cadence. Pass when ≥1 incident-linked CAPA item is
 * verified inside the window; partial when items exist but lack
 * verification or incident linkage.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, FRAMEWORK, notEvaluated, round2 } from './_shared';

const CODE = 'A.5.27';
const LOOKBACK_DAYS = 365;

type CapaRow = {
  id: string;
  status: string | null;
  verified_at: string | null;
  effectiveness_status: string | null;
  incident_id: string | null;
  type: string | null;
  created_at: string | null;
};

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();
  const windowStart = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await db
    .from('org_capa_items')
    .select(
      'id, status, verified_at, effectiveness_status, incident_id, type, created_at',
    )
    .eq('organization_id', orgId)
    .gte('created_at', windowStart)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'org_capa_items_unavailable',
      `Could not read org_capa_items: ${error.message}`,
    );
  }

  const rows = (data ?? []) as CapaRow[];

  if (rows.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_capa_items',
          message: `No CAPA items in the last ${LOOKBACK_DAYS} days — A.5.27 requires evidence that incidents drive improvement.`,
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: 'No CAPA items in lookback window.',
      evaluatedAt,
    };
  }

  const incidentLinked = rows.filter((r) => !!r.incident_id);
  const verified = incidentLinked.filter(
    (r) => !!r.verified_at || (r.status || '').toLowerCase() === 'closed',
  );

  const gaps: ControlGap[] = [];
  if (incidentLinked.length === 0) {
    gaps.push({
      code: 'no_incident_linked_capa',
      message: 'No CAPA items are linked to incidents — learnings cannot be traced back to triggers.',
      severity: 'high',
    });
  }
  if (incidentLinked.length > 0 && verified.length === 0) {
    gaps.push({
      code: 'no_verified_capa',
      message: `${incidentLinked.length} incident-linked CAPA item(s) but none verified.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = incidentLinked.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_capa_items',
    ref: r.id,
    capturedAt: r.verified_at ?? r.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (verified.length > 0) status = 'pass';
  else if (incidentLinked.length > 0) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, rows.length / 5)),
    reason: `${incidentLinked.length}/${rows.length} CAPA item(s) linked to incidents; ${verified.length} verified.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
