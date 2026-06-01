/**
 * AFS-007 — Annual Compliance Certificate (s912A(1)(ca) Corporations
 * Act 2001).
 *
 * Manual attestation: the self-assessment, certificate of compliance,
 * and ASIC lodgement confirmation are documents held outside FormaOS.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'AFS-007',
  'Completed annual self-assessment, certificate of compliance, and ASIC lodgement confirmation by due date (s912A(1)(ca)) — manual attestation.',
);

export { evaluate, meta };
