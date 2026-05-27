/**
 * NDIS-2.7 — Human resource management.
 *
 * Phase 2 (Audit 2026-05-27): real predicate against at_risk_credentials.
 * Zero flagged credentials = pass. Any expired credential = fail
 * (statutory under NDIS Worker Screening). ⚠️ Expert review required.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateHrManagement } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateHrManagement(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-2.7',
  evaluator: evaluate,
};

export { evaluate };
