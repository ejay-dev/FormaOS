/**
 * ISO/IEC 27001:2022 A.8.16 — "Monitoring activities"
 *
 * Signal: org_audit_logs entries for security alerts / anomalies /
 * detection-rule triage in the last 90 days (pack cadence).
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateAuditActivity } from './_shared';

const CODE = 'A.8.16';
const ACTION_PATTERN = /alert|anomaly|detection|monitor|triage|security\.event/i;

const evaluate: ControlEvaluator = async ({ orgId, db }) =>
  evaluateAuditActivity({
    controlCode: CODE,
    orgId,
    db,
    actionPattern: ACTION_PATTERN,
    lookbackDays: 90,
    emptyMessage:
      'No alert / anomaly / detection audit events in the last 90 days — A.8.16 requires active monitoring.',
    emptyGapCode: 'no_monitoring_activity',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
