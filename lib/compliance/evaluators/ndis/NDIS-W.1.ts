/**
 * NDIS-W.1 — Worker engagement and wellbeing.
 * Phase 3: real predicate. Counts org_registers entries of type='supervision'.
 * Pass when all updated within 6 months.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateWorkerEngagement } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateWorkerEngagement(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-W.1',
  evaluator: evaluate,
};

export { evaluate };
