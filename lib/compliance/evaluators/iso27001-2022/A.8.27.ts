/**
 * ISO/IEC 27001:2022 A.8.27 — "Secure system architecture and engineering principles"
 *
 * A.8.27 requires a documented architecture-principles artefact — manual attestation.
 */

import { makeManualEvaluator } from './_shared';

const { evaluator: evaluate, meta } = makeManualEvaluator(
  'A.8.27',
  'A.8.27 requires a documented architecture-principles artefact — manual attestation.',
);

export { evaluate, meta };
