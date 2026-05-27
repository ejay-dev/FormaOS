/**
 * NDIS-1.1 — Person-centred supports.
 *
 * Phase 2 (Audit 2026-05-27): real predicate against org_care_plans.
 * Pass when ≥90% of care plans were reviewed within 180 days; partial
 * 50–89%; fail below 50%. ⚠️ Thresholds are engineering best-guesses —
 * expert review required before customers rely on the verdict for
 * certification.
 */

import type {
  ControlEvaluator,
  ControlEvaluatorMeta,
} from '../types';
import { evaluatePersonCentredSupports } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluatePersonCentredSupports(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-1.1',
  evaluator: evaluate,
};

export { evaluate };
