/**
 * SOC2-TSC CC6.3 — "Removes access"
 *
 * Reuses the legacy `soc2/CC6.3` evaluator (audit log access-change
 * coverage + before/after metadata richness) under the soc2-tsc
 * framework slug.
 */

import { evaluate as legacy } from '../soc2/CC6.3';
import type {
  ControlEvaluator,
  ControlEvaluatorContext,
  ControlEvaluatorMeta,
} from '../types';

const CODE = 'CC6.3';

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
