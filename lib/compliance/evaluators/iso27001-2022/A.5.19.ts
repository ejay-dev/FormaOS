/**
 * ISO/IEC 27001:2022 A.5.19 — "Information security in supplier relationships"
 *
 * Signal: org_risks rows in vendor / supplier / third-party
 * categories, reviewed inside the 365-day cadence (delegates to the
 * shared evaluateSupplierRisks helper).
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateSupplierRisks } from './_shared';

const CODE = 'A.5.19';

const evaluate: ControlEvaluator = async ({ orgId, db }) =>
  evaluateSupplierRisks({
    controlCode: CODE,
    orgId,
    db,
    reviewWindowDays: 365,
    emptyMessage:
      'org_risks has no vendor / supplier / third-party entries — A.5.19 requires a supplier-risk workflow.',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
