/**
 * CIS-11 — Data recovery.
 *
 * Signal: retention_policies presence + recent retention_executions
 * row in the last 180 days (the pack cadence). No restore_test table
 * exists, so the executions row stands in as a proxy that the
 * documented retention is being acted on.
 */

import type {
  ControlEvaluator,
  ControlGap,
  ControlResult,
  EvidenceRef,
} from '../types';
import {
  EVIDENCE_CAP,
  daysSince,
  makeAutomatedEvaluator,
  notEvaluated,
  round2,
} from './_shared';

const CODE = 'CIS-11';
const EXECUTION_WINDOW_DAYS = 180;

type RetentionRow = { id: string; resource_type: string | null; updated_at: string | null };
type ExecutionRow = { id: string; resource_type: string | null; created_at: string | null };

const evaluate: ControlEvaluator = async ({ orgId, db }) => {
  const evaluatedAt = new Date().toISOString();
  const windowStart = new Date(
    Date.now() - EXECUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [
    { data: policiesData, error: policiesError },
    { data: executionsData, error: executionsError },
  ] = await Promise.all([
    db
      .from('retention_policies')
      .select('id, resource_type, updated_at')
      .eq('org_id', orgId)
      .limit(200),
    db
      .from('retention_executions')
      .select('id, resource_type, created_at')
      .eq('org_id', orgId)
      .gte('created_at', windowStart)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  if (policiesError) {
    return notEvaluated(
      CODE,
      evaluatedAt,
      'retention_policies_unavailable',
      `Could not read retention_policies: ${policiesError.message}`,
    );
  }

  const policies = (policiesData ?? []) as RetentionRow[];
  const executions = (executionsData ?? []) as ExecutionRow[];

  if (policies.length === 0) {
    return {
      controlCode: CODE,
      status: 'fail',
      evidenceRefs: [],
      gaps: [
        {
          code: 'no_retention_policies',
          message:
            'No retention policies — CIS-11 requires a documented backup/recovery schedule.',
          severity: 'high',
        },
      ],
      confidence: 0.85,
      reason: 'retention_policies is empty for this organization.',
      evaluatedAt,
    };
  }

  const newestExecution = executions
    .map((e) => e.created_at)
    .filter((v): v is string => !!v)
    .sort()
    .reverse()[0];
  const sinceExec = daysSince(newestExecution);
  const hasRecentExecution = sinceExec != null && sinceExec <= EXECUTION_WINDOW_DAYS;

  const gaps: ControlGap[] = [];
  if (executionsError) {
    gaps.push({
      code: 'retention_executions_unavailable',
      message: `Could not read retention_executions: ${executionsError.message}`,
      severity: 'medium',
    });
  }
  if (!hasRecentExecution) {
    gaps.push({
      code: 'no_recovery_execution',
      message: `retention_policies defined but no execution recorded in the last ${EXECUTION_WINDOW_DAYS}d — restore-test evidence is missing.`,
      severity: 'high',
    });
  }

  const evidenceRefs: EvidenceRef[] = [
    ...policies.slice(0, EVIDENCE_CAP / 2).map((p) => ({
      source: 'retention_policies',
      ref: p.id,
      capturedAt: p.updated_at ?? undefined,
    })),
    ...executions.slice(0, EVIDENCE_CAP / 2).map((e) => ({
      source: 'retention_executions',
      ref: e.id,
      capturedAt: e.created_at ?? undefined,
    })),
  ];

  let status: ControlResult['status'];
  if (policies.length > 0 && hasRecentExecution) status = 'pass';
  else if (policies.length > 0) status = 'partial';
  else status = 'fail';

  return {
    controlCode: CODE,
    status,
    evidenceRefs,
    gaps,
    confidence: round2(0.6 + 0.4 * Math.min(1, policies.length / 5)),
    reason: `${policies.length} retention polic(ies); ${executions.length} execution(s) in ${EXECUTION_WINDOW_DAYS}d.`,
    evaluatedAt,
  };
};

const { meta } = makeAutomatedEvaluator(CODE, evaluate);

export { meta, evaluate };
