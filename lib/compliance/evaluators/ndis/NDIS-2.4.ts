/**
 * NDIS-2.4 — Information management.
 *
 * Phase 2 (Audit 2026-05-27): real predicate against audit_log activity.
 * Pass when ≥30 audit_log rows in the last 90 days; partial for fewer;
 * fail for zero. ⚠️ Expert review required for threshold calibration.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateInformationManagement } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateInformationManagement(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-2.4',
  evaluator: evaluate,
};

export { evaluate };
