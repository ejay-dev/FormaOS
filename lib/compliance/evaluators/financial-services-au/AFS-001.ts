/**
 * AFS-001 — AFS Licence Maintenance (s912A Corporations Act 2001).
 *
 * Manual attestation: a current AFS licence copy and ASIC change
 * notifications (within 10 business days of material change) are
 * documents held outside FormaOS's structured tables.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'AFS-001',
  'Current AFS licence copy + ASIC change notifications lodged within 10 business days of material change + quarterly licence-condition review minutes — manual attestation.',
);

export { evaluate, meta };
