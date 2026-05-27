/**
 * NDIS-1.5 — Violence, abuse, neglect, exploitation and discrimination.
 *
 * Phase 2 (Audit 2026-05-27): real predicate. Checks org_incidents +
 * org_investigations activity over the last 12 months. Zero incidents
 * = partial (suspected under-reporting). Open critical incidents =
 * fail. ⚠️ Expert review required for threshold calibration.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateSafeguarding } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateSafeguarding(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-1.5',
  evaluator: evaluate,
};

export { evaluate };
