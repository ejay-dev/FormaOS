/**
 * ISO/IEC 27001:2022 A.6.3 — "Information security awareness, education and training"
 *
 * Signal: org_audit_logs actions matching training-completion
 * events over the last 365 days (pack cadence).
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateAuditActivity } from './_shared';

const CODE = 'A.6.3';
const ACTION_PATTERN = /training\.complete|awareness|onboarding\.security|phishing\.simulation|education/i;

const evaluate: ControlEvaluator = async ({ orgId, db }) =>
  evaluateAuditActivity({
    controlCode: CODE,
    orgId,
    db,
    actionPattern: ACTION_PATTERN,
    lookbackDays: 365,
    emptyMessage:
      'No security-training completion events in the last 365 days — A.6.3 requires annual awareness training across the workforce.',
    emptyGapCode: 'no_training_activity',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
