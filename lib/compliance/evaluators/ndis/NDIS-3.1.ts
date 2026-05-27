/**
 * NDIS-3.1 — Access to supports.
 * Phase 3: real predicate. Counts org_registers entries of type='intake'.
 * Returns manual when none on file (Stage 2 confirms eligibility process).
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateAccessToSupports } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateAccessToSupports(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-3.1',
  evaluator: evaluate,
};

export { evaluate };
