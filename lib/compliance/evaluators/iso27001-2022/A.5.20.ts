/**
 * ISO/IEC 27001:2022 A.5.20 — "Addressing information security within supplier agreements"
 *
 * A.5.20 requires evidence that supplier contracts include security clauses — captured outside the platform; manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.20',
  'A.5.20 requires evidence that supplier contracts include security clauses — captured outside the platform; manual attestation.',
);

export { evaluate, meta };
