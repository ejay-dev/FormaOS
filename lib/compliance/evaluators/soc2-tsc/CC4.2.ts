/**
 * SOC2-TSC CC4.2 — "Evaluates and communicates deficiencies"
 *
 * Signal: `scan_findings` are the deficiencies and `org_capa_items`
 * are the remediation track. Pass requires findings to have an
 * accompanying CAPA record (or to be old enough that no CAPA implies
 * no deficiency). Fail when there are open critical findings without
 * any CAPA records at all.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import { EVIDENCE_CAP, notEvaluated, round2 } from './_shared';

const CODE = 'CC4.2';
const LOOKBACK_DAYS = 180;
const OPEN_FINDING_PATTERN = /open|new|in[_ -]?progress|non_compliant|failing/i;

type FindingRow = {
  id: string;
  status: string | null;
  severity: string | null;
  detected_at: string | null;
};

type CapaRow = { id: string; status: string | null; created_at: string | null };

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();
  const windowStart = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [{ data: findingsData, error: findingsError }, { data: capaData, error: capaError }] =
    await Promise.all([
      db
        .from('scan_findings')
        .select('id, status, severity, detected_at')
        .eq('organization_id', orgId)
        .gte('detected_at', windowStart)
        .order('detected_at', { ascending: false })
        .limit(2000),
      db
        .from('org_capa_items')
        .select('id, status, created_at')
        .eq('organization_id', orgId)
        .gte('created_at', windowStart)
        .order('created_at', { ascending: false })
        .limit(2000),
    ]);

  if (findingsError && capaError) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'deficiency_signals_unavailable',
      `Both scan_findings and org_capa_items queries failed: ${findingsError.message}; ${capaError.message}`,
    );
  }

  const findings = (findingsData ?? []) as FindingRow[];
  const capas = (capaData ?? []) as CapaRow[];

  if (findings.length === 0 && capas.length === 0) {
    return {
      controlCode: CODE,
      status: 'partial',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_deficiency_pipeline',
          message: `No findings or CAPA items in the last ${LOOKBACK_DAYS} days — cannot confirm deficiency-communication workflow is operational.`,
          severity: 'medium',
        },
      ],
      confidence: 0.5,
      reason: 'No deficiency signals to evaluate; treat as partial pending audit.',
      evaluatedAt,
    };
  }

  const openFindings = findings.filter((f) =>
    OPEN_FINDING_PATTERN.test(f.status ?? ''),
  );
  const criticalOpen = openFindings.filter(
    (f) => (f.severity ?? '').toLowerCase() === 'critical',
  );

  const gaps: ControlGap[] = [];
  let status: ControlResult['status'];

  if (criticalOpen.length > 0 && capas.length === 0) {
    status = 'fail';
    gaps.push({
      code: 'open_critical_no_capa',
      message: `${criticalOpen.length} critical finding(s) are open but zero CAPA items have been created — deficiencies are not being escalated.`,
      severity: 'high',
    });
  } else if (openFindings.length > 0 && capas.length === 0) {
    status = 'partial';
    gaps.push({
      code: 'open_findings_no_capa',
      message: `${openFindings.length} open finding(s) but no CAPA items in window — confirm deficiencies are being tracked.`,
      severity: 'medium',
    });
  } else {
    status = 'pass';
  }

  const evidenceRefs: EvidenceRef[] = [
    ...findings.slice(0, EVIDENCE_CAP / 2).map((f) => ({
      source: 'scan_findings',
      ref: f.id,
      capturedAt: f.detected_at ?? undefined,
    })),
    ...capas.slice(0, EVIDENCE_CAP / 2).map((c) => ({
      source: 'org_capa_items',
      ref: c.id,
      capturedAt: c.created_at ?? undefined,
    })),
  ];

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, (findings.length + capas.length) / 10)),
    reason: `${findings.length} finding(s) (${openFindings.length} open, ${criticalOpen.length} critical); ${capas.length} CAPA item(s) in window.`,
    evaluatedAt,
  };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
