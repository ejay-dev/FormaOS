/**
 * NDIS-4.1 — Safe environment.
 * Phase 3: real predicate. Counts org_registers entries of
 * type='environment_assessment'; pass when all reviewed within 12 months.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateSafeEnvironment } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateSafeEnvironment(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-4.1',
  evaluator: evaluate,
};

export { evaluate };
