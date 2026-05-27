/**
 * NDIS-3.2 — Support planning.
 *
 * Phase 2 (Audit 2026-05-27): real predicate. Checks that ≥90% of care
 * plans have at least one documented goal in org_care_goals. ⚠️ Expert
 * review required.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateSupportPlanning } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateSupportPlanning(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-3.2',
  evaluator: evaluate,
};

export { evaluate };
