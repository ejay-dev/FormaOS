/**
 * SOC2-TSC CC5.1 — "Selects and develops control activities"
 *
 * Signal: `org_controls` rows scoped to the organization indicate that
 * a control matrix has been populated. The criterion expects every
 * material risk to have a mapped control — we cross-check the count
 * of org_controls against the count of org_risks for context.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, notEvaluated, round2 } from './_shared';

const CODE = 'CC5.1';

type ControlRow = { id: string; status: string | null; created_at: string | null };
type RiskRow = { id: string };

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();

  const [{ data: controlsData, error: controlsError }, { data: risksData, error: risksError }] =
    await Promise.all([
      db
        .from('org_controls')
        .select('id, status, created_at')
        .eq('organization_id', orgId)
        .limit(2000),
      db
        .from('org_risks')
        .select('id')
        .eq('organization_id', orgId)
        .limit(2000),
    ]);

  if (controlsError) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'org_controls_unavailable',
      `Could not read org_controls: ${controlsError.message}`,
    );
  }

  const controls = (controlsData ?? []) as ControlRow[];
  const risks = ((risksData ?? []) as RiskRow[]) ?? [];

  if (controls.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_controls',
          message:
            'org_controls is empty — no control activities are documented to mitigate the risk register.',
          severity: 'high',
        },
      ],
      confidence: 0.8,
      reason: 'org_controls table is empty for this organization.',
      evaluatedAt,
    };
  }

  const gaps: ControlGap[] = [];
  if (risksError) {
    gaps.push({
      code: 'risk_register_unavailable',
      message: `Could not cross-reference risks: ${risksError.message}`,
      severity: 'low',
    });
  }
  // Heuristic: at least one control per risk; allow slack of half a control per risk.
  if (risks.length > 0 && controls.length < Math.ceil(risks.length / 2)) {
    gaps.push({
      code: 'thin_control_coverage',
      message: `${risks.length} risk(s) tracked but only ${controls.length} control(s) — coverage looks thin.`,
      severity: 'medium',
    });
  }

  const evidenceRefs: EvidenceRef[] = controls.slice(0, EVIDENCE_CAP).map((c) => ({
    source: 'org_controls',
    ref: c.id,
    capturedAt: c.created_at ?? undefined,
  }));

  let status: ControlResult['status'];
  if (gaps.length === 0) status = 'pass';
  else if (gaps.some((g) => g.severity === 'medium' || g.severity === 'high')) status = 'partial';
  else status = 'pass';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.55 + 0.45 * Math.min(1, controls.length / 10)),
    reason: `${controls.length} control(s) defined; ${risks.length} risk(s) on register.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
