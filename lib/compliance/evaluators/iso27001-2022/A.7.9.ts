/**
 * ISO/IEC 27001:2022 A.7.9 — "Security of assets off-premises"
 *
 * Signal: org_policies entries whose title matches the keyword set
 * for this control, in an active/approved status and reviewed
 * within the 365-day cadence.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluatePolicyCadence } from './_shared';

const CODE = 'A.7.9';
const KEYWORDS = /off.?premises|remote|mdm|byod|mobile device/;

const evaluate: ControlEvaluator = async ({ orgId, db }) =>
  evaluatePolicyCadence({
    controlCode: CODE,
    orgId,
    db,
    keywords: KEYWORDS,
    reviewWindowDays: 365,
    missingPolicyMessage:
      'No off-premises / MDM / remote-asset policy found in org_policies — A.7.9 requires documented protection for off-site assets.',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
