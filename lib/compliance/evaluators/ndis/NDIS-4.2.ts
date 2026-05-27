/**
 * NDIS-4.2 — Participant money and property.
 * Phase 3: real predicate. Counts org_registers entries of
 * type='financial_delegation'.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateParticipantMoneyAndProperty } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateParticipantMoneyAndProperty(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-4.2',
  evaluator: evaluate,
};

export { evaluate };
