/**
 * ISO/IEC 27001:2022 A.7.10 — "Storage media"
 *
 * A.7.10 requires media-handling / disposal records — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.7.10',
  'A.7.10 requires media-handling / disposal records — manual attestation.',
);

export { evaluate, meta };
