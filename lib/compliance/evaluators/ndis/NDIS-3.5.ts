/**
 * NDIS-3.5 — Transitions to or from a provider.
 * Phase 3: real predicate. Counts org_registers entries of type='transition'.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateTransitions } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateTransitions(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-3.5',
  evaluator: evaluate,
};

export { evaluate };
