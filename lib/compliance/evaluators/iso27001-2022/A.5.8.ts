/**
 * ISO/IEC 27001:2022 A.5.8 — "Information security in project management"
 *
 * A.5.8 requires evidence of security gates in the project lifecycle — captured outside the platform; manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.5.8',
  'A.5.8 requires evidence of security gates in the project lifecycle — captured outside the platform; manual attestation.',
);

export { evaluate, meta };
