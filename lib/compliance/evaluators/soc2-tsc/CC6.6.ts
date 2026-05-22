/**
 * SOC2-TSC CC6.6 — "Implements boundary protection"
 *
 * Reuses the legacy `soc2/CC6.6` evaluator (privileged role count
 * against least-privilege thresholds) under the soc2-tsc framework
 * slug. The TSC criterion focuses on boundary protection more
 * broadly; in the absence of a firewall/WAF inventory in the schema
 * we proxy with privileged-account discipline.
 */

import { evaluate as legacy } from '../soc2/CC6.6';
import type {
  ControlEvaluator,
  ControlEvaluatorContext,
  ControlEvaluatorMeta,
} from '../types';

const CODE = 'CC6.6';

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
