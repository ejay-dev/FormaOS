/**
 * NDIS-2.1 — Governance and operational management.
 * Phase 3: real predicate. Checks (a) governance policy current
 * (org_policies ndis_category='governance'), (b) conflicts-of-interest
 * register entry (org_registers type='conflict_of_interest').
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateGovernance } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) => evaluateGovernance(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-2.1',
  evaluator: evaluate,
};

export { evaluate };
