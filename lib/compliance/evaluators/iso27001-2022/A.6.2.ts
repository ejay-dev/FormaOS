/**
 * ISO/IEC 27001:2022 A.6.2 — "Terms and conditions of employment"
 *
 * A.6.2 requires signed employment contracts with security clauses — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.6.2',
  'A.6.2 requires signed employment contracts with security clauses — manual attestation.',
);

export { evaluate, meta };
