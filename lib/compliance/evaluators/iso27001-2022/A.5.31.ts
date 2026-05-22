/**
 * ISO/IEC 27001:2022 A.5.31 — "Legal, statutory, regulatory and contractual requirements"
 *
 * Signal: org_policies entries whose title matches the keyword set
 * for this control, in an active/approved status and reviewed
 * within the 365-day cadence.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluatePolicyCadence } from './_shared';

const CODE = 'A.5.31';
const KEYWORDS = /legal|regulatory|obligation|compliance register|statutory/;

const evaluate: ControlEvaluator = async ({ orgId, db }) =>
  evaluatePolicyCadence({
    controlCode: CODE,
    orgId,
    db,
    keywords: KEYWORDS,
    reviewWindowDays: 365,
    missingPolicyMessage:
      'No legal-obligations / regulatory register policy found in org_policies — A.5.31 requires a maintained obligations register.',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
