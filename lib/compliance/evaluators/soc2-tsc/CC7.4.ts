/**
 * SOC2-TSC CC7.4 — "Responds to identified security incidents"
 *
 * Reuses the legacy `soc2/CC7.4` evaluator (config-mutating audit
 * entries × actor attribution rate) under the soc2-tsc framework
 * slug.
 */

import { evaluate as legacy } from '../soc2/CC7.4';
import type {
  ControlEvaluator,
  ControlEvaluatorContext,
  ControlEvaluatorMeta,
} from '../types';

const CODE = 'CC7.4';

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
