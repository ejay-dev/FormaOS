/**
 * SOC2-TSC CC7.5 — "Recovers from identified security incidents"
 *
 * Signal: org_capa_items (corrective / preventive actions). A
 * functioning recovery process should produce CAPA items linked to
 * incidents and verify them within their effectiveness window. Fail
 * when there are zero CAPA items in the last year; partial when items
 * exist but none have been verified; pass when ≥70 % of items in the
 * lookback window are verified.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, notEvaluated, round2 } from './_shared';

const CODE = 'CC7.5';
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
          message: `No corrective/preventive actions in the last ${LOOKBACK_DAYS} days — recovery procedures are not producing artefacts.`,
          severity: 'high',
        },
      ],
      confidence: 0.7,
      reason: 'No CAPA items in lookback window.',
      evaluatedAt,
    };
  }

  const verified = rows.filter(
    (r) => !!r.verified_at || (r.status || '').toLowerCase() === 'closed',
  );
  const verificationRate = verified.length / rows.length;
  const incidentLinked = rows.filter((r) => !!r.incident_id);

  const gaps: ControlGap[] = [];
  if (verificationRate < 0.7) {
    gaps.push({
      code: 'unverified_capa_items',
      message: `${rows.length - verified.length} of ${rows.length} CAPA item(s) lack a verification record.`,
      severity: 'high',
    });
  }
  if (incidentLinked.length === 0) {
    gaps.push({
      code: 'no_incident_linkage',
      message:
        'No CAPA items are linked to incidents — recovery activities are not traceable back to triggers.',
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = rows.slice(0, EVIDENCE_CAP).map((r) => ({
    source: 'org_capa_items',
    ref: r.id,
    capturedAt: r.verified_at ?? r.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (verificationRate >= 0.7 && incidentLinked.length > 0) status = 'pass';
  else if (verificationRate >= 0.4) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, rows.length / 5)),
    reason: `${verified.length}/${rows.length} CAPA item(s) verified in ${LOOKBACK_DAYS}d window.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
