/**
 * AFCA-001 — AFCA Membership Compliance (AFCA Rules).
 *
 * Manual attestation: the AFCA membership certificate and annual
 * compliance certificate are external documents; FormaOS does not hold
 * AFCA membership state as a structured row.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'AFCA-001',
  'Current AFCA membership certificate, lodged annual compliance certificate, and AFCA complaint response-time tracking (AFCA Rules) — manual attestation.',
);

export { evaluate, meta };
