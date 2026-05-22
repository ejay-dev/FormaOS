/**
 * ISO/IEC 27001:2022 A.8.3 — "Information access restriction"
 *
 * Signal: org_audit_logs entries showing least-privilege enforcement
 * activity (access grant/revoke with explicit scope) over the
 * 180-day cadence.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateAuditActivity } from './_shared';

const CODE = 'A.8.3';
const ACTION_PATTERN = /access\.(grant|revoke|update)|permission\.(grant|revoke)|role\.(assign|remove)|share\.(create|revoke)/i;

const evaluate: ControlEvaluator = async ({ orgId, db }) =>
  evaluateAuditActivity({
    controlCode: CODE,
    orgId,
    db,
    actionPattern: ACTION_PATTERN,
    lookbackDays: 180,
    emptyMessage:
      'No access-control mutation events in the last 180 days — A.8.3 expects active least-privilege enforcement.',
    emptyGapCode: 'no_access_enforcement_activity',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
