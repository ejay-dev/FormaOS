/**
 * ISO/IEC 27001:2022 A.6.8 — "Information security event reporting"
 *
 * A.6.8 requires a documented reporting channel and staff awareness — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.6.8',
  'A.6.8 requires a documented reporting channel and staff awareness — manual attestation.',
);

export { evaluate, meta };
