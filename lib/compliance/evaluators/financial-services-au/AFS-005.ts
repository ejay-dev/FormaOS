/**
 * AFS-005 — Best Interest Duty Compliance (s961B Corporations Act 2001).
 *
 * Manual attestation: advice-file reviews, quality-assurance reports,
 * and adviser training records are not modelled as FormaOS rows.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'AFS-005',
  'Advice-file review program results, advice quality-assurance reports, and adviser training records evidencing best-interest-duty compliance (s961B) — manual attestation.',
);

export { evaluate, meta };
