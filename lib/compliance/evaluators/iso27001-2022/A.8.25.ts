/**
 * ISO/IEC 27001:2022 A.8.25 — "Secure development life cycle"
 *
 * A.8.25 requires documented SDLC stages with security gates — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.25',
  'A.8.25 requires documented SDLC stages with security gates — manual attestation.',
);

export { evaluate, meta };
