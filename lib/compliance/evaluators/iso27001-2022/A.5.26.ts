/**
 * ISO/IEC 27001:2022 A.5.26 — "Response to information security incidents"
 *
 * Signal: org_audit_logs entries indicating incident-response
 * activity (open / close / escalate / runbook execution) over the
 * 180-day cadence.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateAuditActivity } from './_shared';

const CODE = 'A.5.26';
const ACTION_PATTERN = /incident\.(open|close|escalate|comment|runbook|assign)|security\.alert|breach/i;

const evaluate: ControlEvaluator = async ({ orgId, db }) =>
  evaluateAuditActivity({
    controlCode: CODE,
    orgId,
    db,
    actionPattern: ACTION_PATTERN,
    lookbackDays: 180,
    emptyMessage:
      'No incident-response audit events in the last 180 days — A.5.26 expects active incident-handling traffic or at least drills.',
    emptyGapCode: 'no_incident_response_activity',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
