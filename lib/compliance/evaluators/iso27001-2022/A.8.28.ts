/**
 * ISO/IEC 27001:2022 A.8.28 — "Secure coding"
 *
 * A.8.28 requires a secure-coding standard and engineer-training records — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.28',
  'A.8.28 requires a secure-coding standard and engineer-training records — manual attestation.',
);

export { evaluate, meta };
