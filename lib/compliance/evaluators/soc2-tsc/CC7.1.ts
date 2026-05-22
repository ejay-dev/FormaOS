/**
 * SOC2-TSC CC7.1 — "Detects configuration changes"
 *
 * Reuses the legacy `soc2/CC7.1` evaluator (security_events volume +
 * longest zero-event gap) under the soc2-tsc framework slug.
 */

import { evaluate as legacy } from '../soc2/CC7.1';
import type {
  ControlEvaluator,
  ControlEvaluatorContext,
  ControlEvaluatorMeta,
} from '../types';

const CODE = 'CC7.1';

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
