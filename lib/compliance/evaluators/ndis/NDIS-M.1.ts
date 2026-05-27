/**
 * NDIS-M.1 — Medication management.
 *
 * Phase 2 (Audit 2026-05-27): real predicate against
 * org_medication_administrations + org_incidents. Pass when
 * administrations are recorded and no critical incidents in the period;
 * partial when critical incidents coincide with med admin activity.
 * ⚠️ Expert review required — incident severity is a coarse proxy for
 * "medication error"; a future schema field on org_incidents.category
 * would let us narrow this down.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateMedicationManagement } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateMedicationManagement(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-M.1',
  evaluator: evaluate,
};

export { evaluate };
