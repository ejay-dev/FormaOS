/**
 * NDIS-2.8 — Continuity of supports.
 * Phase 3: real predicate. Checks org_registers (type='business_continuity_plan')
 * for at least one entry; pass when reviewed within 12 months.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateContinuityOfSupports } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateContinuityOfSupports(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-2.8',
  evaluator: evaluate,
};

export { evaluate };
