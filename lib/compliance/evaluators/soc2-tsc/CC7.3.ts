/**
 * SOC2-TSC CC7.3 — "Evaluates security events"
 *
 * Reuses the legacy `soc2/CC7.3` evaluator (security_events ×
 * security_alerts SLA breach analysis) under the soc2-tsc framework
 * slug.
 */

import { evaluate as legacy } from '../soc2/CC7.3';
import type {
  ControlEvaluator,
  ControlEvaluatorContext,
  ControlEvaluatorMeta,
} from '../types';

const CODE = 'CC7.3';

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
