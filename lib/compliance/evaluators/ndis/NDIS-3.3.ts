/**
 * NDIS-3.3 — Service agreements.
 * Phase 3: real predicate. Checks org_form_submissions tagged
 * metadata.form_type='service_agreement' OR org_registers type='service_agreement'.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateServiceAgreements } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateServiceAgreements(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-3.3',
  evaluator: evaluate,
};

export { evaluate };
