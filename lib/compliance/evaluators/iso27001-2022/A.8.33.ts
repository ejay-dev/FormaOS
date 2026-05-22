/**
 * ISO/IEC 27001:2022 A.8.33 — "Test information"
 *
 * A.8.33 requires evidence that test environments use masked or synthetic data — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.33',
  'A.8.33 requires evidence that test environments use masked or synthetic data — manual attestation.',
);

export { evaluate, meta };
