/**
 * NDIS-3.3 — Service agreements with participants.
 *
 * Phase 2 (Audit 2026-05-27): partial-signal predicate. Counts signed/
 * reviewed form submissions in the last 12 months as a proxy for service
 * agreements. Status defaults to `partial` because the FormaOS form
 * taxonomy doesn't yet distinguish service-agreement submissions from
 * other forms. ⚠️ A follow-up should add a service_agreement form_type
 * so this predicate can flip to a confident `pass`.
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
