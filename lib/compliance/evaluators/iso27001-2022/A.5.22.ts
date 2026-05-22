/**
 * ISO/IEC 27001:2022 A.5.22 — "Monitoring, review and change management of supplier services"
 *
 * Signal: org_risks rows in vendor / supplier categories reviewed
 * inside the 180-day cadence (delegates to evaluateSupplierRisks).
 */

import type { ControlEvaluator, ControlEvaluatorMeta } from '../types';
import { FRAMEWORK, evaluateSupplierRisks } from './_shared';

const CODE = 'A.5.22';

const evaluate: ControlEvaluator = async ({ orgId, db }) =>
  evaluateSupplierRisks({
    controlCode: CODE,
    orgId,
    db,
    reviewWindowDays: 180,
    emptyMessage:
      'org_risks has no vendor / supplier entries — A.5.22 requires ongoing supplier monitoring.',
  });

export const meta: ControlEvaluatorMeta = {
  framework: FRAMEWORK,
  controlCode: CODE,
  evaluator: evaluate,
};

export { evaluate };
