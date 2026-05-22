/**
 * ISO/IEC 27001:2022 A.5.1 — "Policies for information security"
 *
 * Signal: org_policies entries whose title looks like an information
 * security policy, in an active/approved status and reviewed within
 * the 365-day cadence the pack defines.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluatePolicyCadence } from './_shared';

const CODE = 'A.5.1';
const KEYWORDS = /information security|infosec|security policy|isms/;

const evaluate: ControlEvaluator = async ({ orgId, db }) =>
  evaluatePolicyCadence({
    controlCode: CODE,
    orgId,
    db,
    keywords: KEYWORDS,
    reviewWindowDays: 365,
    missingPolicyMessage:
      'No information-security / ISMS policy found in org_policies — A.5.1 requires a board-approved policy.',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
