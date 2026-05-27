/**
 * NDIS-3.4 — Responsive support provision.
 *
 * Phase 2 (Audit 2026-05-27): real predicate. Counts progress notes in
 * the last 90 days. Pass ≥30, partial for fewer, fail at zero.
 * ⚠️ Expert review required for per-participant cadence calibration.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateResponsiveSupport } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateResponsiveSupport(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-3.4',
  evaluator: evaluate,
};

export { evaluate };
