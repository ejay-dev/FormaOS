/**
 * ISO/IEC 27001:2022 A.8.31 — "Separation of development, test and production environments"
 *
 * A.8.31 requires environment-topology evidence — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.31',
  'A.8.31 requires environment-topology evidence — manual attestation.',
);

export { evaluate, meta };
