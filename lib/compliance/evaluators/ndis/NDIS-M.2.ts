/**
 * NDIS-M.2 — Restrictive practices and consent.
 *
 * Phase 3: real predicate joining org_behaviour_support_plans
 * (comprehensive plans + authorisation status) with org_form_submissions
 * tagged metadata.form_type='restrictive_practice_consent'.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateRestrictivePracticesConsent } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateRestrictivePracticesConsent(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-M.2',
  evaluator: evaluate,
};

export { evaluate };
