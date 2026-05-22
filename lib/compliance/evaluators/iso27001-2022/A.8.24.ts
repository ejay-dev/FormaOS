/**
 * ISO/IEC 27001:2022 A.8.24 — "Use of cryptography"
 *
 * A.8.24 requires an approved cryptography policy and key-rotation logs — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.24',
  'A.8.24 requires an approved cryptography policy and key-rotation logs — manual attestation.',
);

export { evaluate, meta };
