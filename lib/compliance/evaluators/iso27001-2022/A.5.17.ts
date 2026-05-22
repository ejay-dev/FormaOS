/**
 * ISO/IEC 27001:2022 A.5.17 — "Authentication information"
 *
 * Signal: MFA coverage across active members (delegates to shared
 * MFA-coverage helper). Pass at ≥95 % MFA enrolment.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateMfaCoverage } from './_shared';

const CODE = 'A.5.17';

const evaluate: ControlEvaluator = async ({ orgId, db }) =>
  evaluateMfaCoverage({ controlCode: CODE, orgId, db });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
