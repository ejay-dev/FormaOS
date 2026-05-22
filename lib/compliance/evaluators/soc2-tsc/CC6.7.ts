/**
 * SOC2-TSC CC6.7 — "Restricts information movement and removal"
 *
 * Reuses the legacy `soc2/CC6.7` evaluator (api_keys scoping +
 * audit-log coverage of export actions) under the soc2-tsc framework
 * slug.
 */

import { evaluate as legacy } from '../soc2/CC6.7';
import type {
  ControlEvaluator,
  ControlEvaluatorContext,
  ControlEvaluatorMeta,
} from '../types';

const CODE = 'CC6.7';

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
