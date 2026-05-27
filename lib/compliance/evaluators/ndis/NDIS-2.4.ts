/**
 * NDIS-2.4 — Information management.
 * Phase 3: 3-part check — (1) information-mgmt policy current,
 * (2) retention_policies row active, (3) audit_log activity ≥30 rows
 * in 90 days. All 3 → pass; ≥1 → partial; 0 → fail.
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { evaluateInformationManagement } from './_predicates';

const evaluate: ControlEvaluator = async (ctx) =>
  evaluateInformationManagement(ctx, new Date().toISOString());

export const meta: ControlEvaluatorMeta = {
  framework: 'ndis',
  controlCode: 'NDIS-2.4',
  evaluator: evaluate,
};

export { evaluate };
