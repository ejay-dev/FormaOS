/**
 * AFS-002 — Responsible Manager Competency (RG 105 ASIC).
 *
 * Manual attestation: responsible-manager register with qualification
 * certificates and experience records lives in HR/governance documents
 * outside FormaOS.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'AFS-002',
  'Responsible-manager register with RG 105 qualification certificates and experience records — manual attestation.',
);

export { evaluate, meta };
