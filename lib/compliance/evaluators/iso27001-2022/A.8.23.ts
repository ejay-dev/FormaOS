/**
 * ISO/IEC 27001:2022 A.8.23 — "Web filtering"
 *
 * A.8.23 requires web-filter configuration evidence — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.23',
  'A.8.23 requires web-filter configuration evidence — manual attestation.',
);

export { evaluate, meta };
