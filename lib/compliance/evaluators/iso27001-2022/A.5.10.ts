/**
 * ISO/IEC 27001:2022 A.5.10 — "Acceptable use of information and other associated assets"
 *
 * Signal: org_policies entries whose title matches the keyword set
 * for this control, in an active/approved status and reviewed
 * within the 365-day cadence.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluatePolicyCadence } from './_shared';

const CODE = 'A.5.10';
const KEYWORDS = /acceptable use|aup|usage policy|user policy/;

const evaluate: ControlEvaluator = async ({ orgId, db }) =>
  evaluatePolicyCadence({
    controlCode: CODE,
    orgId,
    db,
    keywords: KEYWORDS,
    reviewWindowDays: 365,
    missingPolicyMessage:
      'No acceptable-use / AUP policy found in org_policies — A.5.10 requires a documented AUP.',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
