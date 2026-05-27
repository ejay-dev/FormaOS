/**
 * NDIS-2.3 — Quality management.
 *
 * Phase 2 (Audit 2026-05-27): real predicate against org_capa_items.
 * Pass when CAPA workflow has rows in the last 6 months AND no overdue
 * open items. Partial when there are overdue items. Manual-attestation
 * when the workflow is empty. ⚠️ Expert review required.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateQualityManagement } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateQualityManagement(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-2.3',
  evaluator: evaluate,
};

export { evaluate };
