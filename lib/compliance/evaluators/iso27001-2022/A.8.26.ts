/**
 * ISO/IEC 27001:2022 A.8.26 — "Application security requirements"
 *
 * A.8.26 requires a per-application security-requirements register — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.26',
  'A.8.26 requires a per-application security-requirements register — manual attestation.',
);

export { evaluate, meta };
