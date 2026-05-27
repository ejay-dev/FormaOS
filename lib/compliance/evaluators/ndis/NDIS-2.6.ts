/**
 * NDIS-2.6 — Incident management.
 *
 * Phase 2 (Audit 2026-05-27): real predicate. Checks org_incidents
 * activity + org_regulatory_notifications submission completeness.
 * Unsubmitted regulatory notifications = fail (NDIS Commission
 * notification timeframes are statutory). ⚠️ Expert review required.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateIncidentManagement } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateIncidentManagement(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-2.6',
  evaluator: evaluate,
};

export { evaluate };
