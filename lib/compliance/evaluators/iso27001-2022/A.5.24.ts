/**
 * ISO/IEC 27001:2022 A.5.24 — "Information security incident management planning and preparation"
 *
 * Signal: org_policies entries whose title matches the keyword set
 * for this control, in an active/approved status and reviewed
 * within the 180-day cadence.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluatePolicyCadence } from './_shared';

const CODE = 'A.5.24';
const KEYWORDS = /incident response|incident management|ir plan|ir policy/;

const evaluate: ControlEvaluator = async ({ orgId, db }) =>
  evaluatePolicyCadence({
    controlCode: CODE,
    orgId,
    db,
    keywords: KEYWORDS,
    reviewWindowDays: 180,
    missingPolicyMessage:
      'No incident-response / incident-management policy found in org_policies — A.5.24 requires an IR plan.',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
