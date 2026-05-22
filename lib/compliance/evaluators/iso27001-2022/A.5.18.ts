/**
 * ISO/IEC 27001:2022 A.5.18 — "Access rights"
 *
 * Signal: org_audit_logs entries indicating access reviews,
 * grant/revoke decisions, or quarterly access certifications in the
 * last 90 days (pack cadence).
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateAuditActivity } from './_shared';

const CODE = 'A.5.18';
const ACTION_PATTERN = /access\.review|access\.grant|access\.revoke|role\.assign|role\.remove|certify|attestation/i;

const evaluate: ControlEvaluator = async ({ orgId, db }) =>
  evaluateAuditActivity({
    controlCode: CODE,
    orgId,
    db,
    actionPattern: ACTION_PATTERN,
    lookbackDays: 90,
    emptyMessage:
      'No access-review / grant / revoke audit events in the last 90 days — A.5.18 requires a regular access-review cadence.',
    emptyGapCode: 'no_access_review_activity',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
