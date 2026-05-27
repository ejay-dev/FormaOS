/**
 * NDIS-2.2 — Risk management.
 *
 * Phase 2 (Audit 2026-05-27): real predicate against org_risks. Pass
 * when ≥80% of risks reviewed within 90 days; partial 40–79%; fail
 * below 40% or empty register. ⚠️ Expert review required.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateRiskManagement } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateRiskManagement(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-2.2',
  evaluator: evaluate,
};

export { evaluate };
