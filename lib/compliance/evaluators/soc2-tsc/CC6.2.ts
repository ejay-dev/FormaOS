/**
 * SOC2-TSC CC6.2 — "Authorizes and modifies access"
 *
 * Reuses the legacy `soc2/CC6.2` evaluator (org_members ×
 * team_invitations registration provenance) under the soc2-tsc
 * framework slug. The TSC criterion is functionally identical.
 */

import { evaluate as legacy } from '../soc2/CC6.2';
import type {
  ControlEvaluator,
  ControlEvaluatorContext,
  ControlEvaluatorMeta,
} from '../types';

const CODE = 'CC6.2';

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
