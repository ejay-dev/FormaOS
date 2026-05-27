/**
 * NDIS-V.2 — Implementing Behaviour Support — restrictive practices oversight.
 *
 * STATUTORY (Audit 2026-05-27 Phase 3):
 *   - F2018L00632 — Restrictive Practices and Behaviour Support Rules 2018
 *   - Interim BSP within 1 month of first regulated restrictive practice use
 *   - Comprehensive BSP within 6 months
 *   - Monthly reporting within 5 business days of month end (Commission P28.1)
 *   - Unauthorised RP use = reportable within 5 business days
 *
 * Predicate joins org_behaviour_support_plans (new in migration 20260624067)
 * with org_registers (type='restrictive_practice_use'). Returns:
 *   - fail when interim or comprehensive timing is missed (statutory breach)
 *   - partial when authorisation drift or expiry exists
 *   - manual when no RP use AND no BSPs (control may not apply)
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateRestrictivePracticesOversight } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateRestrictivePracticesOversight(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-V.2',
  evaluator: evaluate,
};

export { evaluate };
