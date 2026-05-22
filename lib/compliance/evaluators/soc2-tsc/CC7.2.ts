/**
 * SOC2-TSC CC7.2 — "Monitors anomalies"
 *
 * Reuses the legacy `soc2/CC7.2` evaluator (audit_log tamper-evident
 * hash chain verification) under the soc2-tsc framework slug.
 */

import { evaluate as legacy } from '../soc2/CC7.2';
import type {
  ControlEvaluator,
  ControlEvaluatorContext,
  ControlEvaluatorMeta,
} from '../types';

const CODE = 'CC7.2';

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
