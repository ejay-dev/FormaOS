/**
 * SOC2-TSC CC6.1 — "Implements logical access security"
 *
 * Reuses the legacy `soc2/CC6.1` evaluator (org_members × user_security
 * MFA coverage) under the soc2-tsc framework slug. The TSC criterion
 * is functionally identical to the legacy SOC2 control so we delegate
 * to the same implementation rather than duplicating the logic.
 */

import { evaluate as legacy } from '../soc2/CC6.1';
import type {
  ControlEvaluator,
  ControlEvaluatorContext,
  ControlEvaluatorMeta,
} from '../types';

const CODE = 'CC6.1';

const evaluate: ControlEvaluator = async (ctx: ControlEvaluatorContext) => {
  const result = await legacy(ctx);
  return { ...result, controlCode: CODE };
};

export const meta: ControlEvaluatorMeta = {
  framework: 'soc2-tsc',
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
