/**
 * NDIS-2.5 — Feedback and complaints management.
 *
 * Phase 2 (Audit 2026-05-27): real predicate against org_registers
 * filtered to type='complaint' or category='complaint'. Pass when
 * resolved within 30 days; partial when >30-day open complaints exist;
 * partial-with-flag when zero complaints (likely under-reporting).
 * ⚠️ Expert review required.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateComplaintsManagement } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateComplaintsManagement(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-2.5',
  evaluator: evaluate,
};

export { evaluate };
