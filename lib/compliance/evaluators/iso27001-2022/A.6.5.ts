/**
 * ISO/IEC 27001:2022 A.6.5 — "Responsibilities after termination or change of employment"
 *
 * A.6.5 requires termination acknowledgements held in HR systems — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.6.5',
  'A.6.5 requires termination acknowledgements held in HR systems — manual attestation.',
);

export { evaluate, meta };
