/**
 * NDIS-1.3 — Privacy and dignity.
 * Phase 3 (Audit 2026-05-27): real predicate against org_policies where
 * ndis_category='privacy' AND status='published' AND updated within 12 months
 * (annual review is the published-guidance norm for compliance policies).
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluatePrivacyAndDignity } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluatePrivacyAndDignity(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-1.3',
  evaluator: evaluate,
};

export { evaluate };
